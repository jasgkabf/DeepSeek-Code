import { DeepSeekCodeConfig } from './types';
export declare function ensureConfigDir(): void;
export declare function loadConfig(): DeepSeekCodeConfig;
export declare function saveConfig(config: DeepSeekCodeConfig): void;
export declare function isConfigured(config: DeepSeekCodeConfig): boolean;
export declare function setupWizard(): Promise<DeepSeekCodeConfig>;
export declare function showConfig(config: DeepSeekCodeConfig): void;
export declare function setConfigValue(config: DeepSeekCodeConfig, key: string, value: string): DeepSeekCodeConfig;
//# sourceMappingURL=config.d.ts.map