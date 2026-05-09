import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { ToolDefinition, ToolResult, DeepSeekCodeConfig } from '../types';
import { isDangerousCommand, isWriteToProtectedPath, shouldConfirm, getDangerReason, resolveSafePath } from './safety';
import { askConfirmation, showWarning, showToolCall, showToolResult, showProgress, clearProgress } from '../ui/display';
import { detectEnvironment, isExternalStoragePath, getTermuxStorageHint } from '../env';
import { executeSkillTool, isSkillTool } from '../skills/loader';
import { audit, AuditEventType } from '../telemetry';

const DEFAULT_CMD_TIMEOUT_MS = 30_000;
const MAX_CMD_TIMEOUT_MS = 120_000;

const CMD_FAILURE_THRESHOLD = 3;
const CMD_FAILURE_WINDOW_MS = 60_000;
const cmdFailureTimestamps: number[] = [];

function circuitBreakerOpen(): boolean {
  const now = Date.now();
  const recent = cmdFailureTimestamps.filter((t) => now - t < CMD_FAILURE_WINDOW_MS);
  cmdFailureTimestamps.length = 0;
  cmdFailureTimestamps.push(...recent);
  return recent.length >= CMD_FAILURE_THRESHOLD;
}

function recordCmdFailure(): void {
  cmdFailureTimestamps.push(Date.now());
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: '读取指定文件的内容。支持 offset/limit 分页读取大文件。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '要读取的文件路径' },
          offset: { type: 'number', description: '起始行号（从1开始），默认1' },
          limit: { type: 'number', description: '读取行数，默认200' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_directory',
      description: '列出指定目录下的文件和子目录。支持 ignore 模式和分页。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '要列出的目录路径' },
          recursive: { type: 'boolean', description: '是否递归列出子目录，默认 false' },
          depth: { type: 'number', description: '递归深度 1-5，默认1或3(recursive=true)' },
          ignore: {
            type: 'array',
            items: { type: 'string' },
            description: '要忽略的目录/文件名模式，如 ["node_modules", ".git"]',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: '创建新文件或完全覆盖写入文件内容。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '要写入的文件路径' },
          content: { type: 'string', description: '要写入的文件内容' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'append_file',
      description: '向文件末尾追加内容。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '要追加的文件路径' },
          content: { type: 'string', description: '要追加的内容' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: '编辑已有文件：查找指定文本并替换为新文本。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '要编辑的文件路径' },
          old_text: { type: 'string', description: '要查找替换的原始文本' },
          new_text: { type: 'string', description: '替换后的新文本' },
          replace_all: { type: 'boolean', description: '是否替换所有匹配，默认 false' },
        },
        required: ['path', 'old_text', 'new_text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: '执行本地 Shell 命令。支持超时控制和自动 kill。',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: '要执行的 Shell 命令' },
          cwd: { type: 'string', description: '命令执行的工作目录' },
          timeout: { type: 'number', description: '超时时间(毫秒)，默认30000，最大120000' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'copy_to_clipboard',
      description: '将文本复制到系统剪贴板。',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '要复制的文本' },
        },
        required: ['text'],
      },
    },
  },
];

function checkStorageAccess(filePath: string): string | null {
  if (!isExternalStoragePath(filePath)) return null;
  const env = detectEnvironment();
  if (env.isTermux && !env.hasStorageAccess) {
    return getTermuxStorageHint();
  }
  return null;
}

async function executeReadFile(args: { path: string; offset?: number; limit?: number }): Promise<string> {
  const filePath = path.resolve(args.path);
  audit(AuditEventType.FILE_ACCESS, { action: 'read', path: filePath });

  const storageHint = checkStorageAccess(filePath);
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
  } catch {
    return storageHint
      ? `错误: 文件不存在 - ${filePath}\n提示: ${storageHint}`
      : `错误: 文件不存在 - ${filePath}`;
  }

  try {
    const stat = await fs.promises.stat(filePath);
    if (stat.isDirectory()) {
      return `错误: 路径是目录而非文件 - ${filePath}`;
    }

    const content = await fs.promises.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const offset = Math.max(1, args.offset || 1);
    const limit = Math.min(2000, args.limit || 200);
    const selectedLines = lines.slice(offset - 1, offset - 1 + limit);
    const hasMore = lines.length > offset - 1 + limit;

    return `文件: ${filePath} (${stat.size} 字节, ${lines.length} 行)${offset > 1 ? ` [行 ${offset}-${offset - 1 + selectedLines.length}]` : ''}\n${'─'.repeat(50)}\n${selectedLines.join('\n')}${hasMore ? `\n... (还有 ${lines.length - offset + 1 - selectedLines.length} 行未显示)` : ''}`;
  } catch (err: any) {
    if (err.code === 'EACCES' && isExternalStoragePath(filePath)) {
      return `错误: 无权限读取文件 - ${filePath}\n提示: ${getTermuxStorageHint()}`;
    }
    return `错误: 无法读取文件 - ${err.message}`;
  }
}

