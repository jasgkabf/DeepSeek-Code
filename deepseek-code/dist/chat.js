"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const readline = __importStar(require("readline"));
const chalk_1 = __importDefault(require("chalk"));
const session_1 = require("./session");
const agent_1 = require("./agent");
const display_1 = require("./ui/display");
const config_1 = require("./config");
class Chat {
    constructor(config) {
        this.running = false;
        this.config = config;
        this.session = (0, session_1.loadLatestSession)() || (0, session_1.createSession)();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk_1.default.green.bold(' You ❯ '),
        });
    }
    async start() {
        this.running = true;
        if (this.session.messages.length > 0) {
            (0, display_1.showInfo)(`已恢复上次会话 (${this.session.messages.filter((m) => m.role === 'user').length} 条历史消息)`);
            (0, display_1.showDivider)();
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
                if (this.running)
                    this.rl.prompt();
                return;
            }
            await this.handleUserMessage(input);
            if (this.running)
                this.rl.prompt();
        });
        this.rl.on('close', () => {
            if (this.running) {
                (0, session_1.saveSession)(this.session);
                console.log();
                (0, display_1.showInfo)(`${(0, display_1.brand)()} 会话已保存，再见！`);
                this.running = false;
            }
        });
    }
    async handleCommand(cmd) {
        const parts = cmd.split(/\s+/);
        const command = parts[0].toLowerCase();
        switch (command) {
            case '/help':
                this.showHelp();
                break;
            case '/clear':
                this.session = (0, session_1.clearSessionMessages)(this.session);
                (0, display_1.showSuccess)('会话已清空');
                (0, display_1.showDivider)();
                break;
            case '/config':
                (0, config_1.showConfig)(this.config);
                break;
            case '/history':
                this.showHistory();
                break;
            case '/new':
                this.session = (0, session_1.createSession)();
                (0, display_1.showSuccess)('已创建新会话');
                (0, display_1.showDivider)();
                break;
            case '/exit':
            case '/quit':
            case '/q':
                (0, session_1.saveSession)(this.session);
                console.log();
                (0, display_1.showInfo)(`${(0, display_1.brand)()} 会话已保存，再见！`);
                this.running = false;
                this.rl.close();
                process.exit(0);
                break;
            default:
                (0, display_1.showWarning)(`未知命令: ${command}，输入 /help 查看帮助`);
        }
    }
    showHelp() {
        console.log();
        (0, display_1.showInfo)(`${(0, display_1.brand)()} 可用命令:`);
        console.log('  /help    - 显示帮助信息');
        console.log('  /clear   - 清空当前会话上下文');
        console.log('  /config  - 查看当前配置');
        console.log('  /history - 查看对话历史');
        console.log('  /new     - 创建新会话');
        console.log('  /exit    - 退出 DeepSeek Code');
        console.log();
        (0, display_1.showInfo)('直接输入自然语言即可与 AI 对话，AI 可调用工具读写文件和执行命令');
        console.log();
    }
    showHistory() {
        const userMsgs = this.session.messages.filter((m) => m.role === 'user');
        if (userMsgs.length === 0) {
            (0, display_1.showInfo)('暂无对话历史');
            return;
        }
        console.log();
        (0, display_1.showInfo)(`对话历史 (${userMsgs.length} 条):`);
        for (const msg of userMsgs) {
            console.log(chalk_1.default.dim(`  • ${msg.content.substring(0, 80)}${msg.content.length > 80 ? '...' : ''}`));
        }
        console.log();
    }
    async handleUserMessage(input) {
        const userMessage = {
            role: 'user',
            content: input,
        };
        this.session = (0, session_1.addToSession)(this.session, userMessage);
        this.session = (0, session_1.trimSessionContext)(this.session);
        console.log();
        (0, display_1.showAssistantPrefix)();
        try {
            const newMessages = await (0, agent_1.runAgent)({
                config: this.config,
                messages: this.session.messages,
            });
            for (const msg of newMessages) {
                this.session = (0, session_1.addToSession)(this.session, msg);
            }
        }
        catch (err) {
            (0, display_1.showError)(`处理消息时出错: ${err.message}`);
        }
        (0, display_1.showDivider)();
    }
    stop() {
        this.running = false;
        this.rl.close();
    }
}
exports.Chat = Chat;
//# sourceMappingURL=chat.js.map