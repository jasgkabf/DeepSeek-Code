"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAgent = runAgent;
const client_1 = require("../api/client");
const tools_1 = require("./tools");
const display_1 = require("../ui/display");
const MAX_AGENT_ITERATIONS = 10;
const SYSTEM_PROMPT = {
    role: 'system',
    content: `你是 DeepSeek Code，一个强大的命令行 AI 编程助手。你可以帮助用户编写代码、调试问题、管理项目文件和执行命令。

你具备以下工具能力：
- read_file: 读取项目文件内容
- list_directory: 遍历目录、查看文件列表（支持 depth 参数控制递归深度）
- write_file: 创建新文件或覆盖写入文件
- append_file: 向文件末尾追加内容
- edit_file: 局部修改代码（查找替换，支持 replace_all 参数替换所有匹配）
- run_command: 执行 Shell 命令（npm、git、运行脚本等）

工作原则：
1. 先理解用户需求，再选择合适的工具
2. 修改代码前先读取文件了解现有内容
3. 执行命令前确认安全性
4. 给出清晰的解释和操作步骤
5. 遇到错误时分析原因并提供解决方案

请用中文回复用户，代码注释使用英文。`,
};
async function runAgent(options) {
    const { config, messages, onContent } = options;
    (0, tools_1.setToolConfig)(config);
    const allMessages = [SYSTEM_PROMPT, ...messages];
    const newMessages = [];
    let iteration = 0;
    while (iteration < MAX_AGENT_ITERATIONS) {
        iteration++;
        const callbacks = {
            onContent: (text) => {
                process.stdout.write(text);
                onContent?.(text);
            },
            onToolCallStart: () => { },
            onToolCallDelta: () => { },
            onDone: () => { },
            onError: (err) => {
                (0, display_1.showError)(`API 错误: ${err.message}`);
            },
        };
        let result;
        try {
            result = await (0, client_1.chatCompletionStream)(allMessages, tools_1.TOOL_DEFINITIONS, config, callbacks);
        }
        catch (err) {
            (0, display_1.showError)(`请求失败: ${err.message}`);
            break;
        }
        const assistantMessage = result.message;
        allMessages.push(assistantMessage);
        newMessages.push(assistantMessage);
        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
            console.log();
            break;
        }
        console.log();
        (0, display_1.showDivider)();
        const toolResults = await (0, tools_1.buildToolResults)(assistantMessage.tool_calls);
        for (const tr of toolResults) {
            allMessages.push(tr);
            newMessages.push(tr);
        }
        (0, display_1.showDivider)();
        (0, display_1.showAssistantPrefix)();
    }
    if (iteration >= MAX_AGENT_ITERATIONS) {
        (0, display_1.showError)('已达到最大 Agent 迭代次数');
    }
    return newMessages;
}
//# sourceMappingURL=index.js.map