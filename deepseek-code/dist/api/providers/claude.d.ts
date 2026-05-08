import { ChatMessage, ToolDefinition, StreamCallbacks, ChatCompletionResult } from '../../types';
import { LLMProviderBase } from './base';
export declare class ClaudeProvider extends LLMProviderBase {
    chatCompletionStream(messages: ChatMessage[], tools: ToolDefinition[], callbacks: StreamCallbacks): Promise<ChatCompletionResult>;
    chatCompletion(messages: ChatMessage[], tools: ToolDefinition[]): Promise<ChatCompletionResult>;
}
//# sourceMappingURL=claude.d.ts.map