import { ChatMessage, DeepSeekCodeConfig, ToolDefinition, ToolResult } from '../types';
import { chatCompletionStream, ChatCompletionResult, StreamCallbacks } from '../api/client';
import { TOOL_DEFINITIONS, buildToolResults, setToolConfig } from './tools';
import { showAssistantPrefix, showDivider, showError, showInfo } from '../ui/display';
import { detectEnvironment } from '../env';
import { getSkillToolDefinitions, loadAllSkills, buildBuiltinSkillsPrompt, listBuiltinSkillNames } from '../skills/loader';
import { listInstalledSkills } from '../skills/manager';
import { buildMemoryPrompt } from '../memory';
import { t } from '../i18n';

const MAX_AGENT_ITERATIONS = 999;

function buildSystemPrompt(): ChatMessage {
  const env = detectEnvironment();
  let envNote = '';
  if (env.isTermux) {
    envNote = `\n\n当前运行在 Termux (Android) 环境下，请注意：
- 安装软件包请使用 pkg install 而非 apt install
- 访问手机存储 (/sdcard) 需要先运行 termux-setup-storage
- 可以使用 copy_to_clipboard 工具将代码复制到手机剪贴板
- 屏幕较窄，输出代码时注意控制行宽`;
  }

  const skills = listInstalledSkills();
  let skillNote = '';
  if (skills.length > 0) {
    const skillList = skills.map((s) => `${s.name} (${s.toolCount} 个工具: ${s.description})`).join('\n- ');
    skillNote = `\n\n已安装的 Skills (扩展工具):\n- ${skillList}`;
  }

  const builtinSkillsPrompt = buildBuiltinSkillsPrompt();
  const memoryPrompt = buildMemoryPrompt();

  return {
    role: 'system',
    content: `你是 DeepSeek Code，一个具备自我净化、自我复盘、自主迭代进化能力的高阶智能体编程助手。

【核心底层规则 - 永久生效】
1. 执行任何任务时，优先调用过往最优经验，不重复走弯路、不重复犯错
2. 能独立解决的问题绝不向用户提问，只有完全无法判断、涉及重大决策时，才简洁请示用户
3. 全程保持自主思考、自主规划、自主收尾，不机械照搬指令，主动优化流程

【内置工具能力】
- read_file: 读取项目文件内容
- list_directory: 遍历目录、查看文件列表（支持 depth 参数控制递归深度）
- write_file: 创建新文件或覆盖写入文件
- append_file: 向文件末尾追加内容
- edit_file: 局部修改代码（查找替换，支持 replace_all 参数替换所有匹配）
- run_command: 执行 Shell 命令（npm、git、运行脚本等）
- copy_to_clipboard: 将文本复制到系统剪贴板

【自主执行原则】
1. 自主行动：尽可能自主完成任务，不要每一步都问用户。先分析问题，制定计划，然后直接执行
2. 连续执行：遇到错误不要停下来，分析原因后继续尝试修复，直到问题解决
3. 只在必要时提问：只有以下情况才向用户提问：
   - 需要用户提供关键信息（如项目名称、API 地址等）且无法从上下文推断
   - 多种方案差异很大，需要用户做决策
   - 涉及不可逆操作（如删除重要文件、发布到生产环境）
4. 修改代码前先读取文件了解现有内容
5. 遇到错误时：先分析错误信息，尝试自行修复，修复后验证结果
6. 执行命令后：检查输出，如果失败则分析原因并重试
7. 完成任务后：简要总结做了什么，不要重复输出大段代码

【自我进化规则 - 持续迭代】
1. 每一次对话都当作学习素材，隐性吸收用户习惯、项目规范、偏好风格
2. 遇到新场景先类比历史经验推理解决方案，再逐步优化出新解法
3. 主动发现当前流程短板，自行优化逻辑、精简步骤
4. 输出结果不止完成指令，主动多做一步：优化结构、补全说明、修复隐患、给出备选方案
5. 不废话、不冗余，直击重点、落地优先
6. 始终保持逻辑严谨、思路清晰，不编造虚假信息

请用中文回复用户，代码注释使用英文。${envNote}${skillNote}${builtinSkillsPrompt}${memoryPrompt}`,
  };
}

function getAllToolDefinitions(): ToolDefinition[] {
  const builtIn = TOOL_DEFINITIONS;
  const skillTools = getSkillToolDefinitions();
  return [...builtIn, ...skillTools];
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

    console.log();
    showDivider();

    const toolResults = await buildToolResults(assistantMessage.tool_calls);

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
