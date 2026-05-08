#!/usr/bin/env node

import { main } from './cli';

main().catch((err) => {
  console.error('DeepSeek Code 启动失败:', err.message);
  process.exit(1);
});
