import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DeepSeekCodeConfig, DEFAULT_CONFIG, LLMProvider } from './types';
import { encrypt, decrypt, isEncrypted } from './crypto';
import { askInput, showInfo, showSuccess, showWarning } from './ui/display';

const CONFIG_DIR = path.join(os.homedir(), '.deepseek-code');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): DeepSeekCodeConfig {
  ensureConfigDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG, projectDir: process.cwd() };
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const saved = JSON.parse(raw);
    if (saved.apiKey && isEncrypted(saved.apiKey)) {
      saved.apiKey = decrypt(saved.apiKey);
    }
    return { ...DEFAULT_CONFIG, projectDir: process.cwd(), ...saved };
  } catch {
    return { ...DEFAULT_CONFIG, projectDir: process.cwd() };
  }
}

export function saveConfig(config: DeepSeekCodeConfig): void {
  ensureConfigDir();
  const toSave = { ...config };
  if (toSave.apiKey && !isEncrypted(toSave.apiKey)) {
    toSave.apiKey = encrypt(toSave.apiKey);
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
}

export function isConfigured(config: DeepSeekCodeConfig): boolean {
  return config.apiKey.length > 0;
}

export async function setupWizard(): Promise<DeepSeekCodeConfig> {
  showInfo('首次使用 DeepSeek Code，请配置 API 信息');
  console.log();

  const providerInput = await askInput('API 供应商 (openai/claude，回车使用默认 openai)');
  const provider: LLMProvider = providerInput === 'claude' ? 'claude' : 'openai';

  const defaultApiBase = provider === 'claude'
    ? 'https://api.anthropic.com/v1'
    : 'https://api.deepseek.com/v1';
  const defaultModel = provider === 'claude'
    ? 'claude-sonnet-4-20250514'
    : 'deepseek-chat';

  const apiKey = await askInput('API Key');
  const apiBase = (await askInput(`API Base URL (回车使用默认值 ${defaultApiBase})`)) || defaultApiBase;
  const model = (await askInput(`模型名称 (回车使用默认值 ${defaultModel})`)) || defaultModel;

  const config: DeepSeekCodeConfig = {
    apiKey,
    apiBase: apiBase.replace(/\/+$/, ''),
    model,
    maxTokens: DEFAULT_CONFIG.maxTokens,
    temperature: DEFAULT_CONFIG.temperature,
    topP: DEFAULT_CONFIG.topP,
    frequencyPenalty: DEFAULT_CONFIG.frequencyPenalty,
    presencePenalty: DEFAULT_CONFIG.presencePenalty,
    safeMode: DEFAULT_CONFIG.safeMode,
    provider,
    projectDir: process.cwd(),
    maxContextTokens: DEFAULT_CONFIG.maxContextTokens,
  };

  saveConfig(config);
  showSuccess('配置已保存到 ' + CONFIG_FILE);
  console.log();

  return config;
}

export function showConfig(config: DeepSeekCodeConfig): void {
  showInfo('当前配置:');
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

export function setConfigValue(config: DeepSeekCodeConfig, key: string, value: string): DeepSeekCodeConfig {
  const validKeys: Record<string, (c: DeepSeekCodeConfig, v: string) => void> = {
    apiKey: (c, v) => { c.apiKey = v; },
    apiBase: (c, v) => { c.apiBase = v.replace(/\/+$/, ''); },
    model: (c, v) => { c.model = v; },
    maxTokens: (c, v) => { const n = parseInt(v); if (!isNaN(n)) c.maxTokens = n; },
    temperature: (c, v) => { const n = parseFloat(v); if (!isNaN(n)) c.temperature = n; },
    topP: (c, v) => { const n = parseFloat(v); if (!isNaN(n)) c.topP = n; },
    frequencyPenalty: (c, v) => { const n = parseFloat(v); if (!isNaN(n)) c.frequencyPenalty = n; },
    presencePenalty: (c, v) => { const n = parseFloat(v); if (!isNaN(n)) c.presencePenalty = n; },
    safeMode: (c, v) => { c.safeMode = v === 'true'; },
    provider: (c, v) => { if (v === 'openai' || v === 'claude') c.provider = v; },
    projectDir: (c, v) => { c.projectDir = v; },
    maxContextTokens: (c, v) => { const n = parseInt(v); if (!isNaN(n)) c.maxContextTokens = n; },
  };

  const setter = validKeys[key];
  if (!setter) {
    showWarning(`未知的配置项: ${key}，可配置项: ${Object.keys(validKeys).join(', ')}`);
    return config;
  }

  setter(config, value);
  saveConfig(config);
  showSuccess(`配置已更新: ${key}`);
  return config;
}
