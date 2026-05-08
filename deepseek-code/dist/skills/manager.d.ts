import { SkillManifest, InstalledSkillInfo } from './types';
export declare function ensureSkillsDir(): void;
export declare function getSkillsDir(): string;
export declare function listInstalledSkills(): InstalledSkillInfo[];
export declare function loadSkillManifest(skillName: string): SkillManifest | null;
export declare function findSkillDir(skillName: string): string | null;
export declare function isSkillInstalled(skillName: string): boolean;
export declare function installFromUrl(url: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function installFromFolder(folderPath: string): {
    success: boolean;
    message: string;
};
export declare function removeSkill(skillName: string): {
    success: boolean;
    message: string;
};
export declare function getAllSkillTools(): Array<{
    skillName: string;
    toolName: string;
    description: string;
    parameters: any;
}>;
//# sourceMappingURL=manager.d.ts.map