async function executeListDirectory(args: { path: string; recursive?: boolean; depth?: number; ignore?: string[] }): Promise<string> {
  const dirPath = path.resolve(args.path);
  audit(AuditEventType.FILE_ACCESS, { action: 'list', path: dirPath });

  const storageHint = checkStorageAccess(dirPath);
  try {
    await fs.promises.access(dirPath, fs.constants.R_OK);
  } catch {
    return storageHint
      ? `错误: 目录不存在 - ${dirPath}\n提示: ${storageHint}`
      : `错误: 目录不存在 - ${dirPath}`;
  }

  try {
    const stat = await fs.promises.stat(dirPath);
    if (!stat.isDirectory()) {
      return `错误: 路径不是目录 - ${dirPath}`;
    }

    let maxDepth: number;
    if (args.depth !== undefined && args.depth !== null) {
      maxDepth = Math.min(Math.max(1, args.depth), 5);
    } else {
      maxDepth = args.recursive ? 3 : 1;
    }

    const ignoreSet = new Set(args.ignore || ['node_modules', '.git', '__pycache__', '.next', 'dist', 'build']);
    const items = await listDirRecursive(dirPath, maxDepth, 0, ignoreSet);
    return `目录: ${dirPath} (深度: ${maxDepth})\n${'─'.repeat(50)}\n${items}`;
  } catch (err: any) {
    if (err.code === 'EACCES' && isExternalStoragePath(dirPath)) {
      return `错误: 无权限访问目录 - ${dirPath}\n提示: ${getTermuxStorageHint()}`;
    }
    return `错误: 无法列出目录 - ${err.message}`;
  }
}

async function listDirRecursive(dir: string, maxDepth: number, currentDepth: number, ignoreSet: Set<string>): Promise<string> {
  if (currentDepth >= maxDepth) return '';
  const indent = '  '.repeat(currentDepth);
  let result = '';
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (ignoreSet.has(entry.name)) continue;
      if (entry.name.startsWith('.') && currentDepth === 0) continue;
      if (entry.isDirectory()) {
        result += `${indent}📁 ${entry.name}/\n`;
        result += await listDirRecursive(path.join(dir, entry.name), maxDepth, currentDepth + 1, ignoreSet);
      } else {
        try {
          const stat = await fs.promises.stat(path.join(dir, entry.name));
          result += `${indent}📄 ${entry.name} (${formatSize(stat.size)})\n`;
        } catch {
          result += `${indent}📄 ${entry.name}\n`;
        }
      }
    }
  } catch {
    result += `${indent}(无法读取)\n`;
  }
  return result;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function executeWriteFile(args: { path: string; content: string }): Promise<string> {
  const filePath = path.resolve(args.path);
  audit(AuditEventType.FILE_ACCESS, { action: 'write', path: filePath, size: args.content.length });

  if (isWriteToProtectedPath(filePath)) {
    return `错误: 禁止写入受保护的系统路径 - ${filePath}`;
  }
  try {
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, args.content, 'utf-8');
    return `成功: 文件已写入 - ${filePath} (${args.content.length} 字符)`;
  } catch (err: any) {
    if (err.code === 'EACCES' && isExternalStoragePath(filePath)) {
      return `错误: 无权限写入文件 - ${filePath}\n提示: ${getTermuxStorageHint()}`;
    }
    return `错误: 无法写入文件 - ${err.message}`;
  }
}

async function executeAppendFile(args: { path: string; content: string }): Promise<string> {
  const filePath = path.resolve(args.path);
  audit(AuditEventType.FILE_ACCESS, { action: 'append', path: filePath, size: args.content.length });

  if (isWriteToProtectedPath(filePath)) {
    return `错误: 禁止写入受保护的系统路径 - ${filePath}`;
  }
  try {
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.appendFile(filePath, args.content, 'utf-8');
    return `成功: 内容已追加 - ${filePath} (${args.content.length} 字符)`;
  } catch (err: any) {
    if (err.code === 'EACCES' && isExternalStoragePath(filePath)) {
      return `错误: 无权限写入文件 - ${filePath}\n提示: ${getTermuxStorageHint()}`;
    }
    return `错误: 无法追加到文件 - ${err.message}`;
  }
}

