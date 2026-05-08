import * as path from 'path';
import * as fs from 'fs';
import { SkillManifest, SkillInstance } from './types';
import { loadSkillManifest, findSkillDir, listInstalledSkills } from './manager';
import { ToolDefinition } from '../types';

const loadedSkills = new Map<string, SkillInstance>();

export function loadSkill(skillName: string): SkillInstance | null {
  if (loadedSkills.has(skillName)) {
    return loadedSkills.get(skillName)!;
  }

  const skillDir = findSkillDir(skillName);
  if (!skillDir) return null;

  const manifest = loadSkillManifest(skillName);
  if (!manifest) return null;

  const mainPath = path.join(skillDir, manifest.main);
  if (!fs.existsSync(mainPath)) return null;

  try {
    delete require.cache[require.resolve(mainPath)];
    const skillModule = require(mainPath);

    if (typeof skillModule.execute !== 'function') {
      return null;
    }

    const instance: SkillInstance = {
      manifest,
      dir: skillDir,
      execute: skillModule.execute,
    };

    loadedSkills.set(skillName, instance);
    return instance;
  } catch {
    return null;
  }
}

export function loadAllSkills(): SkillInstance[] {
  const skills = listInstalledSkills();
  const instances: SkillInstance[] = [];
  loadedSkills.clear();

  for (const skill of skills) {
    const instance = loadSkill(skill.name);
    if (instance) {
      instances.push(instance);
    }
  }
  return instances;
}

export function getSkillToolDefinitions(): ToolDefinition[] {
  const instances = loadAllSkills();
  const definitions: ToolDefinition[] = [];

  for (const instance of instances) {
    for (const tool of instance.manifest.tools) {
      definitions.push({
        type: 'function',
        function: {
          name: tool.name,
          description: `[Skill: ${instance.manifest.name}] ${tool.description}`,
          parameters: tool.parameters,
        },
      });
    }
  }
  return definitions;
}

export async function executeSkillTool(toolName: string, args: any): Promise<string | null> {
  for (const [, instance] of loadedSkills) {
    const toolDef = instance.manifest.tools.find((t) => t.name === toolName);
    if (toolDef) {
      try {
        return await instance.execute(toolName, args);
      } catch (err: any) {
        return `Skill 工具执行错误 (${instance.manifest.name}/${toolName}): ${err.message}`;
      }
    }
  }
  return null;
}

export function isSkillTool(toolName: string): boolean {
  for (const [, instance] of loadedSkills) {
    if (instance.manifest.tools.some((t) => t.name === toolName)) {
      return true;
    }
  }
  return false;
}

export function unloadSkill(skillName: string): void {
  loadedSkills.delete(skillName);
}

export function clearLoadedSkills(): void {
  loadedSkills.clear();
}
