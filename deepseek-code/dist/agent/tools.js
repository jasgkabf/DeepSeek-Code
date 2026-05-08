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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOOL_DEFINITIONS = void 0;
exports.executeTool = executeTool;
exports.buildToolResults = buildToolResults;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process = __importStar(require("child_process"));
const safety_1 = require("./safety");
const display_1 = require("../ui/display");
exports.TOOL_DEFINITIONS = [
    {
        type: 'function',
        function: {
            name: 'read_file',
            description: '读取指定文件的内容。返回文件的完整文本内容。',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: '要读取的文件路径（相对或绝对路径）',
                    },
                },
                required: ['path'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'list_directory',
            description: '列出指定目录下的文件和子目录。返回目录内容列表。',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: '要列出的目录路径',
                    },
                    recursive: {
                        type: 'boolean',
                        description: '是否递归列出子目录内容，默认为 false',
                    },
                },
                required: ['path'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'write_file',
            description: '创建新文件或完全覆盖写入文件内容。如果文件已存在将被覆盖。',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: '要写入的文件路径',
                    },
                    content: {
                        type: 'string',
                        description: '要写入的文件内容',
                    },
                },
                required: ['path', 'content'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'edit_file',
            description: '编辑已有文件：查找文件中的指定文本并替换为新文本。用于局部修改代码。',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: '要编辑的文件路径',
                    },
                    old_text: {
                        type: 'string',
                        description: '要查找替换的原始文本',
                    },
                    new_text: {
                        type: 'string',
                        description: '替换后的新文本',
                    },
                },
                required: ['path', 'old_text', 'new_text'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'run_command',
            description: '执行本地 Shell 命令。支持 npm、git、运行脚本、安装依赖等操作。返回命令的标准输出和标准错误。',
            parameters: {
                type: 'object',
                properties: {
                    command: {
                        type: 'string',
                        description: '要执行的 Shell 命令',
                    },
                    cwd: {
                        type: 'string',
                        description: '命令执行的工作目录，默认为当前目录',
                    },
                },
                required: ['command'],
            },
        },
    },
];
async function executeReadFile(args) {
    const filePath = path.resolve(args.path);
    if (!fs.existsSync(filePath)) {
        return `错误: 文件不存在 - ${filePath}`;
    }
    if (fs.statSync(filePath).isDirectory()) {
        return `错误: 路径是目录而非文件 - ${filePath}`;
    }
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const stats = fs.statSync(filePath);
        return `文件: ${filePath} (${stats.size} 字节)\n${'─'.repeat(50)}\n${content}`;
    }
    catch (err) {
        return `错误: 无法读取文件 - ${err.message}`;
    }
}
async function executeListDirectory(args) {
    const dirPath = path.resolve(args.path);
    if (!fs.existsSync(dirPath)) {
        return `错误: 目录不存在 - ${dirPath}`;
    }
    if (!fs.statSync(dirPath).isDirectory()) {
        return `错误: 路径不是目录 - ${dirPath}`;
    }
    try {
        const items = listDirRecursive(dirPath, args.recursive ? 3 : 1, 0);
        return `目录: ${dirPath}\n${'─'.repeat(50)}\n${items}`;
    }
    catch (err) {
        return `错误: 无法列出目录 - ${err.message}`;
    }
}
function listDirRecursive(dir, maxDepth, currentDepth) {
    if (currentDepth >= maxDepth)
        return '';
    const indent = '  '.repeat(currentDepth);
    let result = '';
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.') && currentDepth === 0)
                continue;
            if (entry.isDirectory()) {
                result += `${indent}📁 ${entry.name}/\n`;
                result += listDirRecursive(path.join(dir, entry.name), maxDepth, currentDepth + 1);
            }
            else {
                const size = fs.statSync(path.join(dir, entry.name)).size;
                result += `${indent}📄 ${entry.name} (${formatSize(size)})\n`;
            }
        }
    }
    catch {
        result += `${indent}(无法读取)\n`;
    }
    return result;
}
function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes}B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
async function executeWriteFile(args) {
    const filePath = path.resolve(args.path);
    if ((0, safety_1.isWriteToProtectedPath)(filePath)) {
        return `错误: 禁止写入受保护的系统路径 - ${filePath}`;
    }
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, args.content, 'utf-8');
        return `成功: 文件已写入 - ${filePath} (${args.content.length} 字符)`;
    }
    catch (err) {
        return `错误: 无法写入文件 - ${err.message}`;
    }
}
async function executeEditFile(args) {
    const filePath = path.resolve(args.path);
    if ((0, safety_1.isWriteToProtectedPath)(filePath)) {
        return `错误: 禁止编辑受保护的系统路径 - ${filePath}`;
    }
    if (!fs.existsSync(filePath)) {
        return `错误: 文件不存在 - ${filePath}`;
    }
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        const index = content.indexOf(args.old_text);
        if (index === -1) {
            const preview = content.substring(0, 500);
            return `错误: 未找到要替换的文本。文件前 500 字符:\n${preview}`;
        }
        const occurrences = content.split(args.old_text).length - 1;
        if (occurrences > 1) {
            return `警告: 找到 ${occurrences} 处匹配，请提供更精确的上下文以唯一定位`;
        }
        content = content.substring(0, index) + args.new_text + content.substring(index + args.old_text.length);
        fs.writeFileSync(filePath, content, 'utf-8');
        return `成功: 文件已编辑 - ${filePath} (替换了 ${occurrences} 处)`;
    }
    catch (err) {
        return `错误: 无法编辑文件 - ${err.message}`;
    }
}
async function executeRunCommand(args) {
    const commandStr = args.command;
    if ((0, safety_1.isDangerousCommand)(commandStr)) {
        const reason = (0, safety_1.getDangerReason)(commandStr);
        return `错误: 命令被安全机制拦截 - ${reason || '该命令被识别为潜在危险操作'}`;
    }
    if ((0, safety_1.shouldConfirm)(commandStr)) {
        (0, display_1.showWarning)(`即将执行命令: ${commandStr}`);
        const confirmed = await (0, display_1.askConfirmation)('确认执行此命令?');
        if (!confirmed) {
            return '用户取消了命令执行';
        }
    }
    return new Promise((resolve) => {
        const cwd = args.cwd ? path.resolve(args.cwd) : process.cwd();
        const execOptions = {
            cwd,
            maxBuffer: 1024 * 1024 * 10,
            timeout: 120000,
        };
        child_process.exec(commandStr, execOptions, (error, stdout, stderr) => {
            let result = '';
            if (stdout) {
                result += stdout;
            }
            if (stderr) {
                result += (result ? '\n' : '') + '[stderr] ' + stderr;
            }
            if (error) {
                result += (result ? '\n' : '') + `[exit code ${error.code || 1}]`;
            }
            resolve(result || '(命令执行完成，无输出)');
        });
    });
}
async function executeTool(name, argsStr) {
    let args;
    try {
        args = JSON.parse(argsStr);
    }
    catch {
        return `错误: 无法解析工具参数 - ${argsStr}`;
    }
    (0, display_1.showToolCall)(name, argsStr);
    let result;
    switch (name) {
        case 'read_file':
            result = await executeReadFile(args);
            break;
        case 'list_directory':
            result = await executeListDirectory(args);
            break;
        case 'write_file':
            result = await executeWriteFile(args);
            break;
        case 'edit_file':
            result = await executeEditFile(args);
            break;
        case 'run_command':
            result = await executeRunCommand(args);
            break;
        default:
            result = `错误: 未知工具 - ${name}`;
    }
    const isError = result.startsWith('错误:');
    (0, display_1.showToolResult)(name, result, isError);
    return result;
}
function buildToolResults(toolCalls) {
    return Promise.all(toolCalls.map(async (tc) => {
        const content = await executeTool(tc.function.name, tc.function.arguments);
        return {
            tool_call_id: tc.id,
            role: 'tool',
            content,
        };
    }));
}
//# sourceMappingURL=tools.js.map