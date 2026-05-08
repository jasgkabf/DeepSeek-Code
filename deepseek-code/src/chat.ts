import * as readline from 'readline';
import chalk from 'chalk';
import { DeepSeekCodeConfig, ChatMessage } from './types';
import { Session, createSession, loadLatestSession, loadSession, deleteSession, listSessions, addToSession, clearSessionMessages, trimSessionContext, saveSession } from './session';
import { runAgent } from './agent';
import { showUserPrefix, showAssistantPrefix, showDivider, showInfo, showSuccess, showWarning, showError, showErrorWithSuggestion, askConfirmation, askInput, brand } from './ui/display';
import { showConfig, setConfigValue, switchModelWizard } from './config';
import { listInstalledSkills, installFromUrl, installFromFolder, removeSkill } from './skills/manager';
import { clearLoadedSkills, listBuiltinSkillNames } from './skills/loader';
import { performUninstall } from './uninstall';
import { extractUserHabitFromMessage, recordUserHabit } from './memory';
import { performSelfReview } from './review';
import { maybePurify, getMemoryStats, forcePurify } from './purification';

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
      const userCount = this.session.messages.filter((m: ChatMessage) => m.role === 'user').length;
      showInfo(`已恢复上次会话 (${userCount} 条历史消息)`);
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
      case '/setup': {
        const newConfig = await switchModelWizard(this.config);
        this.config = newConfig;
        break;
      }
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
      case '/new': {
        saveSession(this.session);
        this.session = createSession();
        showSuccess('已创建新会话，旧会话已保存');
        showInfo('输入 /sessions 可查看历史会话，/load <id> 切换回去');
        showDivider();
        break;
      }
      case '/sessions':
        await this.showSessionsInteractive();
        break;
      case '/load': {
        if (parts.length < 2) {
          showWarning('用法: /load <序号或会话ID>');
          return;
        }
        await this.loadSessionById(parts[1]);
        break;
      }
      case '/delete': {
        if (parts.length < 2) {
          showWarning('用法: /delete <序号或会话ID>');
          return;
        }
        await this.deleteSessionById(parts[1]);
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
      case '/skills':
        this.showSkills();
        break;
      case '/memory':
        this.showMemory();
        break;
      case '/skill': {
        if (parts.length < 2) {
          showWarning('用法: /skill install <网址或路径> | /skill remove <名称>');
          return;
        }
        await this.handleSkillCommand(parts.slice(1));
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
      case '/uninstall': {
        const removeProject = parts.length > 1 && (parts[1] === '--all' || parts[1] === '-a');
        const result = await performUninstall(removeProject);
        if (result.success) {
          console.log();
          showSuccess(result.message);
          this.running = false;
          this.rl.close();
          process.exit(0);
        } else {
          showInfo(result.message);
        }
        break;
      }
      default:
        showWarning(`未知命令: ${command}，输入 /help 查看帮助`);
    }
  }

  private showHelp(): void {
    console.log();
    showInfo(`${brand()} 可用命令 (启动: deepseek-code / ds-code / dscode):`);
    console.log();
    console.log(chalk.bold('  💬 聊天管理'));
    console.log('  /new               - 开始新聊天（旧聊天自动保存）');
    console.log('  /sessions          - 查看/切换历史聊天');
    console.log('  /history           - 查看当前对话历史');
    console.log('  /clear             - 清空当前聊天上下文');
    console.log();
    console.log(chalk.bold('  ⚙ 模型与配置'));
    console.log('  /setup             - 切换 AI 模型（向导式，推荐！）');
    console.log('  /config            - 查看当前配置');
    console.log('  /set <key> <value> - 修改单个配置项');
    console.log();
    console.log(chalk.bold('  📁 其他'));
    console.log('  /cd [path]         - 查看/切换项目目录');
    console.log('  /uninstall         - 完全卸载 DeepSeek Code（删除所有数据）');
    console.log('  /exit              - 退出 DeepSeek Code');
    console.log();
    console.log(chalk.bold('  🔌 Skills (扩展工具)'));
    console.log('  /skills            - 查看已安装的 Skills');
    console.log('  /skill install <网址>  - 从网址安装 Skill');
    console.log('  /skill install <路径>  - 从本地文件夹安装 Skill');
    console.log('  /skill remove <名称>   - 删除已安装的 Skill');
    console.log();
    console.log(chalk.bold('  🧠 记忆与进化'));
    console.log('  /memory            - 查看智能体记忆统计');
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

  private async showSessionsInteractive(): Promise<void> {
    const sessions = listSessions();
    if (sessions.length === 0) {
      showInfo('暂无历史会话');
      return;
    }
    console.log();
    showInfo(`历史聊天 (${sessions.length} 个):`);
    console.log();
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      const isActive = s.id === this.session.id;
      const prefix = isActive ? chalk.green('  ▶ ') : '    ';
      const date = new Date(s.createdAt).toLocaleString('zh-CN');
      const firstMsg = s.messageCount > 0 ? '' : chalk.dim(' (空)');
      console.log(`${prefix}${chalk.bold(i + 1)}. ${date} (${s.messageCount} 条消息)${firstMsg}${isActive ? chalk.green(' ← 当前') : ''}`);
    }
    console.log();
    const answer = await askInput('输入序号切换到该聊天，或回车返回');
    if (!answer) return;

    const idx = parseInt(answer) - 1;
    if (isNaN(idx) || idx < 0 || idx >= sessions.length) {
      showWarning('无效序号');
      return;
    }

    const target = sessions[idx];
    if (target.id === this.session.id) {
      showInfo('已经是当前会话');
      return;
    }

    saveSession(this.session);
    const loaded = loadSession(target.id);
    if (loaded) {
      this.session = loaded;
      showSuccess(`已切换到聊天 ${idx + 1} (${loaded.messages.filter((m) => m.role === 'user').length} 条消息)`);
      showDivider();
    } else {
      showError('加载会话失败');
    }
  }

  private async loadSessionById(idOrIndex: string): Promise<void> {
    const sessions = listSessions();
    const idx = parseInt(idOrIndex) - 1;
    let targetId: string;

    if (!isNaN(idx) && idx >= 0 && idx < sessions.length) {
      targetId = sessions[idx].id;
    } else {
      targetId = idOrIndex;
    }

    if (targetId === this.session.id) {
      showInfo('已经是当前会话');
      return;
    }

    const loaded = loadSession(targetId);
    if (!loaded) {
      showError(`会话不存在: ${idOrIndex}`);
      return;
    }
    saveSession(this.session);
    this.session = loaded;
    showSuccess(`已加载会话 (${loaded.messages.filter((m) => m.role === 'user').length} 条消息)`);
    showDivider();
  }

  private async deleteSessionById(idOrIndex: string): Promise<void> {
    const sessions = listSessions();
    const idx = parseInt(idOrIndex) - 1;
    let targetId: string;

    if (!isNaN(idx) && idx >= 0 && idx < sessions.length) {
      targetId = sessions[idx].id;
    } else {
      targetId = idOrIndex;
    }

    if (targetId === this.session.id) {
      showError('不能删除当前活跃会话');
      return;
    }

    const confirmed = await askConfirmation('确认删除该会话?');
    if (confirmed) {
      const deleted = deleteSession(targetId);
      if (deleted) {
        showSuccess('会话已删除');
      } else {
        showError('会话不存在');
      }
    }
  }

  private async handleUserMessage(input: string): Promise<void> {
    const habit = extractUserHabitFromMessage(input);
    if (habit) recordUserHabit(habit);

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
    };

    this.session = addToSession(this.session, userMessage);
    this.session = trimSessionContext(this.session, this.config.maxContextTokens);

    console.log();
    showAssistantPrefix();

    let toolCallsCount = 0;
    let hadErrors = false;

    try {
      const newMessages = await runAgent({
        config: this.config,
        messages: this.session.messages,
      });

      for (const msg of newMessages) {
        this.session = addToSession(this.session, msg);
        if (msg.tool_calls) toolCallsCount += msg.tool_calls.length;
        if (msg.role === 'tool' && msg.content && typeof msg.content === 'string') {
          if (msg.content.includes('error') || msg.content.includes('Error') || msg.content.includes('失败')) {
            hadErrors = true;
          }
        }
      }

      performSelfReview(input, 
        newMessages.filter((m) => m.role === 'assistant' && m.content).map((m) => m.content || ''),
        toolCallsCount,
        hadErrors
      );

      const purifyResult = maybePurify();
      if (purifyResult.purified && purifyResult.result) {
        const r = purifyResult.result;
        if (r.removed > 0 || r.merged > 0) {
          // silent purification, no user output
        }
      }
    } catch (err: any) {
      hadErrors = true;
      const msg = err.message || '';
      if (msg.includes('401') || msg.includes('认证')) {
        showErrorWithSuggestion(`处理消息时出错: ${msg}`, '请检查 API Key 是否正确，输入 /setup 重新配置');
      } else if (msg.includes('429') || msg.includes('速率')) {
        showErrorWithSuggestion(`处理消息时出错: ${msg}`, '请稍后重试，或检查 API 账户余额');
      } else if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
        showErrorWithSuggestion(`处理消息时出错: ${msg}`, '请检查网络连接，输入 /setup 确认 API 地址');
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

  private showSkills(): void {
    const builtinNames = listBuiltinSkillNames();
    const skills = listInstalledSkills();

    console.log();
    if (builtinNames.length > 0) {
      showInfo(`内置知识型 Skills (${builtinNames.length} 个):`);
      for (const name of builtinNames) {
        console.log(`  📚 ${chalk.bold(name)}`);
      }
      console.log();
      showInfo('(内置 Skills 自动生效，无需安装)');
      console.log();
    }

    if (skills.length === 0) {
      showInfo('暂未安装任何扩展 Skill');
      showInfo('使用 /skill install <网址> 安装，或告诉 AI 帮你安装');
      return;
    }
    showInfo(`已安装的扩展 Skills (${skills.length} 个):`);
    console.log();
    for (const skill of skills) {
      console.log(`  🔌 ${chalk.bold(skill.name)} v${skill.version}`);
      console.log(`     ${chalk.dim(skill.description)}`);
      console.log(`     工具数: ${skill.toolCount}${skill.author ? ' | 作者: ' + skill.author : ''}`);
      console.log();
    }
    showInfo('使用 /skill remove <名称> 删除，AI 可自动使用已安装的 Skill 工具');
    console.log();
  }

  private showMemory(): void {
    const stats = getMemoryStats();
    console.log();
    showInfo('🧠 智能体记忆与进化系统');
    console.log();
    console.log(`  📊 经验条目: ${chalk.bold(stats.experienceCount)} 条`);
    console.log(`  🔄 用户习惯: ${chalk.bold(stats.habitCount)} 个`);
    console.log(`  📝 复盘记录: ${chalk.bold(stats.reviewCount)} 条`);
    if (stats.topCategories.length > 0) {
      console.log(`  📂 高频类别: ${stats.topCategories.join(', ')}`);
    }
    console.log();
    showInfo('智能体会自动：记录经验 → 自我复盘 → 净化低价值记忆 → 注入系统提示词');
    showInfo('使用越多，智能体越了解你的习惯，执行效率越高');
    console.log();
  }

  private async handleSkillCommand(parts: string[]): Promise<void> {
    const subCmd = parts[0].toLowerCase();

    switch (subCmd) {
      case 'install': {
        if (parts.length < 2) {
          showWarning('用法: /skill install <网址或本地路径>');
          showInfo('示例:');
          showInfo('  /skill install https://github.com/user/my-skill');
          showInfo('  /skill install /home/user/my-skill-folder');
          return;
        }
        const source = parts.slice(1).join(' ');
        showInfo(`正在安装 Skill: ${source}`);

        let result;
        if (source.startsWith('http://') || source.startsWith('https://') || source.endsWith('.git')) {
          result = await installFromUrl(source);
        } else {
          result = installFromFolder(source);
        }

        if (result.success) {
          showSuccess(result.message);
          clearLoadedSkills();
        } else {
          showError(result.message);
        }
        break;
      }
      case 'remove':
      case 'delete':
      case 'uninstall': {
        if (parts.length < 2) {
          showWarning('用法: /skill remove <skill名称>');
          const skills = listInstalledSkills();
          if (skills.length > 0) {
            showInfo('已安装: ' + skills.map((s) => s.name).join(', '));
          }
          return;
        }
        const skillName = parts.slice(1).join(' ');
        const confirmed = await askConfirmation(`确认删除 Skill "${skillName}"?`);
        if (confirmed) {
          const result = removeSkill(skillName);
          if (result.success) {
            showSuccess(result.message);
            clearLoadedSkills();
          } else {
            showError(result.message);
          }
        }
        break;
      }
      default:
        showWarning(`未知子命令: ${subCmd}`);
        showInfo('可用: /skill install <网址或路径> | /skill remove <名称>');
    }
  }
}
