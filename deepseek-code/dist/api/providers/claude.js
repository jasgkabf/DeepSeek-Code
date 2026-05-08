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
exports.ClaudeProvider = void 0;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const base_1 = require("./base");
function buildClaudeRequestBody(messages, tools, config, stream) {
    const systemMsg = messages.find((m) => m.role === 'system');
    const nonSystemMsgs = messages.filter((m) => m.role !== 'system');
    const claudeMessages = nonSystemMsgs.map((m) => {
        if (m.role === 'tool') {
            return { role: 'user', content: [{ type: 'tool_result', tool_use_id: m.tool_call_id, content: m.content }] };
        }
        if (m.role === 'assistant' && m.tool_calls && m.tool_calls.length > 0) {
            const content = [];
            if (m.content)
                content.push({ type: 'text', text: m.content });
            for (const tc of m.tool_calls) {
                content.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input: tc.function.arguments });
            }
            return { role: 'assistant', content };
        }
        return { role: m.role, content: m.content };
    });
    const body = {
        model: config.model,
        max_tokens: config.maxTokens,
        messages: claudeMessages,
        stream,
    };
    if (systemMsg)
        body.system = systemMsg.content;
    if (config.temperature !== 1)
        body.temperature = config.temperature;
    if (tools.length > 0) {
        body.tools = tools.map((t) => ({
            name: t.function.name,
            description: t.function.description,
            input_schema: t.function.parameters,
        }));
    }
    return body;
}
function parseClaudeError(statusCode, body) {
    switch (statusCode) {
        case 401:
            return new Error(`认证失败: API Key 无效，请检查配置 (HTTP ${statusCode})`);
        case 403:
            return new Error(`访问被拒绝: 无权限访问该模型 (HTTP ${statusCode})`);
        case 429:
            return new Error(`请求过于频繁: 已触发速率限制，请稍后重试 (HTTP ${statusCode})`);
        case 529:
            return new Error(`服务过载: Anthropic API 暂时不可用，请稍后重试 (HTTP ${statusCode})`);
        case 500:
        case 502:
        case 503:
            return new Error(`服务端错误: API 服务暂时不可用，请稍后重试 (HTTP ${statusCode})`);
        default:
            return new Error(`API 请求失败 (${statusCode}): ${body}`);
    }
}
class ClaudeProvider extends base_1.LLMProviderBase {
    async chatCompletionStream(messages, tools, callbacks) {
        const body = buildClaudeRequestBody(messages, tools, this.config, true);
        const url = new URL(this.config.apiBase + '/messages');
        return new Promise((resolve, reject) => {
            const mod = url.protocol === 'https:' ? https : http;
            const req = mod.request(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey,
                    'anthropic-version': '2023-06-01',
                },
            }, (res) => {
                if (res.statusCode !== 200) {
                    let errBody = '';
                    res.on('data', (chunk) => (errBody += chunk));
                    res.on('end', () => {
                        const err = parseClaudeError(res.statusCode || 500, errBody);
                        callbacks.onError(err);
                        reject(err);
                    });
                    return;
                }
                let fullContent = '';
                const toolCallsMap = new Map();
                let usage = undefined;
                let buffer = '';
                let currentToolIndex = 0;
                res.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith('data: '))
                            continue;
                        const data = trimmed.slice(6);
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.type === 'message_start' && parsed.message?.usage) {
                                usage = parsed.message.usage;
                            }
                            if (parsed.type === 'content_block_delta') {
                                const delta = parsed.delta;
                                if (delta?.type === 'text_delta') {
                                    fullContent += delta.text;
                                    callbacks.onContent(delta.text);
                                }
                                if (delta?.type === 'input_json_delta') {
                                    const idx = currentToolIndex;
                                    const existing = toolCallsMap.get(idx);
                                    if (existing && delta.partial_json) {
                                        existing.function.arguments += delta.partial_json;
                                        callbacks.onToolCallDelta(idx, delta.partial_json);
                                    }
                                }
                            }
                            if (parsed.type === 'content_block_start') {
                                const contentBlock = parsed.content_block;
                                if (contentBlock?.type === 'tool_use') {
                                    const idx = currentToolIndex;
                                    const newTc = {
                                        id: contentBlock.id || '',
                                        type: 'function',
                                        function: { name: contentBlock.name || '', arguments: '' },
                                    };
                                    toolCallsMap.set(idx, newTc);
                                    callbacks.onToolCallStart(newTc);
                                }
                            }
                            if (parsed.type === 'content_block_stop') {
                                if (toolCallsMap.has(currentToolIndex)) {
                                    currentToolIndex++;
                                }
                            }
                            if (parsed.type === 'message_delta' && parsed.usage) {
                                if (!usage)
                                    usage = {};
                                usage.completion_tokens = parsed.usage.output_tokens;
                            }
                        }
                        catch { /* skip */ }
                    }
                });
                res.on('end', () => {
                    callbacks.onDone();
                    const toolCalls = Array.from(toolCallsMap.values());
                    const message = { role: 'assistant', content: fullContent };
                    if (toolCalls.length > 0)
                        message.tool_calls = toolCalls;
                    resolve({ message, usage });
                });
                res.on('error', (err) => { callbacks.onError(err); reject(err); });
            });
            req.on('error', (err) => { callbacks.onError(err); reject(err); });
            req.write(JSON.stringify(body));
            req.end();
        });
    }
    async chatCompletion(messages, tools) {
        const body = buildClaudeRequestBody(messages, tools, this.config, false);
        const url = new URL(this.config.apiBase + '/messages');
        return new Promise((resolve, reject) => {
            const mod = url.protocol === 'https:' ? https : http;
            const req = mod.request(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey,
                    'anthropic-version': '2023-06-01',
                },
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        reject(parseClaudeError(res.statusCode || 500, data));
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const message = { role: 'assistant', content: '' };
                        for (const block of parsed.content) {
                            if (block.type === 'text')
                                message.content += block.text;
                            if (block.type === 'tool_use') {
                                if (!message.tool_calls)
                                    message.tool_calls = [];
                                message.tool_calls.push({
                                    id: block.id,
                                    type: 'function',
                                    function: { name: block.name, arguments: typeof block.input === 'string' ? block.input : JSON.stringify(block.input) },
                                });
                            }
                        }
                        resolve({ message, usage: parsed.usage });
                    }
                    catch (err) {
                        reject(new Error(`解析 API 响应失败: ${err}`));
                    }
                });
            });
            req.on('error', reject);
            req.write(JSON.stringify(body));
            req.end();
        });
    }
}
exports.ClaudeProvider = ClaudeProvider;
//# sourceMappingURL=claude.js.map