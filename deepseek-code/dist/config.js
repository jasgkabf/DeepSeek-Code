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
exports.ensureConfigDir = ensureConfigDir;
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.isConfigured = isConfigured;
exports.setupWizard = setupWizard;
exports.switchModelWizard = switchModelWizard;
exports.showConfig = showConfig;
exports.setConfigValue = setConfigValue;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const types_1 = require("./types");
const crypto_1 = require("./crypto");
const display_1 = require("./ui/display");
const CONFIG_DIR = path.join(os.homedir(), '.deepseek-code');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const PRESETS = [
    { name: 'DeepSeek', provider: 'openai', apiBase: 'https://api.deepseek.com/v1', model: 'deepseek-chat', temperature: 0.7, topP: 1.0 },
    { name: 'DeepSeek (推理)', provider: 'openai', apiBase: 'https://api.deepseek.com/v1', model: 'deepseek-reasoner', temperature: 0.7, topP: 1.0 },
    { name: '小米 MiMo', provider: 'openai', apiBase: 'https://api.xiaomimimo.com/v1', model: 'mimo-v2.5-pro', temperature: 1.0, topP: 0.95 },
    { name: 'OpenAI (GPT-4o)', provider: 'openai', apiBase: 'https://api.openai.com/v1', model: 'gpt-4o', temperature: 0.7, topP: 1.0 },
    { name: 'OpenAI (GPT-4o-mini)', provider: 'openai', apiBase: 'https://api.openai.com/v1', model: 'gpt-4o-mini', temperature: 0.7, topP: 1.0 },
    { name: 'Claude (Anthropic)', provider: 'claude', apiBase: 'https://api.anthropic.com/v1', model: 'claude-sonnet-4-20250514', temperature: 0.7, topP: 1.0 },
    { name: '自定义', provider: 'openai', apiBase: '', model: '', temperature: 0.7, topP: 1.0 },
];
function ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
}
function loadConfig() {
    ensureConfigDir();
    if (!fs.existsSync(CONFIG_FILE)) {
        return { ...types_1.DEFAULT_CONFIG, projectDir: process.cwd() };
    }
    try {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const saved = JSON.parse(raw);
        if (saved.apiKey && (0, crypto_1.isEncrypted)(saved.apiKey)) {
            saved.apiKey = (0, crypto_1.decrypt)(saved.apiKey);
        }
        return { ...types_1.DEFAULT_CONFIG, projectDir: process.cwd(), ...saved };
    }
    catch {
        return { ...types_1.DEFAULT_CONFIG, projectDir: process.cwd() };
    }
}
function saveConfig(config) {
    ensureConfigDir();
    const toSave = { ...config };
    if (toSave.apiKey && !(0, crypto_1.isEncrypted)(toSave.apiKey)) {
        toSave.apiKey = (0, crypto_1.encrypt)(toSave.apiKey);
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
}
function isConfigured(config) {
    return config.apiKey.length > 0;
}
function showPresets() {
    console.log();
    (0, display_1.showInfo)('请选择你要用的 AI 模型（输入数字）:');
    PRESETS.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name}`);
    });
    console.log();
}
async function setupWizard() {
    (0, display_1.showInfo)('首次使用 DeepSeek Code，请配置 API 信息');
    console.log();
    const config = await runModelSetup({ ...types_1.DEFAULT_CONFIG, projectDir: process.cwd() });
    saveConfig(config);
    (0, display_1.showSuccess)('配置已保存到 ' + CONFIG_FILE);
    console.log();
    return config;
}
async function switchModelWizard(config) {
    (0, display_1.showInfo)('当前模型: ' + config.model + ' (' + config.apiBase + ')');
    console.log();
    const newConfig = await runModelSetup(config);
    saveConfig(newConfig);
    (0, display_1.showSuccess)('模型切换成功！当前模型: ' + newConfig.model);
    console.log();
    return newConfig;
}
async function runModelSetup(config) {
    showPresets();
    const choice = await (0, display_1.askInput)('请输入序号 (1-' + PRESETS.length + ')');
    const idx = parseInt(choice) - 1;
    if (idx < 0 || idx >= PRESETS.length || isNaN(idx)) {
        (0, display_1.showWarning)('无效选择，使用默认 DeepSeek');
        return config;
    }
    const preset = PRESETS[idx];
    if (preset.name === '自定义') {
        return await customSetup(config);
    }
    console.log();
    (0, display_1.showInfo)('你选择了: ' + preset.name);
    console.log();
    const apiKey = await (0, display_1.askInput)('请输入 API Key');
    if (!apiKey) {
        (0, display_1.showWarning)('API Key 不能为空');
        return config;
    }
    const model = (await (0, display_1.askInput)('模型名称 (回车使用 ' + preset.model + ')')) || preset.model;
    return {
        ...config,
        provider: preset.provider,
        apiBase: preset.apiBase,
        model,
        apiKey,
        temperature: preset.temperature,
        topP: preset.topP,
        frequencyPenalty: 0,
        presencePenalty: 0,
    };
}
async function customSetup(config) {
    console.log();
    (0, display_1.showInfo)('自定义配置');
    console.log();
    const providerInput = await (0, display_1.askInput)('API 格式 (1=openai兼容, 2=claude，回车默认 openai)');
    const provider = providerInput === '2' ? 'claude' : 'openai';
    const defaultApiBase = provider === 'claude'
        ? 'https://api.anthropic.com/v1'
        : 'https://api.deepseek.com/v1';
    const apiKey = await (0, display_1.askInput)('API Key');
    if (!apiKey) {
        (0, display_1.showWarning)('API Key 不能为空');
        return config;
    }
    const apiBase = (await (0, display_1.askInput)('API 地址 (回车使用 ' + defaultApiBase + ')')) || defaultApiBase;
    const model = await (0, display_1.askInput)('模型名称 (如 deepseek-chat, gpt-4o, mimo-v2.5-pro)');
    if (!model) {
        (0, display_1.showWarning)('模型名称不能为空');
        return config;
    }
    return {
        ...config,
        provider,
        apiBase: apiBase.replace(/\/+$/, ''),
        model,
        apiKey,
    };
}
function showConfig(config) {
    (0, display_1.showInfo)('当前配置:');
    console.log('  Provider:          ' + config.provider);
    console.log('  API Base:          ' + config.apiBase);
    console.log('  Model:             ' + config.model);
    console.log('  MaxTokens:         ' + config.maxTokens);
    console.log('  Temperature:       ' + config.temperature);
    console.log('  TopP:              ' + config.topP);
    console.log('  FrequencyPenalty:  ' + config.frequencyPenalty);
    console.log('  PresencePenalty:   ' + config.presencePenalty);
    console.log('  SafeMode:          ' + config.safeMode);
    console.log('  ProjectDir:        ' + (config.projectDir || process.cwd()));
    console.log('  MaxContextTokens:  ' + config.maxContextTokens);
    console.log('  API Key:           ' + (config.apiKey ? config.apiKey.substring(0, 8) + '...' : '(未设置)'));
}
function setConfigValue(config, key, value) {
    const validKeys = {
        apiKey: (c, v) => { c.apiKey = v; },
        apiBase: (c, v) => { c.apiBase = v.replace(/\/+$/, ''); },
        model: (c, v) => { c.model = v; },
        maxTokens: (c, v) => { const n = parseInt(v); if (!isNaN(n))
            c.maxTokens = n; },
        temperature: (c, v) => { const n = parseFloat(v); if (!isNaN(n))
            c.temperature = n; },
        topP: (c, v) => { const n = parseFloat(v); if (!isNaN(n))
            c.topP = n; },
        frequencyPenalty: (c, v) => { const n = parseFloat(v); if (!isNaN(n))
            c.frequencyPenalty = n; },
        presencePenalty: (c, v) => { const n = parseFloat(v); if (!isNaN(n))
            c.presencePenalty = n; },
        safeMode: (c, v) => { c.safeMode = v === 'true'; },
        provider: (c, v) => { if (v === 'openai' || v === 'claude')
            c.provider = v; },
        projectDir: (c, v) => { c.projectDir = v; },
        maxContextTokens: (c, v) => { const n = parseInt(v); if (!isNaN(n))
            c.maxContextTokens = n; },
    };
    const setter = validKeys[key];
    if (!setter) {
        (0, display_1.showWarning)(`未知的配置项: ${key}，可配置项: ${Object.keys(validKeys).join(', ')}`);
        return config;
    }
    setter(config, value);
    saveConfig(config);
    (0, display_1.showSuccess)(`配置已更新: ${key}`);
    return config;
}
//# sourceMappingURL=config.js.map