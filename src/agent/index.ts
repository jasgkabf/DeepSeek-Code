import { ChatMessage, DeepSeekCodeConfig, ToolDefinition, ToolResult } from '../types';
import { chatCompletionStream, ChatCompletionResult, StreamCallbacks } from '../api/client';
import { TOOL_DEFINITIONS, buildToolResults, setToolConfig } from './tools';
import { showAssistantPrefix, showDivider, showError, showInfo, showWarning } from '../ui/display';
import { detectEnvironment } from '../env';
import { getSkillToolDefinitions, loadAllSkills, buildBuiltinSkillsPrompt, listBuiltinSkillNames } from '../skills/loader';
import { listInstalledSkills } from '../skills/manager';
import { buildMemoryPrompt } from '../memory';
import { t } from '../i18n';

const MAX_AGENT_ITERATIONS = 50;

interface ToolCallSignature {
  name: string;
  argsHash: string;
  iteration: number;
}

function hashArgs(argsStr: string): string {
  let hash = 0;
  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function buildSystemPrompt(): ChatMessage {
  const env = detectEnvironment();
  let envNote = '';
  if (env.isTermux) {
    envNote = `\n\n[Termux环境] 用pkg代替apt, 存储需termux-setup-storage, 屏幕窄注意行宽`;
  }

  const skills = listInstalledSkills();
  let skillNote = '';
  if (skills.length > 0) {
    const skillList = skills.map((s) => `${s.name}(${s.toolCount}工具)`).join(', ');
    skillNote = `\n\n[已安装Skills] ${skillList}`;
  }

  const builtinSkillsPrompt = buildBuiltinSkillsPrompt();
  const memoryPrompt = buildMemoryPrompt();

  return {
    role: 'system',
    content: `你是 DeepSeek Code 编程助手。自主执行任务，尽量不提问。

【核心原则】
1. 每个操作只执行一次，绝不重复调用相同工具做相同的事
2. 读完文件后直接修改，不要反复读同一文件
3. 命令执行成功后不要再次执行验证
4. 任务完成后立即停止，输出简要总结，不再做额外操作
5. 遇到错误分析原因后修复，不要反复尝试同一方法
6. 能独立解决绝不提问，只有涉及重大决策或不可逆操作时才请示

【工具】
- read_file: 读文件 | list_directory: 列目录
- write_file: 写文件 | append_file: 追加内容 | edit_file: 局部替换
- run_command: 执行Shell命令 | copy_to_clipboard: 复制到剪贴板

【防重复规则 - 必须遵守】
- 已读取过的文件不要再次读取（除非文件被修改过）
- 已执行成功的命令不要再次执行
- 已写入的文件不要再次写入相同内容
- 完成任务后直接回复用户，不要做额外验证步骤
- 一次任务尽量在3-5轮工具调用内完成

用中文回复，代码注释用英文。${envNote}${skillNote}${builtinSkillsPrompt}${memoryPrompt}`,
  };
}

function getAllToolDefinitions(): ToolDefinition[] {
  const builtIn = TOOL_DEFINITIONS;
  const skillTools = getSkillToolDefinitions();
  return [...builtIn, ...skillTools];
}

function isDuplicateCall(
  name: string,
  argsStr: string,
  history: ToolCallSignature[],
  currentIteration: number
): boolean {
  const hash = hashArgs(argsStr);
  const recentCalls = history.filter(
    (s) => currentIteration - s.iteration <= 2
  );
  return recentCalls.some((s) => s.name === name && s.argsHash === hash);
}

function detectLoop(history: ToolCallSignature[], currentIteration: number): boolean {
  if (history.length < 3) return false;
  const recent = history.slice(-3);
  if (recent.length < 3) return false;
  const sameName = recent.every((s) => s.name === recent[0].name);
  if (sameName) return true;
  const allSame = recent[0].name === recent[1].name && recent[0].argsHash === recent[1].argsHash;
  const lastTwoSame = recent[1].name === recent[2].name && recent[1].argsHash === recent[2].argsHash;
  return allSame || lastTwoSame;
}

function deduplicateToolCalls(
  toolCalls: Array<{ id: string; function: { name: string; arguments: string } }>
): Array<{ id: string; function: { name: string; arguments: string } }> {
  const seen = new Set<string>();
  return toolCalls.filter((tc) => {
    const key = `${tc.function.name}:${tc.function.arguments}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface AgentRunOptions {
  config: DeepSeekCodeConfig;
  messages: ChatMessage[];
  onContent?: (text: string) => void;
}

export async function runAgent(options: AgentRunOptions): Promise<ChatMessage[]> {
  const { config, messages, onContent } = options;
  setToolConfig(config);
  loadAllSkills();

  const systemPrompt = buildSystemPrompt();
  const allMessages: ChatMessage[] = [systemPrompt, ...messages];
  const newMessages: ChatMessage[] = [];
  const allTools = getAllToolDefinitions();
  let iteration = 0;
  const callHistory: ToolCallSignature[] = [];

  while (iteration < MAX_AGENT_ITERATIONS) {
    iteration++;

    const callbacks: StreamCallbacks = {
      onContent: (text) => {
        process.stdout.write(text);
        onContent?.(text);
      },
      onToolCallStart: () => {},
      onToolCallDelta: () => {},
      onDone: () => {},
      onError: (err) => {
        showError(`API 错误: ${err.message}`);
      },
    };

    let result: ChatCompletionResult;
    try {
      result = await chatCompletionStream(allMessages, allTools, config, callbacks);
    } catch (err: any) {
      showError(`请求失败: ${err.message}`);
      break;
    }

    const assistantMessage = result.message;
    allMessages.push(assistantMessage);
    newMessages.push(assistantMessage);

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      console.log();
      break;
    }

    const dedupedCalls = deduplicateToolCalls(assistantMessage.tool_calls);
    if (dedupedCalls.length < assistantMessage.tool_calls.length) {
      const removed = assistantMessage.tool_calls.length - dedupedCalls.length;
      showWarning(`已跳过 ${removed} 个重复工具调用`);
    }

    const filteredCalls = dedupedCalls.filter((tc) => {
      if (isDuplicateCall(tc.function.name, tc.function.arguments, callHistory, iteration)) {
        showWarning(`跳过重复调用: ${tc.function.name}`);
        return false;
      }
      return true;
    });

    if (filteredCalls.length === 0) {
      allMessages.push({
        role: 'tool',
        content: '所有工具调用均为重复操作，已自动跳过。请直接回复用户，不要再调用工具。',
        tool_call_id: dedupedCalls[0]?.id || 'skip',
      } as ChatMessage);
      newMessages.push({
        role: 'tool',
        content: '所有工具调用均为重复操作，已自动跳过。请直接回复用户，不要再调用工具。',
        tool_call_id: dedupedCalls[0]?.id || 'skip',
      } as ChatMessage);

      for (const tc of dedupedCalls) {
        callHistory.push({
          name: tc.function.name,
          argsHash: hashArgs(tc.function.arguments),
          iteration,
        });
      }

      showDivider();
      showAssistantPrefix();
      continue;
    }

    for (const tc of filteredCalls) {
      callHistory.push({
        name: tc.function.name,
        argsHash: hashArgs(tc.function.arguments),
        iteration,
      });
    }

    if (detectLoop(callHistory, iteration)) {
      showWarning('检测到工具调用循环，自动终止');
      break;
    }

    console.log();
    showDivider();

    const toolResults = await buildToolResults(filteredCalls);

    for (const tr of toolResults) {
      allMessages.push(tr as ChatMessage);
      newMessages.push(tr as ChatMessage);
    }

    showDivider();
    showAssistantPrefix();
  }

  if (iteration >= MAX_AGENT_ITERATIONS) {
    showInfo(t().agent.maxIterations);
  }

  return newMessages;
}
