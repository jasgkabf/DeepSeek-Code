import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import { SkillManifest, InstalledSkillInfo } from './types';

const SKILLS_DIR = path.join(os.homedir(), '.deepseek-code', 'skills');

export function ensureSkillsDir(): void {
  if (!fs.existsSync(SKILLS_DIR)) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
  }
}

export function getSkillsDir(): string {
  return SKILLS_DIR;
}

export function listInstalledSkills(): InstalledSkillInfo[] {
  ensureSkillsDir();
  const skills: InstalledSkillInfo[] = [];
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(SKILLS_DIR, entry.name, 'skill.json');
    if (!fs.existsSync(manifestPath)) continue;
    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const manifest: SkillManifest = JSON.parse(raw);
      skills.push({
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author,
        toolCount: manifest.tools.length,
        dir: path.join(SKILLS_DIR, entry.name),
      });
    } catch { /* skip invalid */ }
  }
  return skills;
}

export function loadSkillManifest(skillName: string): SkillManifest | null {
  const skillDir = findSkillDir(skillName);
  if (!skillDir) return null;
  const manifestPath = path.join(skillDir, 'skill.json');
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    return null;
  }
}

export function findSkillDir(skillName: string): string | null {
  ensureSkillsDir();
  const directPath = path.join(SKILLS_DIR, skillName);
  if (fs.existsSync(directPath) && fs.statSync(directPath).isDirectory()) {
    return directPath;
  }
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(SKILLS_DIR, entry.name, 'skill.json');
    if (!fs.existsSync(manifestPath)) continue;
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      if (manifest.name === skillName) {
        return path.join(SKILLS_DIR, entry.name);
      }
    } catch { /* skip */ }
  }
  return null;
}

export function isSkillInstalled(skillName: string): boolean {
  return findSkillDir(skillName) !== null;
}

export async function installFromUrl(url: string): Promise<{ success: boolean; message: string }> {
  ensureSkillsDir();

  let tempDir: string;
  try {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepseek-code-skill-'));
  } catch {
    return { success: false, message: '无法创建临时目录' };
  }

  try {
    if (url.endsWith('.git') || url.includes('github.com')) {
      child_process.execSync(`git clone --depth 1 "${url}" "${tempDir}/skill"`, {
        stdio: 'pipe',
        timeout: 60000,
      });
    } else {
      child_process.execSync(`curl -fsSL "${url}" | tar -xz -C "${tempDir}/skill" 2>/dev/null || curl -fsSL "${url}" -o "${tempDir}/skill.zip" && cd "${tempDir}" && unzip -q skill.zip -d skill`, {
        stdio: 'pipe',
        timeout: 60000,
        shell: '/bin/bash',
      });
    }

    const skillSource = findSkillJsonInDir(path.join(tempDir, 'skill'));
    if (!skillSource) {
      return { success: false, message: '下载完成但未找到 skill.json，请确认这是一个有效的 Skill' };
    }

    return installFromFolder(skillSource);
  } catch (err: any) {
    return { success: false, message: `安装失败: ${err.message}` };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch { /* ignore */ }
  }
}

function findSkillJsonInDir(dir: string): string | null {
  if (!fs.existsSync(dir)) return null;
  if (fs.existsSync(path.join(dir, 'skill.json'))) return dir;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const sub = path.join(dir, entry.name);
        if (fs.existsSync(path.join(sub, 'skill.json'))) return sub;
      }
    }
  } catch { /* skip */ }
  return null;
}

export function installFromFolder(folderPath: string): { success: boolean; message: string } {
  const resolved = path.resolve(folderPath);
  if (!fs.existsSync(resolved)) {
    return { success: false, message: `文件夹不存在: ${resolved}` };
  }

  const manifestPath = path.join(resolved, 'skill.json');
  if (!fs.existsSync(manifestPath)) {
    return { success: false, message: `未找到 skill.json: ${resolved}` };
  }

  let manifest: SkillManifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    return { success: false, message: 'skill.json 格式无效' };
  }

  if (!manifest.name || !manifest.version || !manifest.tools || !manifest.main) {
    return { success: false, message: 'skill.json 缺少必要字段 (name, version, main, tools)' };
  }

  const mainFile = path.join(resolved, manifest.main);
  if (!fs.existsSync(mainFile)) {
    return { success: false, message: `Skill 主文件不存在: ${manifest.main}` };
  }

  ensureSkillsDir();
  const targetDir = path.join(SKILLS_DIR, manifest.name);
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  try {
    copyDirRecursive(resolved, targetDir);
    return { success: true, message: `Skill "${manifest.name}" v${manifest.version} 安装成功！包含 ${manifest.tools.length} 个工具` };
  } catch (err: any) {
    return { success: false, message: `复制文件失败: ${err.message}` };
  }
}

function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function removeSkill(skillName: string): { success: boolean; message: string } {
  const skillDir = findSkillDir(skillName);
  if (!skillDir) {
    return { success: false, message: `Skill "${skillName}" 未安装` };
  }
  try {
    fs.rmSync(skillDir, { recursive: true, force: true });
    return { success: true, message: `Skill "${skillName}" 已删除` };
  } catch (err: any) {
    return { success: false, message: `删除失败: ${err.message}` };
  }
}

export function getAllSkillTools(): Array<{ skillName: string; toolName: string; description: string; parameters: any }> {
  const skills = listInstalledSkills();
  const allTools: Array<{ skillName: string; toolName: string; description: string; parameters: any }> = [];
  for (const skill of skills) {
    const manifest = loadSkillManifest(skill.name);
    if (!manifest) continue;
    for (const tool of manifest.tools) {
      allTools.push({
        skillName: manifest.name,
        toolName: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      });
    }
  }
  return allTools;
}
