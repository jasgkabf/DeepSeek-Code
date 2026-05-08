import chalk from 'chalk';
import * as readline from 'readline';

const BRAND = chalk.cyan.bold('DeepSeek Code');
const BRAND_SHORT = chalk.cyan.bold('DS');

export function brand(): string {
  return BRAND;
}

export function brandShort(): string {
  return BRAND_SHORT;
}

export function separator(char = '─', length = 60): string {
  return chalk.dim(char.repeat(length));
}

export function showBanner(): void {
  console.log();
  console.log(chalk.cyan('  ╔═══════════════════════════════════════════════╗'));
  console.log(chalk.cyan('  ║') + chalk.cyan.bold('   ____             _   _          ___           ') + chalk.cyan('║'));
  console.log(chalk.cyan('  ║') + chalk.cyan.bold('  |  _ \\  ___  ___| |_| | ___   _|_ _|_ _       ') + chalk.cyan('║'));
  console.log(chalk.cyan('  ║') + chalk.cyan.bold('  | | | |/ _ \\/ __| __| |/ / | | || |/ _` |      ') + chalk.cyan('║'));
  console.log(chalk.cyan('  ║') + chalk.cyan.bold('  | |_| |  __/\\__ \\ |_|   <| |_| || | (_| |      ') + chalk.cyan('║'));
  console.log(chalk.cyan('  ║') + chalk.cyan.bold('  |____/ \\___||___/\\__|_|\\_\\\\__,_|___\\__,_|      ') + chalk.cyan('║'));
  console.log(chalk.cyan('  ║') + chalk.white.bold('         Code - AI 编程助手 v1.0.0              ') + chalk.cyan('║'));
  console.log(chalk.cyan('  ╚═══════════════════════════════════════════════╝'));
  console.log();
  console.log(chalk.dim('  对标 Claude Code / Codex 的命令行 AI 编程助手'));
  console.log(chalk.dim('  输入 /help 查看帮助，/exit 退出'));
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
  console.log(color(`  ${icon} ${name}: `) + chalk.dim(result.substring(0, 200) + (result.length > 200 ? '...' : '')));
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
