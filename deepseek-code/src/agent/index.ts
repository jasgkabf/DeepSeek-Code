import { ChatMessage, DeepSeekCodeConfig, ToolDefinition, ToolResult } from '../types';
import { chatCompletionStream, ChatCompletionResult, StreamCallbacks } from '../api/client';
import { TOOL_DEFINITIONS, buildToolResults } from './tools';
import { showAssistantPrefix, showDivider, showError } from '../ui/display';

const MAX_AGENT_ITERATIONS = 10;

const SYSTEM_PROMPT: ChatMessage = {
  role: 'system',
  content: `你是 DeepSeek Code，一个强大的命令行 AI 编程助手。你可以帮助用户编写代码、调试问题、管理项目文件和执行命令。

你具备以下工具能力：
- read_file: 读取项目文件内容
- list_directory: 遍历目录、查看文件列表
- write_file: 创建新文件或覆盖写入文件
- edit_file: 局部修改代码（查找替换）
- run_command: 执行 Shell 命令（npm、git、运行脚本等）

工作原则：
1. 先理解用户需求，再选择合适的工具
2. 修改代码前先读取文件了解现有内容
3. 执行命令前确认安全性
4. 给出清晰的解释和操作步骤
5. 遇到错误时分析原因并提供解决方案

请用中文回复用户，代码注释使用英文。`,
};

export interface AgentRunOptions {
  config: DeepSeekCodeConfig;
  messages: ChatMessage[];
  onContent?: (text: string) => void;
}

export async function runAgent(options: AgentRunOptions): Promise<ChatMessage[]> {
  const { config, messages, onContent } = options;
  const allMessages: ChatMessage[] = [SYSTEM_PROMPT, ...messages];
  const newMessages: ChatMessage[] = [];
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
      result = await chatCompletionStream(allMessages, TOOL_DEFINITIONS, config, callbacks);
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
    showError('已达到最大 Agent 迭代次数');
  }

  return newMessages;
}
