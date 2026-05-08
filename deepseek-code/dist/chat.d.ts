import { DeepSeekCodeConfig } from './types';
export declare class Chat {
    private config;
    private session;
    private rl;
    private running;
    constructor(config: DeepSeekCodeConfig);
    start(): Promise<void>;
    private handleCommand;
    private showHelp;
    private showHistory;
    private handleUserMessage;
    stop(): void;
}
//# sourceMappingURL=chat.d.ts.map