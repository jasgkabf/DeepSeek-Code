import { DeepSeekCodeConfig } from './types';
export declare class Chat {
    private config;
    private session;
    private rl;
    private running;
    constructor(config: DeepSeekCodeConfig);
    getConfig(): DeepSeekCodeConfig;
    setConfig(config: DeepSeekCodeConfig): void;
    start(): Promise<void>;
    private handleCommand;
    private showHelp;
    private showHistory;
    private showSessionsInteractive;
    private loadSessionById;
    private deleteSessionById;
    private handleUserMessage;
    stop(): void;
    private showSkills;
    private handleSkillCommand;
}
//# sourceMappingURL=chat.d.ts.map