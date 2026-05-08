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
exports.brand = brand;
exports.brandShort = brandShort;
exports.separator = separator;
exports.showBanner = showBanner;
exports.showAssistantPrefix = showAssistantPrefix;
exports.showUserPrefix = showUserPrefix;
exports.showToolCall = showToolCall;
exports.showToolResult = showToolResult;
exports.showThinking = showThinking;
exports.clearThinking = clearThinking;
exports.showProgress = showProgress;
exports.clearProgress = clearProgress;
exports.showInfo = showInfo;
exports.showSuccess = showSuccess;
exports.showWarning = showWarning;
exports.showError = showError;
exports.showErrorWithSuggestion = showErrorWithSuggestion;
exports.showDivider = showDivider;
exports.askConfirmation = askConfirmation;
exports.askInput = askInput;
const chalk_1 = __importDefault(require("chalk"));
const readline = __importStar(require("readline"));
const env_1 = require("../env");
const BRAND = chalk_1.default.cyan.bold('DeepSeek Code');
const BRAND_SHORT = chalk_1.default.cyan.bold('DS');
function getTerminalWidth() {
    return process.stdout.columns || 80;
}
function getSeparatorLength() {
    const width = getTerminalWidth();
    return Math.min(width, 60);
}
function brand() {
    return BRAND;
}
function brandShort() {
    return BRAND_SHORT;
}
function separator(char = '─', length) {
    const len = length || getSeparatorLength();
    return chalk_1.default.dim(char.repeat(len));
}
function buildBannerLines() {
    const width = getTerminalWidth();
    if (width < 55) {
        return [
            chalk_1.default.cyan.bold('  DeepSeek Code'),
            chalk_1.default.white.bold('  AI 编程助手 v1.0.0'),
        ];
    }
    return [
        chalk_1.default.cyan('  ╔═══════════════════════════════════════════════╗'),
        chalk_1.default.cyan('  ║') + chalk_1.default.cyan.bold('   ____             _   _          ___           ') + chalk_1.default.cyan('║'),
        chalk_1.default.cyan('  ║') + chalk_1.default.cyan.bold('  |  _ \\  ___  ___| |_| | ___   _|_ _|_ _       ') + chalk_1.default.cyan('║'),
        chalk_1.default.cyan('  ║') + chalk_1.default.cyan.bold('  | | | |/ _ \\/ __| __| |/ / | | || |/ _` |      ') + chalk_1.default.cyan('║'),
        chalk_1.default.cyan('  ║') + chalk_1.default.cyan.bold('  | |_| |  __/\\__ \\ |_|   <| |_| || | (_| |      ') + chalk_1.default.cyan('║'),
        chalk_1.default.cyan('  ║') + chalk_1.default.cyan.bold('  |____/ \\___||___/\\__|_|\\_\\\\__,_|___\\__,_|      ') + chalk_1.default.cyan('║'),
        chalk_1.default.cyan('  ║') + chalk_1.default.white.bold('         Code - AI 编程助手 v1.0.0              ') + chalk_1.default.cyan('║'),
        chalk_1.default.cyan('  ╚═══════════════════════════════════════════════╝'),
    ];
}
function showBanner() {
    const env = (0, env_1.detectEnvironment)();
    console.log();
    for (const line of buildBannerLines()) {
        console.log(line);
    }
    console.log();
    console.log(chalk_1.default.dim('  对标 Claude Code / Codex 的命令行 AI 编程助手'));
    if (env.isTermux) {
        console.log(chalk_1.default.dim('  运行环境: Termux (Android)'));
    }
    console.log(chalk_1.default.dim('  输入 /help 查看帮助，/exit 退出'));
    console.log();
    console.log(separator());
    console.log();
}
function showAssistantPrefix() {
    process.stdout.write(chalk_1.default.cyan.bold(' DeepSeek Code ❯ '));
}
function showUserPrefix() {
    process.stdout.write(chalk_1.default.green.bold(' You ❯ '));
}
function showToolCall(name, args) {
    console.log(chalk_1.default.yellow('  ⚙ 调用工具: ') + chalk_1.default.bold(name));
    console.log(chalk_1.default.dim('  参数: ') + chalk_1.default.dim(args));
}
function showToolResult(name, result, isError = false) {
    const icon = isError ? '✗' : '✓';
    const color = isError ? chalk_1.default.red : chalk_1.default.green;
    const maxWidth = getTerminalWidth() - 10;
    const truncated = result.length > Math.max(maxWidth, 100) ? result.substring(0, Math.max(maxWidth, 100)) + '...' : result.substring(0, 200) + (result.length > 200 ? '...' : '');
    console.log(color(`  ${icon} ${name}: `) + chalk_1.default.dim(truncated));
}
function showThinking() {
    process.stdout.write(chalk_1.default.cyan(' ● ') + chalk_1.default.dim('思考中...'));
}
function clearThinking() {
    process.stdout.write('\r\x1b[K');
}
function showProgress(message) {
    process.stdout.write('\r\x1b[K' + chalk_1.default.cyan(' ⏳ ') + chalk_1.default.dim(message));
}
function clearProgress() {
    process.stdout.write('\r\x1b[K');
}
function showInfo(msg) {
    console.log(chalk_1.default.blue(' ℹ ') + msg);
}
function showSuccess(msg) {
    console.log(chalk_1.default.green(' ✓ ') + msg);
}
function showWarning(msg) {
    console.log(chalk_1.default.yellow(' ⚠ ') + msg);
}
function showError(msg) {
    console.log(chalk_1.default.red(' ✗ ') + msg);
}
function showErrorWithSuggestion(msg, suggestion) {
    console.log(chalk_1.default.red(' ✗ ') + msg);
    console.log(chalk_1.default.dim('   💡 建议: ') + chalk_1.default.dim(suggestion));
}
function showDivider() {
    console.log(separator());
}
async function askConfirmation(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(chalk_1.default.yellow(`  ⚠ ${question} [y/N]: `), (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}
async function askInput(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(chalk_1.default.cyan(`  ${question}: `), (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}
//# sourceMappingURL=display.js.map