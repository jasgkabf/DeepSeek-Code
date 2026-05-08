import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DeepSeekCodeConfig, DEFAULT_CONFIG } from './types';
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
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const saved = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...saved };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: DeepSeekCodeConfig): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function isConfigured(config: DeepSeekCodeConfig): boolean {
  return config.apiKey.length > 0;
}

export async function setupWizard(): Promise<DeepSeekCodeConfig> {
  showInfo('首次使用 DeepSeek Code，请配置 API 信息');
  console.log();

  const apiKey = await askInput('API Key');
  const apiBase = await askInput('API Base URL (回车使用默认值)') || DEFAULT_CONFIG.apiBase;
  const model = await askInput('模型名称 (回车使用默认值)') || DEFAULT_CONFIG.model;

  const config: DeepSeekCodeConfig = {
    apiKey,
    apiBase: apiBase.replace(/\/+$/, ''),
    model,
    maxTokens: DEFAULT_CONFIG.maxTokens,
    temperature: DEFAULT_CONFIG.temperature,
    safeMode: DEFAULT_CONFIG.safeMode,
  };

  saveConfig(config);
  showSuccess('配置已保存到 ' + CONFIG_FILE);
  console.log();

  return config;
}

export function showConfig(config: DeepSeekCodeConfig): void {
  showInfo('当前配置:');
  console.log('  API Base:  ' + config.apiBase);
  console.log('  Model:     ' + config.model);
  console.log('  MaxTokens: ' + config.maxTokens);
  console.log('  Temperature: ' + config.temperature);
  console.log('  SafeMode:  ' + config.safeMode);
  console.log('  API Key:   ' + (config.apiKey ? config.apiKey.substring(0, 8) + '...' : '(未设置)'));
}
