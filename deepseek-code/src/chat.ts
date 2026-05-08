import * as readline from 'readline';
import chalk from 'chalk';
import { DeepSeekCodeConfig, ChatMessage } from './types';
import { Session, createSession, loadLatestSession, loadSession, deleteSession, listSessions, addToSession, clearSessionMessages, trimSessionContext, saveSession } from './session';
import { runAgent } from './agent';
import { showUserPrefix, showAssistantPrefix, showDivider, showInfo, showSuccess, showWarning, showError, showErrorWithSuggestion, askConfirmation, brand } from './ui/display';
import { showConfig, setConfigValue } from './config';

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

  getConfig(): DeepSeekCodeConfig {
    return this.config;
  }

  setConfig(config: DeepSeekCodeConfig): void {
    this.config = config;
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
      case '/set': {
        if (parts.length < 3) {
          showWarning('用法: /set <key> <value>，例如: /set model deepseek-chat');
          return;
        }
        const key = parts[1];
        const value = parts.slice(2).join(' ');
        this.config = setConfigValue(this.config, key, value);
        break;
      }
      case '/history':
        this.showHistory();
        break;
      case '/new':
        this.session = createSession();
        showSuccess('已创建新会话');
        showDivider();
        break;
      case '/sessions':
        this.showSessions();
        break;
      case '/load': {
        if (parts.length < 2) {
          showWarning('用法: /load <session_id>');
          return;
        }
        const sessionId = parts[1];
        const loaded = loadSession(sessionId);
        if (!loaded) {
          showError(`会话不存在: ${sessionId}`);
          return;
        }
        saveSession(this.session);
        this.session = loaded;
        showSuccess(`已加载会话: ${sessionId} (${loaded.messages.filter((m) => m.role === 'user').length} 条消息)`);
        showDivider();
        break;
      }
      case '/delete': {
        if (parts.length < 2) {
          showWarning('用法: /delete <session_id>');
          return;
        }
        const delId = parts[1];
        if (delId === this.session.id) {
          showError('不能删除当前活跃会话');
          return;
        }
        const confirmed = await askConfirmation(`确认删除会话 ${delId}?`);
        if (confirmed) {
          const deleted = deleteSession(delId);
          if (deleted) {
            showSuccess(`会话已删除: ${delId}`);
          } else {
            showError(`会话不存在: ${delId}`);
          }
        }
        break;
      }
      case '/cd': {
        if (parts.length < 2) {
          showInfo(`当前项目目录: ${this.config.projectDir || process.cwd()}`);
          return;
        }
        const newDir = parts.slice(1).join(' ');
        this.config = setConfigValue(this.config, 'projectDir', newDir);
        break;
      }
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
    console.log('  /help              - 显示帮助信息');
    console.log('  /clear             - 清空当前会话上下文');
    console.log('  /config            - 查看当前配置');
    console.log('  /set <key> <value> - 动态修改配置项');
    console.log('  /history           - 查看对话历史');
    console.log('  /new               - 创建新会话');
    console.log('  /sessions          - 列出所有历史会话');
    console.log('  /load <id>         - 加载指定会话');
    console.log('  /delete <id>       - 删除指定会话');
    console.log('  /cd [path]         - 查看/切换项目目录');
    console.log('  /exit              - 退出 DeepSeek Code');
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
      const text = msg.content || '';
      console.log(chalk.dim(`  • ${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`));
    }
    console.log();
  }

  private showSessions(): void {
    const sessions = listSessions();
    if (sessions.length === 0) {
      showInfo('暂无历史会话');
      return;
    }
    console.log();
    showInfo(`历史会话 (${sessions.length} 个):`);
    for (const s of sessions) {
      const isActive = s.id === this.session.id;
      const prefix = isActive ? chalk.green('* ') : '  ';
      const date = new Date(s.createdAt).toLocaleString('zh-CN');
      console.log(`${prefix}${chalk.bold(s.id)} - ${date} (${s.messageCount} 条消息)${isActive ? chalk.green(' [当前]') : ''}`);
    }
    console.log();
    showInfo('使用 /load <id> 加载会话，/delete <id> 删除会话');
    console.log();
  }

  private async handleUserMessage(input: string): Promise<void> {
    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
    };

    this.session = addToSession(this.session, userMessage);
    this.session = trimSessionContext(this.session, this.config.maxContextTokens);

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
      const msg = err.message || '';
      if (msg.includes('401') || msg.includes('认证')) {
        showErrorWithSuggestion(`处理消息时出错: ${msg}`, '请检查 API Key 是否正确，可使用 /set apiKey <key> 更新');
      } else if (msg.includes('429') || msg.includes('速率')) {
        showErrorWithSuggestion(`处理消息时出错: ${msg}`, '请稍后重试，或检查 API 账户余额');
      } else if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
        showErrorWithSuggestion(`处理消息时出错: ${msg}`, '请检查网络连接和 API Base URL 是否正确');
      } else {
        showError(`处理消息时出错: ${msg}`);
      }
    }

    showDivider();
  }

  stop(): void {
    this.running = false;
    this.rl.close();
  }
}
