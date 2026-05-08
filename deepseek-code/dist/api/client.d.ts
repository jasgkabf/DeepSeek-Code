import { DeepSeekCodeConfig, ChatMessage, ToolDefinition, ToolCall } from '../types';
export interface StreamCallbacks {
    onContent: (text: string) => void;
    onToolCallStart: (toolCall: ToolCall) => void;
    onToolCallDelta: (index: number, argsDelta: string) => void;
    onDone: () => void;
    onError: (error: Error) => void;
}
export interface ChatCompletionResult {
    message: ChatMessage;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export declare function chatCompletionStream(messages: ChatMessage[], tools: ToolDefinition[], config: DeepSeekCodeConfig, callbacks: StreamCallbacks): Promise<ChatCompletionResult>;
export declare function chatCompletion(messages: ChatMessage[], tools: ToolDefinition[], config: DeepSeekCodeConfig): Promise<ChatCompletionResult>;
//# sourceMappingURL=client.d.ts.map