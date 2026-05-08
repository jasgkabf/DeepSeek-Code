"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureSkillsDir = ensureSkillsDir;
exports.getSkillsDir = getSkillsDir;
exports.listInstalledSkills = listInstalledSkills;
exports.loadSkillManifest = loadSkillManifest;
exports.findSkillDir = findSkillDir;
exports.isSkillInstalled = isSkillInstalled;
exports.installFromUrl = installFromUrl;
exports.installFromFolder = installFromFolder;
exports.removeSkill = removeSkill;
exports.getAllSkillTools = getAllSkillTools;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process = __importStar(require("child_process"));
const SKILLS_DIR = path.join(os.homedir(), '.deepseek-code', 'skills');
function ensureSkillsDir() {
    if (!fs.existsSync(SKILLS_DIR)) {
        fs.mkdirSync(SKILLS_DIR, { recursive: true });
    }
}
function getSkillsDir() {
    return SKILLS_DIR;
}
function listInstalledSkills() {
    ensureSkillsDir();
    const skills = [];
    const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory())
            continue;
        const manifestPath = path.join(SKILLS_DIR, entry.name, 'skill.json');
        if (!fs.existsSync(manifestPath))
            continue;
        try {
            const raw = fs.readFileSync(manifestPath, 'utf-8');
            const manifest = JSON.parse(raw);
            skills.push({
                name: manifest.name,
                version: manifest.version,
                description: manifest.description,
                author: manifest.author,
                toolCount: manifest.tools.length,
                dir: path.join(SKILLS_DIR, entry.name),
            });
        }
        catch { /* skip invalid */ }
    }
    return skills;
}
function loadSkillManifest(skillName) {
    const skillDir = findSkillDir(skillName);
    if (!skillDir)
        return null;
    const manifestPath = path.join(skillDir, 'skill.json');
    if (!fs.existsSync(manifestPath))
        return null;
    try {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    }
    catch {
        return null;
    }
}
function findSkillDir(skillName) {
    ensureSkillsDir();
    const directPath = path.join(SKILLS_DIR, skillName);
    if (fs.existsSync(directPath) && fs.statSync(directPath).isDirectory()) {
        return directPath;
    }
    const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory())
            continue;
        const manifestPath = path.join(SKILLS_DIR, entry.name, 'skill.json');
        if (!fs.existsSync(manifestPath))
            continue;
        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            if (manifest.name === skillName) {
                return path.join(SKILLS_DIR, entry.name);
            }
        }
        catch { /* skip */ }
    }
    return null;
}
function isSkillInstalled(skillName) {
    return findSkillDir(skillName) !== null;
}
async function installFromUrl(url) {
    ensureSkillsDir();
    let tempDir;
    try {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepseek-code-skill-'));
    }
    catch {
        return { success: false, message: '无法创建临时目录' };
    }
    try {
        if (url.endsWith('.git') || url.includes('github.com')) {
            child_process.execSync(`git clone --depth 1 "${url}" "${tempDir}/skill"`, {
                stdio: 'pipe',
                timeout: 60000,
            });
        }
        else {
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
    }
    catch (err) {
        return { success: false, message: `安装失败: ${err.message}` };
    }
    finally {
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        catch { /* ignore */ }
    }
}
function findSkillJsonInDir(dir) {
    if (!fs.existsSync(dir))
        return null;
    if (fs.existsSync(path.join(dir, 'skill.json')))
        return dir;
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const sub = path.join(dir, entry.name);
                if (fs.existsSync(path.join(sub, 'skill.json')))
                    return sub;
            }
        }
    }
    catch { /* skip */ }
    return null;
}
function installFromFolder(folderPath) {
    const resolved = path.resolve(folderPath);
    if (!fs.existsSync(resolved)) {
        return { success: false, message: `文件夹不存在: ${resolved}` };
    }
    const manifestPath = path.join(resolved, 'skill.json');
    if (!fs.existsSync(manifestPath)) {
        return { success: false, message: `未找到 skill.json: ${resolved}` };
    }
    let manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    }
    catch {
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
    }
    catch (err) {
        return { success: false, message: `复制文件失败: ${err.message}` };
    }
}
function copyDirRecursive(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git')
                continue;
            copyDirRecursive(srcPath, destPath);
        }
        else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
function removeSkill(skillName) {
    const skillDir = findSkillDir(skillName);
    if (!skillDir) {
        return { success: false, message: `Skill "${skillName}" 未安装` };
    }
    try {
        fs.rmSync(skillDir, { recursive: true, force: true });
        return { success: true, message: `Skill "${skillName}" 已删除` };
    }
    catch (err) {
        return { success: false, message: `删除失败: ${err.message}` };
    }
}
function getAllSkillTools() {
    const skills = listInstalledSkills();
    const allTools = [];
    for (const skill of skills) {
        const manifest = loadSkillManifest(skill.name);
        if (!manifest)
            continue;
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
//# sourceMappingURL=manager.js.map