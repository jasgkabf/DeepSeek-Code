import * as https from 'https';
import * as http from 'http';
import { DeepSeekCodeConfig, ChatMessage, ToolDefinition, StreamChunk, ToolCall, StreamCallbacks, ChatCompletionResult } from '../../types';
import { LLMProviderBase } from './base';

function buildRequestBody(messages: ChatMessage[], tools: ToolDefinition[], config: DeepSeekCodeConfig, stream: boolean) {
  const body: any = {
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

function parseError(statusCode: number, body: string): Error {
  switch (statusCode) {
    case 401:
      return new Error(`认证失败: API Key 无效或已过期，请检查配置 (HTTP ${statusCode})`);
    case 403:
      return new Error(`访问被拒绝: 无权限访问该模型 (HTTP ${statusCode})`);
    case 429:
      return new Error(`请求过于频繁: 已触发速率限制，请稍后重试 (HTTP ${statusCode})`);
    case 500:
    case 502:
    case 503:
      return new Error(`服务端错误: API 服务暂时不可用，请稍后重试 (HTTP ${statusCode})`);
    default:
      return new Error(`API 请求失败 (${statusCode}): ${body}`);
  }
}

export class OpenAIProvider extends LLMProviderBase {
  async chatCompletionStream(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    callbacks: StreamCallbacks
  ): Promise<ChatCompletionResult> {
    const body = buildRequestBody(messages, tools, this.config, true);
    const url = new URL(this.config.apiBase + '/chat/completions');

    return new Promise((resolve, reject) => {
      const mod = url.protocol === 'https:' ? https : http;
      const req = mod.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            let errBody = '';
            res.on('data', (chunk) => (errBody += chunk));
            res.on('end', () => {
              const err = parseError(res.statusCode || 500, errBody);
              callbacks.onError(err);
              reject(err);
            });
            return;
          }

          let fullContent = '';
          const toolCallsMap = new Map<number, ToolCall>();
          let usage: any = undefined;
          let buffer = '';

          res.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed: StreamChunk = JSON.parse(data);
                const choice = parsed.choices?.[0];
                if (!choice) continue;

                if (parsed.usage) usage = parsed.usage;

                const delta = choice.delta;
                if (delta.content) {
                  fullContent += delta.content;
                  callbacks.onContent(delta.content);
                }

                if (delta.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index;
                    if (!toolCallsMap.has(idx)) {
                      const newTc: ToolCall = {
                        id: tc.id || '',
                        type: 'function',
                        function: { name: tc.function?.name || '', arguments: tc.function?.arguments || '' },
                      };
                      toolCallsMap.set(idx, newTc);
                      callbacks.onToolCallStart(newTc);
                    } else {
                      const existing = toolCallsMap.get(idx)!;
                      if (tc.function?.arguments) {
                        existing.function.arguments += tc.function.arguments;
                        callbacks.onToolCallDelta(idx, tc.function.arguments);
                      }
                      if (tc.function?.name) existing.function.name += tc.function.name;
                      if (tc.id) existing.id = tc.id;
                    }
                  }
                }
              } catch { /* skip malformed JSON */ }
            }
          });

          res.on('end', () => {
            callbacks.onDone();
            const toolCalls = Array.from(toolCallsMap.values());
            const message: ChatMessage = { role: 'assistant', content: fullContent };
            if (toolCalls.length > 0) message.tool_calls = toolCalls;
            resolve({ message, usage });
          });

          res.on('error', (err) => { callbacks.onError(err); reject(err); });
        }
      );

      req.on('error', (err) => { callbacks.onError(err); reject(err); });
      req.write(JSON.stringify(body));
      req.end();
    });
  }

  async chatCompletion(messages: ChatMessage[], tools: ToolDefinition[]): Promise<ChatCompletionResult> {
    const body = buildRequestBody(messages, tools, this.config, false);
    const url = new URL(this.config.apiBase + '/chat/completions');

    return new Promise((resolve, reject) => {
      const mod = url.protocol === 'https:' ? https : http;
      const req = mod.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode !== 200) {
              reject(parseError(res.statusCode || 500, data));
              return;
            }
            try {
              const parsed = JSON.parse(data);
              resolve({ message: parsed.choices[0].message, usage: parsed.usage });
            } catch (err) {
              reject(new Error(`解析 API 响应失败: ${err}`));
            }
          });
        }
      );
      req.on('error', reject);
      req.write(JSON.stringify(body));
      req.end();
    });
  }
}
