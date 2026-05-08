import { DeepSeekCodeConfig } from './types';
import { loadConfig, saveConfig, isConfigured, setupWizard } from './config';
import { showBanner, showInfo, showError, showSuccess } from './ui/display';
import { Chat } from './chat';

export async function main(): Promise<void> {
  showBanner();

  let config = loadConfig();

  if (!isConfigured(config)) {
    try {
      config = await setupWizard();
    } catch (err: any) {
      showError(`配置向导失败: ${err.message}`);
      process.exit(1);
    }
  } else {
    showInfo(`已加载配置 - 供应商: ${config.provider}, 模型: ${config.model}`);
  }

  if (!config.apiKey) {
    showError('API Key 未设置，无法启动');
    showInfo('请运行配置向导或使用 /set apiKey <key> 设置');
    process.exit(1);
  }

  showSuccess('DeepSeek Code 已就绪');
  console.log();

  const chat = new Chat(config);

  process.on('SIGINT', () => {
    console.log();
    showInfo('DeepSeek Code 会话已保存，再见！');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log();
    showInfo('DeepSeek Code 会话已保存，再见！');
    process.exit(0);
  });

  await chat.start();
}
