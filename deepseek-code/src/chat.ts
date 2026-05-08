import * as readline from 'readline';
import chalk from 'chalk';
import { DeepSeekCodeConfig, ChatMessage } from './types';
import { Session, createSession, loadLatestSession, addToSession, clearSessionMessages, trimSessionContext, saveSession } from './session';
import { runAgent } from './agent';
import { showUserPrefix, showAssistantPrefix, showDivider, showInfo, showSuccess, showWarning, showError, brand } from './ui/display';
import { showConfig } from './config';

export class Chat {
  private config: DeepSeekCodeConfig;
  private session: Session;
  private rl: readline.Interface;
  private running: boolean = false;

  constructor(config: DeepSeekCodeConfig) {
    this.config = config;
    this.session = loadLatestSession() || createSession();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.green.bold(' You ❯ '),
    });
  }

  async start(): Promise<void> {
    this.running = true;

    if (this.session.messages.length > 0) {
      showInfo(`已恢复上次会话 (${this.session.messages.filter((m: ChatMessage) => m.role === 'user').length} 条历史消息)`);
      showDivider();
    }

    this.rl.prompt();

    this.rl.on('line', async (line) => {
      const input = line.trim();
      if (!input) {
        this.rl.prompt();
        return;
      }

      if (input.startsWith('/')) {
        await this.handleCommand(input);
        if (this.running) this.rl.prompt();
        return;
      }

      await this.handleUserMessage(input);
      if (this.running) this.rl.prompt();
    });

    this.rl.on('close', () => {
      if (this.running) {
        saveSession(this.session);
        console.log();
        showInfo(`${brand()} 会话已保存，再见！`);
        this.running = false;
      }
    });
  }

  private async handleCommand(cmd: string): Promise<void> {
    const parts = cmd.split(/\s+/);
    const command = parts[0].toLowerCase();

    switch (command) {
      case '/help':
        this.showHelp();
        break;
      case '/clear':
        this.session = clearSessionMessages(this.session);
        showSuccess('会话已清空');
        showDivider();
        break;
      case '/config':
        showConfig(this.config);
        break;
      case '/history':
        this.showHistory();
        break;
      case '/new':
        this.session = createSession();
        showSuccess('已创建新会话');
        showDivider();
        break;
      case '/exit':
      case '/quit':
      case '/q':
        saveSession(this.session);
        console.log();
        showInfo(`${brand()} 会话已保存，再见！`);
        this.running = false;
        this.rl.close();
        process.exit(0);
        break;
      default:
        showWarning(`未知命令: ${command}，输入 /help 查看帮助`);
    }
  }

  private showHelp(): void {
    console.log();
    showInfo(`${brand()} 可用命令:`);
    console.log('  /help    - 显示帮助信息');
    console.log('  /clear   - 清空当前会话上下文');
    console.log('  /config  - 查看当前配置');
    console.log('  /history - 查看对话历史');
    console.log('  /new     - 创建新会话');
    console.log('  /exit    - 退出 DeepSeek Code');
    console.log();
    showInfo('直接输入自然语言即可与 AI 对话，AI 可调用工具读写文件和执行命令');
    console.log();
  }

  private showHistory(): void {
    const userMsgs = this.session.messages.filter((m: ChatMessage) => m.role === 'user');
    if (userMsgs.length === 0) {
      showInfo('暂无对话历史');
      return;
    }
    console.log();
    showInfo(`对话历史 (${userMsgs.length} 条):`);
    for (const msg of userMsgs) {
      console.log(chalk.dim(`  • ${msg.content.substring(0, 80)}${msg.content.length > 80 ? '...' : ''}`));
    }
    console.log();
  }

  private async handleUserMessage(input: string): Promise<void> {
    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
    };

    this.session = addToSession(this.session, userMessage);
    this.session = trimSessionContext(this.session);

    console.log();
    showAssistantPrefix();

    try {
      const newMessages = await runAgent({
        config: this.config,
        messages: this.session.messages,
      });

      for (const msg of newMessages) {
        this.session = addToSession(this.session, msg);
      }
    } catch (err: any) {
      showError(`处理消息时出错: ${err.message}`);
    }

    showDivider();
  }

  stop(): void {
    this.running = false;
    this.rl.close();
  }
}
