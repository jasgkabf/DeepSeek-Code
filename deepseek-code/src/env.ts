import * as fs from 'fs';
import * as path from 'path';

export interface EnvironmentInfo {
  isTermux: boolean;
  termuxPrefix: string;
  terminalWidth: number;
  hasStorageAccess: boolean;
  packageManager: string;
}

let _envCache: EnvironmentInfo | null = null;

export function detectEnvironment(): EnvironmentInfo {
  if (_envCache) return _envCache;

  const isTermux = detectTermux();
  const termuxPrefix = isTermux ? getTermuxPrefix() : '';
  const terminalWidth = process.stdout.columns || 80;
  const hasStorageAccess = isTermux ? checkTermuxStorageAccess() : true;
  const packageManager = isTermux ? 'pkg' : 'apt';

  _envCache = { isTermux, termuxPrefix, terminalWidth, hasStorageAccess, packageManager };
  return _envCache;
}

function detectTermux(): boolean {
  if (process.env.TERMUX_VERSION) return true;
  if (process.env.TERMUX_PREFIX) return true;
  if (process.env.PREFIX && process.env.PREFIX.includes('com.termux')) return true;
  const home = process.env.HOME || '';
  if (home.includes('com.termux')) return true;
  if (fs.existsSync('/data/data/com.termux')) return true;
  return false;
}

function getTermuxPrefix(): string {
  return process.env.TERMUX_PREFIX || process.env.PREFIX || '/data/data/com.termux/files/usr';
}

function checkTermuxStorageAccess(): boolean {
  const sdcard = process.env.HOME + '/storage';
  return fs.existsSync(sdcard) || fs.existsSync('/sdcard');
}

export function isExternalStoragePath(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  return resolved.startsWith('/sdcard') ||
    resolved.startsWith('/storage') ||
    resolved.startsWith('/mnt/media_rw');
}

export function getTermuxStorageHint(): string {
  return '在 Termux 中访问手机存储需要运行: termux-setup-storage（需要先安装 termux-api: pkg install termux-api）';
}

export function getRecommendedInstallCommand(packageName: string): string {
  const env = detectEnvironment();
  return env.isTermux ? `pkg install ${packageName}` : `sudo apt install ${packageName}`;
}

export function clearEnvCache(): void {
  _envCache = null;
}