async function executeEditFile(args: { path: string; old_text: string; new_text: string; replace_all?: boolean }): Promise<string> {
  const filePath = path.resolve(args.path);
  audit(AuditEventType.FILE_ACCESS, { action: 'edit', path: filePath });

  if (isWriteToProtectedPath(filePath)) {
    return `错误: 禁止编辑受保护的系统路径 - ${filePath}`;
  }
  try {
    await fs.promises.access(filePath, fs.constants.R_OK | fs.constants.W_OK);
  } catch {
    return `错误: 文件不存在或无权限 - ${filePath}`;
  }

  try {
    let content = await fs.promises.readFile(filePath, 'utf-8');
    const index = content.indexOf(args.old_text);
    if (index === -1) {
      const preview = content.substring(0, 500);
      return `错误: 未找到要替换的文本。文件前 500 字符:\n${preview}`;
    }
    const occurrences = content.split(args.old_text).length - 1;

    if (args.replace_all) {
      content = content.split(args.old_text).join(args.new_text);
      await fs.promises.writeFile(filePath, content, 'utf-8');
      return `成功: 文件已编辑 - ${filePath} (替换了 ${occurrences} 处)`;
    }

    if (occurrences > 1) {
      return `警告: 找到 ${occurrences} 处匹配，请提供更精确的上下文以唯一定位，或设置 replace_all=true 替换所有匹配`;
    }
    content = content.substring(0, index) + args.new_text + content.substring(index + args.old_text.length);
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return `成功: 文件已编辑 - ${filePath} (替换了 1 处)`;
  } catch (err: any) {
    if (err.code === 'EACCES' && isExternalStoragePath(filePath)) {
      return `错误: 无权限编辑文件 - ${filePath}\n提示: ${getTermuxStorageHint()}`;
    }
    return `错误: 无法编辑文件 - ${err.message}`;
  }
}

let _config: DeepSeekCodeConfig | null = null;

export function setToolConfig(config: DeepSeekCodeConfig): void {
  _config = config;
}

async function executeRunCommand(args: { command: string; cwd?: string; timeout?: number }): Promise<string> {
  const commandStr = args.command;
  const safeMode = _config?.safeMode ?? true;
  const env = detectEnvironment();

  if (circuitBreakerOpen()) {
    audit(AuditEventType.COMMAND_BLOCKED, { command: commandStr, reason: 'circuit_breaker' });
    return `错误: 命令执行被熔断器拦截 — 近期连续失败过多，请稍后重试`;
  }

  if (env.isTermux && /\bapt(-get)?\s+install\b/.test(commandStr)) {
    const pkgCommand = commandStr.replace(/\bapt(-get)?\s+install\b/, 'pkg install');
    showWarning(`检测到 Termux 环境，建议使用: ${pkgCommand}`);
  }

  if (isDangerousCommand(commandStr, safeMode)) {
    const reason = getDangerReason(commandStr);
    audit(AuditEventType.COMMAND_BLOCKED, { command: commandStr, reason: reason || 'dangerous' });
    return `错误: 命令被安全机制拦截 - ${reason || '该命令被识别为潜在危险操作'}`;
  }

  if (shouldConfirm(commandStr, safeMode)) {
    showWarning(`即将执行命令: ${commandStr}`);
    const confirmed = await askConfirmation('确认执行此命令?');
    if (!confirmed) {
      audit(AuditEventType.COMMAND_BLOCKED, { command: commandStr, reason: 'user_cancelled' });
      return '用户取消了命令执行';
    }
  }

  const timeoutMs = Math.min(
    Math.max(args.timeout || DEFAULT_CMD_TIMEOUT_MS, 5000),
    MAX_CMD_TIMEOUT_MS
  );

  showProgress(`执行命令: ${commandStr}`);
  audit(AuditEventType.TOOL_CALL, { tool: 'run_command', command: commandStr, timeout: timeoutMs });

  return new Promise((resolve) => {
    const cwd = args.cwd ? path.resolve(args.cwd) : (_config?.projectDir || process.cwd());
    const proc = child_process.spawn('sh', ['-c', commandStr], {
      cwd,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    proc.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    proc.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGKILL');
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(timer);
      clearProgress();

      let result = '';
      if (stdout) result += stdout;
      if (stderr) result += (result ? '\n' : '') + '[stderr] ' + stderr;
      if (killed) {
        result += (result ? '\n' : '') + `[命令执行超时 (${Math.round(timeoutMs / 1000)}s)，已自动终止]`;
        recordCmdFailure();
      } else if (code !== 0) {
        result += (result ? '\n' : '') + `[exit code ${code}]`;
        recordCmdFailure();
      }

      audit(AuditEventType.TOOL_RESULT, { tool: 'run_command', exitCode: code, killed, stdoutLen: stdout.length, stderrLen: stderr.length });
      resolve(result || '(命令执行完成，无输出)');
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      clearProgress();
      recordCmdFailure();
      resolve(`错误: 命令执行失败 - ${err.message}`);
    });
  });
}

