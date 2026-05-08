"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const config_1 = require("./config");
const display_1 = require("./ui/display");
const chat_1 = require("./chat");
const env_1 = require("./env");
async function main() {
    const env = (0, env_1.detectEnvironment)();
    if (env.isTermux) {
        (0, display_1.showInfo)('检测到 Termux 环境');
        if (!env.hasStorageAccess) {
            (0, display_1.showWarning)('未获取存储访问权限，访问 /sdcard 等路径可能失败');
            (0, display_1.showInfo)('请运行: termux-setup-storage（需先安装: pkg install termux-api）');
            console.log();
        }
    }
    (0, display_1.showBanner)();
    let config = (0, config_1.loadConfig)();
    if (!(0, config_1.isConfigured)(config)) {
        try {
            config = await (0, config_1.setupWizard)();
        }
        catch (err) {
            (0, display_1.showError)(`配置向导失败: ${err.message}`);
            process.exit(1);
        }
    }
    else {
        const envLabel = env.isTermux ? 'Termux' : '标准';
        (0, display_1.showInfo)(`已加载配置 - 供应商: ${config.provider}, 模型: ${config.model} [${envLabel}]`);
    }
    if (!config.apiKey) {
        (0, display_1.showError)('API Key 未设置，无法启动');
        (0, display_1.showInfo)('请运行配置向导或使用 /set apiKey <key> 设置');
        process.exit(1);
    }
    (0, display_1.showSuccess)('DeepSeek Code 已就绪');
    console.log();
    const chat = new chat_1.Chat(config);
    process.on('SIGINT', () => {
        console.log();
        (0, display_1.showInfo)('DeepSeek Code 会话已保存，再见！');
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        console.log();
        (0, display_1.showInfo)('DeepSeek Code 会话已保存，再见！');
        process.exit(0);
    });
    await chat.start();
}
//# sourceMappingURL=cli.js.map