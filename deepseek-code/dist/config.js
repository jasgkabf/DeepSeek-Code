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
async function setupWizard() {
    (0, display_1.showInfo)('首次使用 DeepSeek Code，请配置 API 信息');
    console.log();
    const providerInput = await (0, display_1.askInput)('API 供应商 (openai/claude，回车使用默认 openai)');
    const provider = providerInput === 'claude' ? 'claude' : 'openai';
    const defaultApiBase = provider === 'claude'
        ? 'https://api.anthropic.com/v1'
        : 'https://api.deepseek.com/v1';
    const defaultModel = provider === 'claude'
        ? 'claude-sonnet-4-20250514'
        : 'deepseek-chat';
    const apiKey = await (0, display_1.askInput)('API Key');
    const apiBase = (await (0, display_1.askInput)(`API Base URL (回车使用默认值 ${defaultApiBase})`)) || defaultApiBase;
    const model = (await (0, display_1.askInput)(`模型名称 (回车使用默认值 ${defaultModel})`)) || defaultModel;
    const config = {
        apiKey,
        apiBase: apiBase.replace(/\/+$/, ''),
        model,
        maxTokens: types_1.DEFAULT_CONFIG.maxTokens,
        temperature: types_1.DEFAULT_CONFIG.temperature,
        safeMode: types_1.DEFAULT_CONFIG.safeMode,
        provider,
        projectDir: process.cwd(),
        maxContextTokens: types_1.DEFAULT_CONFIG.maxContextTokens,
    };
    saveConfig(config);
    (0, display_1.showSuccess)('配置已保存到 ' + CONFIG_FILE);
    console.log();
    return config;
}
function showConfig(config) {
    (0, display_1.showInfo)('当前配置:');
    console.log('  Provider: ' + config.provider);
    console.log('  API Base:  ' + config.apiBase);
    console.log('  Model:     ' + config.model);
    console.log('  MaxTokens: ' + config.maxTokens);
    console.log('  Temperature: ' + config.temperature);
    console.log('  SafeMode:  ' + config.safeMode);
    console.log('  ProjectDir: ' + (config.projectDir || process.cwd()));
    console.log('  MaxContextTokens: ' + config.maxContextTokens);
    console.log('  API Key:   ' + (config.apiKey ? config.apiKey.substring(0, 8) + '...' : '(未设置)'));
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