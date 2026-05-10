import { DeepSeekCodeConfig } from './types';
import { loadConfig, saveConfig, isConfigured, setupWizard, initLanguage } from './config';
import { showBanner, showInfo, showError, showSuccess, showWarning } from './ui/display';
import { Chat } from './chat';
import { startWebServer } from './web/server';
import { detectEnvironment } from './env';
import { t, template, setLanguage } from './i18n';

function parseArgs(): { web: boolean; port?: number; help: boolean } {
  const args = process.argv.slice(2);
  let web = false;
  let port: number | undefined;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--web' || arg === '-w') {
      web = true;
    } else if (arg === '--port' || arg === '-p') {
      const next = args[i + 1];
      if (next && !isNaN(parseInt(next))) {
        port = parseInt(next);
        i++;
      }
    } else if (arg === '--help' || arg === '-h') {
      help = true;
    }
  }

  return { web, port, help };
}

function showHelp(): void {
  console.log();
  showInfo('DeepSeek Code - AI 编程助手');
  console.log();
  console.log('  用法:');
  console.log('    deepseek-code          启动 CLI 模式');
  console.log('    deepseek-code --web    启动 Web 模式 (默认端口 3231)');
  console.log('    deepseek-code --web --port 8080    自定义端口');
  console.log('    deepseek-code --help   显示帮助');
  console.log();
  console.log('  启动命令别名: deepseek-code / ds-code / dscode');
  console.log();
}

export async function main(): Promise<void> {
  const { web, port, help } = parseArgs();

  if (help) {
    showHelp();
    process.exit(0);
  }

  let config = loadConfig();
  initLanguage(config);

  const env = detectEnvironment();

  if (env.isTermux) {
    showInfo(t().cli.termuxDetected);
    if (!env.hasStorageAccess) {
      showWarning(t().cli.storageWarning);
      showInfo(t().cli.storageHint);
      console.log();
    }
  }

  showBanner();

  if (!isConfigured(config)) {
    try {
      config = await setupWizard();
    } catch (err: any) {
      showError(err.message);
      process.exit(1);
    }
  } else {
    const envLabel = env.isTermux ? 'Termux' : (config.language === 'zh' ? '标准' : 'Standard');
    showInfo(template(t().cli.configLoaded, { provider: config.provider, model: config.model, env: envLabel }));
  }

  if (!config.apiKey) {
    showError(t().cli.apiKeyNotSet);
    showInfo(t().cli.apiKeyHint);
    process.exit(1);
  }

  showSuccess(t().cli.ready);
  console.log();

  if (web) {
    await startWebServer(config, port);
  } else {
    const chat = await Chat.create(config);

    process.on('SIGINT', () => {
      console.log();
      showInfo(t().cli.goodbye);
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log();
      showInfo(t().cli.goodbye);
      process.exit(0);
    });

    await chat.start();
  }
}
