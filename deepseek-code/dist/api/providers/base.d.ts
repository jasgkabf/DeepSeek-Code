import { DeepSeekCodeConfig, ChatMessage, ToolDefinition, StreamCallbacks, ChatCompletionResult } from '../../types';
export declare abstract class LLMProviderBase {
    protected config: DeepSeekCodeConfig;
    constructor(config: DeepSeekCodeConfig);
    abstract chatCompletionStream(messages: ChatMessage[], tools: ToolDefinition[], callbacks: StreamCallbacks): Promise<ChatCompletionResult>;
    abstract chatCompletion(messages: ChatMessage[], tools: ToolDefinition[]): Promise<ChatCompletionResult>;
}
//# sourceMappingURL=base.d.ts.map