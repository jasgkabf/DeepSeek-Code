export interface SkillToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required: string[];
    };
}
export interface SkillManifest {
    name: string;
    version: string;
    description: string;
    author?: string;
    main: string;
    tools: SkillToolDefinition[];
}
export interface SkillInstance {
    manifest: SkillManifest;
    dir: string;
    execute: (toolName: string, args: any) => Promise<string>;
}
export interface InstalledSkillInfo {
    name: string;
    version: string;
    description: string;
    author?: string;
    toolCount: number;
    dir: string;
}
//# sourceMappingURL=types.d.ts.map