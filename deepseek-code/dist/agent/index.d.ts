import { ChatMessage, DeepSeekCodeConfig } from '../types';
export interface AgentRunOptions {
    config: DeepSeekCodeConfig;
    messages: ChatMessage[];
    onContent?: (text: string) => void;
}
export declare function runAgent(options: AgentRunOptions): Promise<ChatMessage[]>;
//# sourceMappingURL=index.d.ts.map