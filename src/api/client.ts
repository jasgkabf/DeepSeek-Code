import { DeepSeekCodeConfig, ChatMessage, ToolDefinition, StreamCallbacks, ChatCompletionResult } from '../types';
import { createProvider, LLMProviderBase } from './providers';

export { StreamCallbacks, ChatCompletionResult } from '../types';
export { createProvider } from './providers';

export async function chatCompletionStream(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  config: DeepSeekCodeConfig,
  callbacks: StreamCallbacks
): Promise<ChatCompletionResult> {
  const provider = createProvider(config);
  return provider.chatCompletionStream(messages, tools, callbacks);
}

export async function chatCompletion(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  config: DeepSeekCodeConfig
): Promise<ChatCompletionResult> {
  const provider = createProvider(config);
  return provider.chatCompletion(messages, tools);
}
