import { ChatMessage, DeepSeekCodeConfig, ToolDefinition, ToolResult } from '../types';
import { chatCompletionStream, ChatCompletionResult, StreamCallbacks } from '../api/client';
import { TOOL_DEFINITIONS, buildToolResults, setToolConfig } from './tools';
import { BudgetController, DEFAULT_BUDGET, BudgetExceededReason } from './budget';
import { showAssistantPrefix, showDivider, showError, showInfo, showWarning } from '../ui/display';
import { detectEnvironment } from '../env';
import { getSkillToolDefinitions, loadAllSkills, listBuiltinSkillNames } from '../skills/loader';
import { listInstalledSkills } from '../skills/manager';
import { buildMemoryPrompt } from '../memory';
import { t } from '../i18n';
import { audit, AuditEventType } from '../telemetry';
import { ErrorCode, AgentError } from '../errors';

interface ToolCallRecord {
  name: string;
  argsKey: string;
  result: string;
}

function makeArgsKey(name: string, argsStr: string): string {
  try {
    const args = JSON.parse(argsStr);
    if (name === 'read_file' || name === 'list_directory') {
      return `${name}:${args.path || ''}`;
    }
    if (name === 'write_file' || name === 'append_file') {
      return `${name}:${args.path || ''}`;
    }
    if (name === 'edit_file') {
      return `${name}:${args.path || ''}:${(args.old_text || '').substring(0, 50)}`;
    }
    if (name === 'run_command') {
      return `${name}:${(args.command || '').trim()}`;
    }
    return `${name}:${argsStr}`;
  } catch {
    return `${name}:${argsStr}`;
  }
}

