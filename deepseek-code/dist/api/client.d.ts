import { DeepSeekCodeConfig, ChatMessage, ToolDefinition, StreamCallbacks, ChatCompletionResult } from '../types';
export { StreamCallbacks, ChatCompletionResult } from '../types';
export { createProvider } from './providers';
export declare function chatCompletionStream(messages: ChatMessage[], tools: ToolDefinition[], config: DeepSeekCodeConfig, callbacks: StreamCallbacks): Promise<ChatCompletionResult>;
export declare function chatCompletion(messages: ChatMessage[], tools: ToolDefinition[], config: DeepSeekCodeConfig): Promise<ChatCompletionResult>;
//# sourceMappingURL=client.d.ts.map