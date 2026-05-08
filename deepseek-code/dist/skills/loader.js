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
exports.loadBuiltinSkills = loadBuiltinSkills;
exports.buildBuiltinSkillsPrompt = buildBuiltinSkillsPrompt;
exports.listBuiltinSkillNames = listBuiltinSkillNames;
exports.loadSkill = loadSkill;
exports.loadAllSkills = loadAllSkills;
exports.getSkillToolDefinitions = getSkillToolDefinitions;
exports.executeSkillTool = executeSkillTool;
exports.isSkillTool = isSkillTool;
exports.unloadSkill = unloadSkill;
exports.clearLoadedSkills = clearLoadedSkills;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const manager_1 = require("./manager");
const loadedSkills = new Map();
const BUILTIN_SKILLS_DIR = path.join(__dirname, '..', '..', 'skills-builtin');
function parseSkillMd(skillDir) {
    const skillMdPath = path.join(skillDir, 'SKILL.md');
    if (!fs.existsSync(skillMdPath))
        return null;
    try {
        const content = fs.readFileSync(skillMdPath, 'utf-8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (!frontmatterMatch)
            return null;
        const frontmatter = frontmatterMatch[1];
        const instructions = frontmatterMatch[2].trim();
        let name = '';
        let description = '';
        for (const line of frontmatter.split('\n')) {
            const nameMatch = line.match(/^name:\s*(.+)$/);
            if (nameMatch)
                name = nameMatch[1].trim();
            const descMatch = line.match(/^description:\s*(.+)$/);
            if (descMatch)
                description = descMatch[1].trim();
        }
        if (!name)
            return null;
        return { name, description, instructions };
    }
    catch {
        return null;
    }
}
function loadBuiltinSkills() {
    const skills = [];
    if (!fs.existsSync(BUILTIN_SKILLS_DIR))
        return skills;
    try {
        const entries = fs.readdirSync(BUILTIN_SKILLS_DIR, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory())
                continue;
            const skillDir = path.join(BUILTIN_SKILLS_DIR, entry.name);
            const info = parseSkillMd(skillDir);
            if (info) {
                skills.push(info);
            }
        }
    }
    catch { /* ignore */ }
    return skills;
}
function buildBuiltinSkillsPrompt() {
    const skills = loadBuiltinSkills();
    if (skills.length === 0)
        return '';
    let prompt = '\n\n内置知识型 Skills（以下为专业领域的指导原则，请根据用户需求自动应用）：\n';
    for (const skill of skills) {
        prompt += `\n--- ${skill.name} ---\n${skill.description}\n指导原则:\n${skill.instructions.substring(0, 2000)}${skill.instructions.length > 2000 ? '\n...(内容过长已截断)' : ''}\n`;
    }
    return prompt;
}
function listBuiltinSkillNames() {
    return loadBuiltinSkills().map((s) => s.name);
}
function loadSkill(skillName) {
    if (loadedSkills.has(skillName)) {
        return loadedSkills.get(skillName);
    }
    const skillDir = (0, manager_1.findSkillDir)(skillName);
    if (!skillDir)
        return null;
    const manifest = (0, manager_1.loadSkillManifest)(skillName);
    if (!manifest)
        return null;
    const mainPath = path.join(skillDir, manifest.main);
    if (!fs.existsSync(mainPath))
        return null;
    try {
        delete require.cache[require.resolve(mainPath)];
        const skillModule = require(mainPath);
        if (typeof skillModule.execute !== 'function') {
            return null;
        }
        const instance = {
            manifest,
            dir: skillDir,
            execute: skillModule.execute,
        };
        loadedSkills.set(skillName, instance);
        return instance;
    }
    catch {
        return null;
    }
}
function loadAllSkills() {
    const skills = (0, manager_1.listInstalledSkills)();
    const instances = [];
    loadedSkills.clear();
    for (const skill of skills) {
        const instance = loadSkill(skill.name);
        if (instance) {
            instances.push(instance);
        }
    }
    return instances;
}
function getSkillToolDefinitions() {
    const instances = loadAllSkills();
    const definitions = [];
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
async function executeSkillTool(toolName, args) {
    for (const [, instance] of loadedSkills) {
        const toolDef = instance.manifest.tools.find((t) => t.name === toolName);
        if (toolDef) {
            try {
                return await instance.execute(toolName, args);
            }
            catch (err) {
                return `Skill 工具执行错误 (${instance.manifest.name}/${toolName}): ${err.message}`;
            }
        }
    }
    return null;
}
function isSkillTool(toolName) {
    for (const [, instance] of loadedSkills) {
        if (instance.manifest.tools.some((t) => t.name === toolName)) {
            return true;
        }
    }
    return false;
}
function unloadSkill(skillName) {
    loadedSkills.delete(skillName);
}
function clearLoadedSkills() {
    loadedSkills.clear();
}
//# sourceMappingURL=loader.js.map