async function buildSystemPrompt(): Promise<ChatMessage> {
  const env = detectEnvironment();
  let envNote = '';
  if (env.isTermux) {
    envNote = `\n[Termux] 用pkg代替apt, 存储需termux-setup-storage`;
  }

  const skills = listInstalledSkills();
  let skillNote = '';
  if (skills.length > 0) {
    const skillList = skills.map((s) => `${s.name}(${s.toolCount}工具)`).join(', ');
    skillNote = `\n[已安装Skills] ${skillList}`;
  }

  const builtinNames = await listBuiltinSkillNames();
  let builtinNote = '';
  if (builtinNames.length > 0) {
    builtinNote = `\n[内置Skills] ${builtinNames.join(', ')} (需要时用read_file读取skills-builtin/<名称>/SKILL.md)`;
  }

  const memoryPrompt = await buildMemoryPrompt();

  return {
    role: 'system',
    content: `你是 DeepSeek Code 编程助手。自主执行，尽量不提问。

【绝对禁止 - 重复操作】
- 同一个工具+同一个参数在整个对话中只能调用一次，系统会自动拦截重复调用
- 命令无输出说明没找到结果，换个方法，不要重试同一命令
- 文件已写入成功就不要再写一次
- 任务完成后立即回复用户总结，不要做额外验证

【工具】
read_file | list_directory | write_file | append_file | edit_file | run_command | copy_to_clipboard

【执行原则】
1. 先分析再动手，一次做对
2. 读完文件直接改，不要反复读
3. 命令失败就换方法，不要重试
4. 能独立解决不提问，重大决策才请示
5. 3-5轮内完成任务

用中文回复，代码注释英文。${envNote}${skillNote}${builtinNote}${memoryPrompt}`,
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
  executedCalls: ToolCallRecord[]
): ToolCallRecord | null {
  const key = makeArgsKey(name, argsStr);
  return executedCalls.find((r) => r.argsKey === key) || null;
}

function isSimilarCommand(newCmd: string, oldCmd: string): boolean {
  const normalize = (c: string) => c.replace(/\s+/g, ' ').replace(/['"]/g, '"').trim();
  return normalize(newCmd) === normalize(oldCmd);
}

function detectLoop(executedCalls: ToolCallRecord[]): boolean {
  const len = executedCalls.length;
  if (len < 3) return false;
  const last3 = executedCalls.slice(-3);
  const sameTool = last3.every((s) => s.name === last3[0].name);
  if (sameTool) {
    if (last3[0].name === 'run_command') {
      const cmd0 = last3[0].argsKey.replace('run_command:', '');
      const cmd1 = last3[1].argsKey.replace('run_command:', '');
      const cmd2 = last3[2].argsKey.replace('run_command:', '');
      if (isSimilarCommand(cmd0, cmd1) || isSimilarCommand(cmd1, cmd2)) return true;
    } else {
      return true;
    }
  }
  if (len >= 2) {
    const last2 = executedCalls.slice(-2);
    if (last2[0].argsKey === last2[1].argsKey) return true;
  }
  return false;
}

function deduplicateToolCalls(
  toolCalls: Array<{ id: string; function: { name: string; arguments: string } }>
): Array<{ id: string; function: { name: string; arguments: string } }> {
  const seen = new Set<string>();
  return toolCalls.filter((tc) => {
    const key = makeArgsKey(tc.function.name, tc.function.arguments);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function enhanceToolResult(name: string, argsStr: string, result: string, executedCalls: ToolCallRecord[]): string {
  let enhanced = result;

  if (name === 'run_command') {
    if (result === '(命令执行完成，无输出)' || result.trim() === '') {
      enhanced = result + '\n[提示] 命令无输出，说明没有匹配结果。请换一种方法，不要重复执行相同或类似命令。';
    }
  }

  if (name === 'read_file' || name === 'list_directory') {
    const prevCalls = executedCalls.filter(
      (c) => c.name === name && c.result === result && c.argsKey !== makeArgsKey(name, argsStr)
    );
    if (prevCalls.length > 0 && result === prevCalls[prevCalls.length - 1].result) {
      enhanced = result + '\n[提示] 这个文件/目录你刚才已经读过了，内容没有变化。请直接基于已有内容操作，不要再次读取。';
    }
  }

  return enhanced;
}

export interface AgentRunOptions {
  config: DeepSeekCodeConfig;
  messages: ChatMessage[];
  onContent?: (text: string) => void;
  onToolCall?: (name: string, args: string) => void;
  onToolResult?: (name: string, result: string, isError: boolean) => void;
  budget?: Partial<typeof DEFAULT_BUDGET>;
}

export async function runAgent(options: AgentRunOptions): Promise<ChatMessage[]> {
  const { config, messages, onContent, onToolCall, onToolResult } = options;
  setToolConfig(config);
  loadAllSkills();

  const systemPrompt = await buildSystemPrompt();
  const allMessages: ChatMessage[] = [systemPrompt, ...messages];
  const newMessages: ChatMessage[] = [];
  const allTools = getAllToolDefinitions();
  const budget = new BudgetController(options.budget);
  const executedCalls: ToolCallRecord[] = [];
  let consecutiveSkips = 0;

  audit(AuditEventType.AGENT_STEP, { phase: 'start', budget: budget.getConfig() });

  while (!budget.exceeded()) {
    const stepReason = budget.step();
    if (stepReason) {
      showWarning(`预算超限: ${stepReason} | ${budget.summary()}`);
      audit(AuditEventType.BUDGET_EXCEEDED, { reason: stepReason, state: budget.getState() });
      break;
    }

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
      audit(AuditEventType.API_RESPONSE, { usage: result.usage });
    } catch (err: any) {
      const classified = new AgentError(ErrorCode.MODEL_ERROR, err.message, { cause: err, recoverable: true });
      audit(AuditEventType.AGENT_ERROR, { code: classified.code, message: classified.message });
      showError(`请求失败: ${err.message}`);
      break;
    }

    if (result.usage) {
      const tokenReason = budget.recordTokens(result.usage.prompt_tokens, result.usage.completion_tokens);
      if (tokenReason) {
        showWarning(`Token 预算超限: ${tokenReason}`);
        break;
      }
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
      showWarning(`已跳过 ${removed} 个本轮重复调用`);
      audit(AuditEventType.DUPLICATE_BLOCKED, { count: removed });
    }

    const callsToExecute: Array<{ id: string; function: { name: string; arguments: string } }> = [];
    const skippedCalls: Array<{ id: string; function: { name: string; arguments: string } }> = [];

    for (const tc of dedupedCalls) {
      const prev = isDuplicateCall(tc.function.name, tc.function.arguments, executedCalls);
      if (prev) {
        skippedCalls.push(tc);
        showWarning(`跳过重复: ${tc.function.name} (已执行过)`);
        audit(AuditEventType.DUPLICATE_BLOCKED, { tool: tc.function.name, argsKey: makeArgsKey(tc.function.name, tc.function.arguments) });
      } else {
        callsToExecute.push(tc);
      }
    }

    const toolResultMessages: ChatMessage[] = [];

    for (const tc of skippedCalls) {
      const prev = isDuplicateCall(tc.function.name, tc.function.arguments, executedCalls);
      const skipMsg = `此操作已在之前执行过，结果为:\n${(prev?.result || '').substring(0, 300)}\n\n[系统] 请勿重复执行相同操作，直接基于已有结果继续，或换一种方法。`;
      toolResultMessages.push({
        role: 'tool',
        content: skipMsg,
        tool_call_id: tc.id,
      } as ChatMessage);
    }

    if (callsToExecute.length === 0) {
      consecutiveSkips++;
      for (const msg of toolResultMessages) {
        allMessages.push(msg);
        newMessages.push(msg);
      }

      if (consecutiveSkips >= 2) {
        showWarning('连续多次重复调用，强制终止');
        audit(AuditEventType.LOOP_DETECTED, { consecutiveSkips });
        break;
      }

      showDivider();
      showAssistantPrefix();
      continue;
    }

    consecutiveSkips = 0;

    for (const tc of callsToExecute) {
      onToolCall?.(tc.function.name, tc.function.arguments);
      executedCalls.push({
        name: tc.function.name,
        argsKey: makeArgsKey(tc.function.name, tc.function.arguments),
        result: '',
      });
    }

    if (detectLoop(executedCalls)) {
      showWarning('检测到工具调用循环，自动终止');
      audit(AuditEventType.LOOP_DETECTED, { recentCalls: executedCalls.slice(-3).map((c) => c.argsKey) });
      break;
    }

    console.log();
    showDivider();

    const toolResults = await buildToolResults(callsToExecute);

    for (let i = 0; i < toolResults.length; i++) {
      const tr = toolResults[i];
      const tc = callsToExecute[i];
      const enhancedContent = enhanceToolResult(tc.function.name, tc.function.arguments, tr.content, executedCalls);
      const toolSuccess = !tr.content.startsWith('错误:');

      const toolReason = budget.recordToolCall(toolSuccess);
      if (toolReason) {
        showWarning(`工具调用预算超限: ${toolReason}`);
        break;
      }

      const recordIdx = executedCalls.length - callsToExecute.length + i;
      if (recordIdx >= 0 && recordIdx < executedCalls.length) {
        executedCalls[recordIdx].result = tr.content.substring(0, 500);
      }

      onToolResult?.(tc.function.name, tr.content, !toolSuccess);

      const msg: ChatMessage = {
        role: 'tool',
        content: enhancedContent,
        tool_call_id: tr.tool_call_id,
      } as ChatMessage;

      toolResultMessages.push(msg);
    }

    for (const msg of toolResultMessages) {
      allMessages.push(msg);
      newMessages.push(msg);
    }

    showDivider();
    showAssistantPrefix();
  }

  audit(AuditEventType.AGENT_COMPLETE, { state: budget.getState() });
  showInfo(budget.summary());

  return newMessages;
}
