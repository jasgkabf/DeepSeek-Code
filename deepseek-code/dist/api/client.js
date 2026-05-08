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
exports.chatCompletionStream = chatCompletionStream;
exports.chatCompletion = chatCompletion;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
function buildRequestBody(messages, tools, config, stream) {
    const body = {
        model: config.model,
        messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream,
    };
    if (tools.length > 0) {
        body.tools = tools;
        body.tool_choice = 'auto';
    }
    return body;
}
async function chatCompletionStream(messages, tools, config, callbacks) {
    const body = buildRequestBody(messages, tools, config, true);
    const url = new URL(config.apiBase + '/chat/completions');
    return new Promise((resolve, reject) => {
        const mod = url.protocol === 'https:' ? https : http;
        const req = mod.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.apiKey}`,
            },
        }, (res) => {
            if (res.statusCode !== 200) {
                let errBody = '';
                res.on('data', (chunk) => (errBody += chunk));
                res.on('end', () => {
                    const err = new Error(`API 请求失败 (${res.statusCode}): ${errBody}`);
                    callbacks.onError(err);
                    reject(err);
                });
                return;
            }
            let fullContent = '';
            const toolCallsMap = new Map();
            let usage = undefined;
            let buffer = '';
            res.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: '))
                        continue;
                    const data = trimmed.slice(6);
                    if (data === '[DONE]') {
                        continue;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const choice = parsed.choices?.[0];
                        if (!choice)
                            continue;
                        if (parsed.usage) {
                            usage = parsed.usage;
                        }
                        const delta = choice.delta;
                        if (delta.content) {
                            fullContent += delta.content;
                            callbacks.onContent(delta.content);
                        }
                        if (delta.tool_calls) {
                            for (const tc of delta.tool_calls) {
                                const idx = tc.index;
                                if (!toolCallsMap.has(idx)) {
                                    const newTc = {
                                        id: tc.id || '',
                                        type: 'function',
                                        function: {
                                            name: tc.function?.name || '',
                                            arguments: tc.function?.arguments || '',
                                        },
                                    };
                                    toolCallsMap.set(idx, newTc);
                                    callbacks.onToolCallStart(newTc);
                                }
                                else {
                                    const existing = toolCallsMap.get(idx);
                                    if (tc.function?.arguments) {
                                        existing.function.arguments += tc.function.arguments;
                                        callbacks.onToolCallDelta(idx, tc.function.arguments);
                                    }
                                    if (tc.function?.name) {
                                        existing.function.name += tc.function.name;
                                    }
                                    if (tc.id) {
                                        existing.id = tc.id;
                                    }
                                }
                            }
                        }
                    }
                    catch {
                        // skip malformed JSON
                    }
                }
            });
            res.on('end', () => {
                callbacks.onDone();
                const toolCalls = Array.from(toolCallsMap.values());
                const message = {
                    role: 'assistant',
                    content: fullContent,
                };
                if (toolCalls.length > 0) {
                    message.tool_calls = toolCalls;
                }
                resolve({ message, usage });
            });
            res.on('error', (err) => {
                callbacks.onError(err);
                reject(err);
            });
        });
        req.on('error', (err) => {
            callbacks.onError(err);
            reject(err);
        });
        req.write(JSON.stringify(body));
        req.end();
    });
}
async function chatCompletion(messages, tools, config) {
    const body = buildRequestBody(messages, tools, config, false);
    const url = new URL(config.apiBase + '/chat/completions');
    return new Promise((resolve, reject) => {
        const mod = url.protocol === 'https:' ? https : http;
        const req = mod.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.apiKey}`,
            },
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`API 请求失败 (${res.statusCode}): ${data}`));
                    return;
                }
                try {
                    const parsed = JSON.parse(data);
                    const choice = parsed.choices[0];
                    resolve({
                        message: choice.message,
                        usage: parsed.usage,
                    });
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
//# sourceMappingURL=client.js.map