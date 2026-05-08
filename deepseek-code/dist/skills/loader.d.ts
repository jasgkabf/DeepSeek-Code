import { SkillInstance } from './types';
import { ToolDefinition } from '../types';
interface BuiltinSkillInfo {
    name: string;
    description: string;
    instructions: string;
}
export declare function loadBuiltinSkills(): BuiltinSkillInfo[];
export declare function buildBuiltinSkillsPrompt(): string;
export declare function listBuiltinSkillNames(): string[];
export declare function loadSkill(skillName: string): SkillInstance | null;
export declare function loadAllSkills(): SkillInstance[];
export declare function getSkillToolDefinitions(): ToolDefinition[];
export declare function executeSkillTool(toolName: string, args: any): Promise<string | null>;
export declare function isSkillTool(toolName: string): boolean;
export declare function unloadSkill(skillName: string): void;
export declare function clearLoadedSkills(): void;
export {};
//# sourceMappingURL=loader.d.ts.map