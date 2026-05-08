#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_1 = require("./cli");
(0, cli_1.main)().catch((err) => {
    console.error('DeepSeek Code 启动失败:', err.message);
    process.exit(1);
});
//# sourceMappingURL=index.js.map