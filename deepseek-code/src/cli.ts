import { DeepSeekCodeConfig } from './types';
import { loadConfig, saveConfig, isConfigured, setupWizard, initLanguage } from './config';
import { showBanner, showInfo, showError, showSuccess, showWarning } from './ui/display';
import { Chat } from './chat';
import { detectEnvironment } from './env';
import { t, template, setLanguage } from './i18n';

export async function main(): Promise<void> {
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

  const chat = new Chat(config);

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
