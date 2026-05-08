import chalk from 'chalk';
import * as readline from 'readline';
import { detectEnvironment } from '../env';
import { t } from '../i18n';

const BRAND = chalk.cyan.bold('DeepSeek Code');
const BRAND_SHORT = chalk.cyan.bold('DS');

function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

function getSeparatorLength(): number {
  const width = getTerminalWidth();
  return Math.min(width, 60);
}

export function brand(): string {
  return BRAND;
}

export function brandShort(): string {
  return BRAND_SHORT;
}

export function separator(char = '─', length?: number): string {
  const len = length || getSeparatorLength();
  return chalk.dim(char.repeat(len));
}

function buildBannerLines(): string[] {
  const width = getTerminalWidth();
  if (width < 55) {
    return [
      chalk.cyan.bold('  DeepSeek Code'),
      chalk.white.bold('  AI 编程助手 v1.0.0'),
    ];
  }
  return [
    chalk.cyan('  ╔═══════════════════════════════════════════════╗'),
    chalk.cyan('  ║') + chalk.cyan.bold('   ____             _   _          ___           ') + chalk.cyan('║'),
    chalk.cyan('  ║') + chalk.cyan.bold('  |  _ \\  ___  ___| |_| | ___   _|_ _|_ _       ') + chalk.cyan('║'),
    chalk.cyan('  ║') + chalk.cyan.bold('  | | | |/ _ \\/ __| __| |/ / | | || |/ _` |      ') + chalk.cyan('║'),
    chalk.cyan('  ║') + chalk.cyan.bold('  | |_| |  __/\\__ \\ |_|   <| |_| || | (_| |      ') + chalk.cyan('║'),
    chalk.cyan('  ║') + chalk.cyan.bold('  |____/ \\___||___/\\__|_|\\_\\\\__,_|___\\__,_|      ') + chalk.cyan('║'),
    chalk.cyan('  ║') + chalk.white.bold('         Code - AI 编程助手 v1.0.0              ') + chalk.cyan('║'),
    chalk.cyan('  ╚═══════════════════════════════════════════════╝'),
  ];
}

export function showBanner(): void {
  const env = detectEnvironment();
  console.log();
  for (const line of buildBannerLines()) {
    console.log(line);
  }
  console.log();
  console.log(chalk.dim('  ' + t().banner.subtitle));
  if (env.isTermux) {
    console.log(chalk.dim('  ' + t().banner.termuxEnv));
  }
  console.log(chalk.dim('  ' + t().banner.helpHint));
  console.log();
  console.log(separator());
  console.log();
}

export function showAssistantPrefix(): void {
  process.stdout.write(chalk.cyan.bold(' DeepSeek Code ❯ '));
}

export function showUserPrefix(): void {
  process.stdout.write(chalk.green.bold(' You ❯ '));
}

export function showToolCall(name: string, args: string): void {
  console.log(chalk.yellow('  ⚙ 调用工具: ') + chalk.bold(name));
  console.log(chalk.dim('  参数: ') + chalk.dim(args));
}

export function showToolResult(name: string, result: string, isError = false): void {
  const icon = isError ? '✗' : '✓';
  const color = isError ? chalk.red : chalk.green;
  const maxWidth = getTerminalWidth() - 10;
  const truncated = result.length > Math.max(maxWidth, 100) ? result.substring(0, Math.max(maxWidth, 100)) + '...' : result.substring(0, 200) + (result.length > 200 ? '...' : '');
  console.log(color(`  ${icon} ${name}: `) + chalk.dim(truncated));
}

export function showThinking(): void {
  process.stdout.write(chalk.cyan(' ● ') + chalk.dim('思考中...'));
}

export function clearThinking(): void {
  process.stdout.write('\r\x1b[K');
}

export function showProgress(message: string): void {
  process.stdout.write('\r\x1b[K' + chalk.cyan(' ⏳ ') + chalk.dim(message));
}

export function clearProgress(): void {
  process.stdout.write('\r\x1b[K');
}

export function showInfo(msg: string): void {
  console.log(chalk.blue(' ℹ ') + msg);
}

export function showSuccess(msg: string): void {
  console.log(chalk.green(' ✓ ') + msg);
}

export function showWarning(msg: string): void {
  console.log(chalk.yellow(' ⚠ ') + msg);
}

export function showError(msg: string): void {
  console.log(chalk.red(' ✗ ') + msg);
}

export function showErrorWithSuggestion(msg: string, suggestion: string): void {
  console.log(chalk.red(' ✗ ') + msg);
  console.log(chalk.dim('   💡 建议: ') + chalk.dim(suggestion));
}

export function showDivider(): void {
  console.log(separator());
}

export async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(chalk.yellow(`  ⚠ ${question} [y/N]: `), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

export async function askInput(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(chalk.cyan(`  ${question}: `), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