async function executeCopyToClipboard(args: { text: string }): Promise<string> {
  const env = detectEnvironment();

  if (env.isTermux) {
    return new Promise((resolve) => {
      const proc = child_process.spawn('termux-clipboard-set', [], { stdio: ['pipe', 'pipe', 'pipe'] });
      proc.stdin.write(args.text);
      proc.stdin.end();
      let stderr = '';
      proc.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
      proc.on('close', (code) => {
        if (code === 0) {
          resolve(`成功: 已复制 ${args.text.length} 字符到剪贴板 (Termux)`);
        } else if (stderr.includes('not found') || stderr.includes('No such file')) {
          resolve(`错误: termux-clipboard-set 未安装。请运行: pkg install termux-api`);
        } else {
          resolve(`错误: 复制到剪贴板失败 - ${stderr}`);
        }
      });
      proc.on('error', (err) => {
        if (err.message.includes('ENOENT')) {
          resolve(`错误: termux-clipboard-set 未安装。请运行: pkg install termux-api`);
        } else {
          resolve(`错误: 复制到剪贴板失败 - ${err.message}`);
        }
      });
    });
  }

  return new Promise((resolve) => {
    const commands: Array<[string, string[]]> = [
      ['xclip', ['-selection', 'clipboard']],
      ['xsel', ['--clipboard', '--input']],
      ['wl-copy', []],
    ];

    for (const [cmd, cmdArgs] of commands) {
      try {
        const proc = child_process.spawn(cmd, cmdArgs, { stdio: ['pipe', 'pipe', 'pipe'] });
        proc.stdin.write(args.text);
        proc.stdin.end();
        proc.on('close', (code: number | null) => {
          if (code === 0) {
            resolve(`成功: 已复制 ${args.text.length} 字符到剪贴板 (${cmd})`);
          } else {
            resolve(`错误: 使用 ${cmd} 复制失败 (exit code ${code})`);
          }
        });
        proc.on('error', () => {
          resolve(`错误: 未找到剪贴板工具。请安装 xclip、xsel 或 wl-copy`);
        });
        return;
      } catch {
        continue;
      }
    }
    resolve(`错误: 未找到可用的剪贴板工具。请安装 xclip、xsel 或 wl-copy`);
  });
}

export async function executeTool(name: string, argsStr: string): Promise<string> {
  let args: any;
  try {
    args = JSON.parse(argsStr);
  } catch {
    return `错误: 无法解析工具参数 - ${argsStr}`;
  }

  showToolCall(name, argsStr);
  audit(AuditEventType.TOOL_CALL, { tool: name, argsPreview: argsStr.substring(0, 200) });

  let result: string;
  switch (name) {
    case 'read_file':
      result = await executeReadFile(args);
      break;
    case 'list_directory':
      result = await executeListDirectory(args);
      break;
    case 'write_file':
      result = await executeWriteFile(args);
      break;
    case 'append_file':
      result = await executeAppendFile(args);
      break;
    case 'edit_file':
      result = await executeEditFile(args);
      break;
    case 'run_command':
      result = await executeRunCommand(args);
      break;
    case 'copy_to_clipboard':
      result = await executeCopyToClipboard(args);
      break;
    default: {
      if (isSkillTool(name)) {
        const skillResult = await executeSkillTool(name, args);
        result = skillResult || `错误: Skill 工具执行失败 - ${name}`;
      } else {
        result = `错误: 未知工具 - ${name}`;
      }
      break;
    }
  }

  const isError = result.startsWith('错误:');
  showToolResult(name, result, isError);
  audit(AuditEventType.TOOL_RESULT, { tool: name, isError, resultLen: result.length });

  return result;
}

export function buildToolResults(toolCalls: Array<{ id: string; function: { name: string; arguments: string } }>): Promise<ToolResult[]> {
  return Promise.all(
    toolCalls.map(async (tc) => {
      const content = await executeTool(tc.function.name, tc.function.arguments);
      return {
        tool_call_id: tc.id,
        role: 'tool' as const,
        content,
      };
    })
  );
}
