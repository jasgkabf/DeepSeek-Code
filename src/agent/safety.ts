import * as path from 'path';
import * as fs from 'fs';

const HARD_BLOCK_PATTERNS: RegExp[] = [
  /\brm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+|.*--no-preserve-root.*)\//,
  /\brm\s+-rf\s+\//,
  /\bmkfs\b/,
  /\bdd\s+if=/,
  /\bformat\s+[A-Z]:/i,
  />\s*\/dev\/sd/,
];

const SOFT_BLOCK_PATTERNS: RegExp[] = [
  /\bshutdown\b/,
  /\breboot\b/,
  /\binit\s+[06]/,
  /\bchmod\s+-R\s+[0-7]*777\s+\//,
  /\bchown\s+-R\s+.*\s+\//,
  /\biptables\b/,
  /\bkill\s+-9\s+1\b/,
  /\bsystemctl\s+(stop|disable)\s+(ssh|sshd|network|firewall)/,
];

const PROTECTED_PATHS: string[] = [
  '/etc',
  '/boot',
  '/sys',
  '/proc',
  '/dev',
  '/usr/bin',
  '/usr/sbin',
  '/bin',
  '/sbin',
  '/root',
  'C:\\Windows',
  'C:\\Program Files',
];

const SENSITIVE_SUFFIXES: string[] = [
  '.env',
  '.pem',
  '.key',
  '.p12',
  '.pfx',
  '.ssh',
  '.gnupg',
  '.aws',
];

const CONFIRM_PATTERNS: RegExp[] = [
  /\brm\s+/,
  /\bgit\s+push/,
  /\bgit\s+reset\s+--hard/,
  /\bnpm\s+publish/,
  /\bdocker\s+(rm|rmi)/,
  /\bkubectl\s+delete/,
  /\bdrop\s+table\b/i,
  /\btruncate\s+/i,
  /\bchmod\s+/,
  /\bchown\s+/,
];

export function isHardBlockCommand(command: string): boolean {
  return HARD_BLOCK_PATTERNS.some((p) => p.test(command));
}

export function isSoftBlockCommand(command: string): boolean {
  return SOFT_BLOCK_PATTERNS.some((p) => p.test(command));
}

export function isDangerousCommand(command: string, safeMode = true): boolean {
  if (isHardBlockCommand(command)) return true;
  if (safeMode && isSoftBlockCommand(command)) return true;
  return false;
}

export function resolveSafePath(filePath: string): string {
  let resolved = path.resolve(filePath);
  try {
    const real = fs.realpathSync(resolved);
    resolved = real;
  } catch { /* file may not exist yet */ }

  if (resolved.includes('..')) {
    resolved = path.normalize(resolved);
  }

  return resolved;
}

export function isProtectedPath(filePath: string): boolean {
  const resolved = resolveSafePath(filePath);
  return PROTECTED_PATHS.some((p) => resolved.startsWith(p));
}

export function isWriteToProtectedPath(filePath: string): boolean {
  return isProtectedPath(filePath);
}

export function isSensitiveFile(filePath: string): boolean {
  const resolved = resolveSafePath(filePath);
  const lower = resolved.toLowerCase();
  return SENSITIVE_SUFFIXES.some((s) => lower.endsWith(s));
}

export function getDangerReason(command: string): string | null {
  if (/\brm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+|.*--no-preserve-root.*)\//.test(command)) {
    return '该命令可能递归删除系统文件';
  }
  if (/\bmkfs\b/.test(command)) {
    return '该命令将格式化磁盘';
  }
  if (/\bdd\s+if=/.test(command)) {
    return '该命令可能直接写入磁盘设备';
  }
  if (/\bshutdown\b/.test(command) || /\breboot\b/.test(command)) {
    return '该命令将关闭或重启系统';
  }
  if (/\biptables\b/.test(command)) {
    return '该命令将修改防火墙规则';
  }
  if (isDangerousCommand(command)) {
    return '该命令被识别为潜在危险操作';
  }
  return null;
}

export function shouldConfirm(command: string, safeMode = true): boolean {
  if (!safeMode) return false;
  const lowerCmd = command.toLowerCase().trim();
  return CONFIRM_PATTERNS.some((p) => p.test(lowerCmd));
}
