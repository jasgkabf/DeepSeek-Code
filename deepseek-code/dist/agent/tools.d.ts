import { ToolDefinition, ToolResult, DeepSeekCodeConfig } from '../types';
export declare const TOOL_DEFINITIONS: ToolDefinition[];
export declare function setToolConfig(config: DeepSeekCodeConfig): void;
export declare function executeTool(name: string, argsStr: string): Promise<string>;
export declare function buildToolResults(toolCalls: Array<{
    id: string;
    function: {
        name: string;
        arguments: string;
    };
}>): Promise<ToolResult[]>;
//# sourceMappingURL=tools.d.ts.map