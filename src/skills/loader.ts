import * as path from 'path';
import * as fs from 'fs';
import { SkillManifest, SkillInstance } from './types';
import { loadSkillManifest, findSkillDir, listInstalledSkills } from './manager';
import { ToolDefinition } from '../types';

const loadedSkills = new Map<string, SkillInstance>();

const BUILTIN_SKILLS_DIR = path.join(__dirname, '..', '..', 'skills-builtin');

interface BuiltinSkillInfo {
  name: string;
  description: string;
  instructions: string;
}

function parseSkillMd(skillDir: string): BuiltinSkillInfo | null {
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) return null;

  try {
    const content = fs.readFileSync(skillMdPath, 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) return null;

    const frontmatter = frontmatterMatch[1];
    const instructions = frontmatterMatch[2].trim();

    let name = '';
    let description = '';
    for (const line of frontmatter.split('\n')) {
      const nameMatch = line.match(/^name:\s*(.+)$/);
      if (nameMatch) name = nameMatch[1].trim();
      const descMatch = line.match(/^description:\s*(.+)$/);
      if (descMatch) description = descMatch[1].trim();
    }

    if (!name) return null;
    return { name, description, instructions };
  } catch {
    return null;
  }
}

export function loadBuiltinSkills(): BuiltinSkillInfo[] {
  const skills: BuiltinSkillInfo[] = [];
  if (!fs.existsSync(BUILTIN_SKILLS_DIR)) return skills;

  try {
    const entries = fs.readdirSync(BUILTIN_SKILLS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillDir = path.join(BUILTIN_SKILLS_DIR, entry.name);
      const info = parseSkillMd(skillDir);
      if (info) {
        skills.push(info);
      }
    }
  } catch { /* ignore */ }

  return skills;
}

export function buildBuiltinSkillsPrompt(): string {
  const skills = loadBuiltinSkills();
  if (skills.length === 0) return '';

  let prompt = '\n\n[内置Skills] 可用领域知识（按需参考）：';
  for (const skill of skills) {
    const shortDesc = skill.instructions.substring(0, 500);
    prompt += `\n- ${skill.name}: ${skill.description}${shortDesc ? ' | ' + shortDesc + (skill.instructions.length > 500 ? '...' : '') : ''}`;
  }
  return prompt;
}

export function listBuiltinSkillNames(): string[] {
  return loadBuiltinSkills().map((s) => s.name);
}

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
