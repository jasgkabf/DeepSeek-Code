import { DeepSeekCodeConfig } from './types';
import { loadConfig, saveConfig, isConfigured, setupWizard } from './config';
import { showBanner, showInfo, showError, showSuccess, showWarning } from './ui/display';
import { Chat } from './chat';
import { detectEnvironment } from './env';

export async function main(): Promise<void> {
  const env = detectEnvironment();

  if (env.isTermux) {
    showInfo('检测到 Termux 环境');
    if (!env.hasStorageAccess) {
      showWarning('未获取存储访问权限，访问 /sdcard 等路径可能失败');
      showInfo('请运行: termux-setup-storage（需先安装: pkg install termux-api）');
      console.log();
    }
  }

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
    const envLabel = env.isTermux ? 'Termux' : '标准';
    showInfo(`已加载配置 - 供应商: ${config.provider}, 模型: ${config.model} [${envLabel}]`);
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
