"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const config_1 = require("./config");
const display_1 = require("./ui/display");
const chat_1 = require("./chat");
const env_1 = require("./env");
const i18n_1 = require("./i18n");
async function main() {
    let config = (0, config_1.loadConfig)();
    (0, config_1.initLanguage)(config);
    const env = (0, env_1.detectEnvironment)();
    if (env.isTermux) {
        (0, display_1.showInfo)((0, i18n_1.t)().cli.termuxDetected);
        if (!env.hasStorageAccess) {
            (0, display_1.showWarning)((0, i18n_1.t)().cli.storageWarning);
            (0, display_1.showInfo)((0, i18n_1.t)().cli.storageHint);
            console.log();
        }
    }
    (0, display_1.showBanner)();
    if (!(0, config_1.isConfigured)(config)) {
        try {
            config = await (0, config_1.setupWizard)();
        }
        catch (err) {
            (0, display_1.showError)(err.message);
            process.exit(1);
        }
    }
    else {
        const envLabel = env.isTermux ? 'Termux' : (config.language === 'zh' ? '标准' : 'Standard');
        (0, display_1.showInfo)((0, i18n_1.template)((0, i18n_1.t)().cli.configLoaded, { provider: config.provider, model: config.model, env: envLabel }));
    }
    if (!config.apiKey) {
        (0, display_1.showError)((0, i18n_1.t)().cli.apiKeyNotSet);
        (0, display_1.showInfo)((0, i18n_1.t)().cli.apiKeyHint);
        process.exit(1);
    }
    (0, display_1.showSuccess)((0, i18n_1.t)().cli.ready);
    console.log();
    const chat = new chat_1.Chat(config);
    process.on('SIGINT', () => {
        console.log();
        (0, display_1.showInfo)((0, i18n_1.t)().cli.goodbye);
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        console.log();
        (0, display_1.showInfo)((0, i18n_1.t)().cli.goodbye);
        process.exit(0);
    });
    await chat.start();
}
//# sourceMappingURL=cli.js.map