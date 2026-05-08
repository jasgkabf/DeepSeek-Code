import { DeepSeekCodeConfig, ChatMessage, ToolDefinition, StreamCallbacks, ChatCompletionResult } from '../../types';

export abstract class LLMProviderBase {
  protected config: DeepSeekCodeConfig;

  constructor(config: DeepSeekCodeConfig) {
    this.config = config;
  }

  abstract chatCompletionStream(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    callbacks: StreamCallbacks
  ): Promise<ChatCompletionResult>;

  abstract chatCompletion(
    messages: ChatMessage[],
    tools: ToolDefinition[]
  ): Promise<ChatCompletionResult>;
}
