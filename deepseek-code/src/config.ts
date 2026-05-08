import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DeepSeekCodeConfig, DEFAULT_CONFIG, LLMProvider } from './types';
import { encrypt, decrypt, isEncrypted } from './crypto';
import { askInput, showInfo, showSuccess, showWarning } from './ui/display';

const CONFIG_DIR = path.join(os.homedir(), '.deepseek-code');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const PRESETS: Array<{ name: string; provider: LLMProvider; apiBase: string; model: string; temperature: number; topP: number }> = [
  { name: 'DeepSeek', provider: 'openai', apiBase: 'https://api.deepseek.com/v1', model: 'deepseek-chat', temperature: 0.7, topP: 1.0 },
  { name: 'DeepSeek (推理)', provider: 'openai', apiBase: 'https://api.deepseek.com/v1', model: 'deepseek-reasoner', temperature: 0.7, topP: 1.0 },
  { name: '小米 MiMo', provider: 'openai', apiBase: 'https://api.xiaomimimo.com/v1', model: 'mimo-v2.5-pro', temperature: 1.0, topP: 0.95 },
  { name: 'OpenAI (GPT-4o)', provider: 'openai', apiBase: 'https://api.openai.com/v1', model: 'gpt-4o', temperature: 0.7, topP: 1.0 },
  { name: 'OpenAI (GPT-4o-mini)', provider: 'openai', apiBase: 'https://api.openai.com/v1', model: 'gpt-4o-mini', temperature: 0.7, topP: 1.0 },
  { name: 'Claude (Anthropic)', provider: 'claude', apiBase: 'https://api.anthropic.com/v1', model: 'claude-sonnet-4-20250514', temperature: 0.7, topP: 1.0 },
  { name: '自定义', provider: 'openai', apiBase: '', model: '', temperature: 0.7, topP: 1.0 },
];

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

function showPresets(): void {
  console.log();
  showInfo('请选择你要用的 AI 模型（输入数字）:');
  PRESETS.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}`);
  });
  console.log();
}

export async function setupWizard(): Promise<DeepSeekCodeConfig> {
  showInfo('首次使用 DeepSeek Code，请配置 API 信息');
  console.log();

  const config = await runModelSetup({ ...DEFAULT_CONFIG, projectDir: process.cwd() });
  saveConfig(config);
  showSuccess('配置已保存到 ' + CONFIG_FILE);
  console.log();
  return config;
}

export async function switchModelWizard(config: DeepSeekCodeConfig): Promise<DeepSeekCodeConfig> {
  showInfo('当前模型: ' + config.model + ' (' + config.apiBase + ')');
  console.log();

  const newConfig = await runModelSetup(config);
  saveConfig(newConfig);
  showSuccess('模型切换成功！当前模型: ' + newConfig.model);
  console.log();
  return newConfig;
}

async function runModelSetup(config: DeepSeekCodeConfig): Promise<DeepSeekCodeConfig> {
  showPresets();

  const choice = await askInput('请输入序号 (1-' + PRESETS.length + ')');
  const idx = parseInt(choice) - 1;

  if (idx < 0 || idx >= PRESETS.length || isNaN(idx)) {
    showWarning('无效选择，使用默认 DeepSeek');
    return config;
  }

  const preset = PRESETS[idx];

  if (preset.name === '自定义') {
    return await customSetup(config);
  }

  console.log();
  showInfo('你选择了: ' + preset.name);
  console.log();

  const apiKey = await askInput('请输入 API Key');
  if (!apiKey) {
    showWarning('API Key 不能为空');
    return config;
  }

  const model = (await askInput('模型名称 (回车使用 ' + preset.model + ')')) || preset.model;

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

async function customSetup(config: DeepSeekCodeConfig): Promise<DeepSeekCodeConfig> {
  console.log();
  showInfo('自定义配置');
  console.log();

  const providerInput = await askInput('API 格式 (1=openai兼容, 2=claude，回车默认 openai)');
  const provider: LLMProvider = providerInput === '2' ? 'claude' : 'openai';

  const defaultApiBase = provider === 'claude'
    ? 'https://api.anthropic.com/v1'
    : 'https://api.deepseek.com/v1';

  const apiKey = await askInput('API Key');
  if (!apiKey) {
    showWarning('API Key 不能为空');
    return config;
  }
  const apiBase = (await askInput('API 地址 (回车使用 ' + defaultApiBase + ')')) || defaultApiBase;
  const model = await askInput('模型名称 (如 deepseek-chat, gpt-4o, mimo-v2.5-pro)');
  if (!model) {
    showWarning('模型名称不能为空');
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
