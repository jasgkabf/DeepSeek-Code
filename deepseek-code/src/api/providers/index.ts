import { DeepSeekCodeConfig, LLMProvider } from '../../types';
import { LLMProviderBase } from './base';
import { OpenAIProvider } from './openai';
import { ClaudeProvider } from './claude';

export { LLMProviderBase } from './base';
export { OpenAIProvider } from './openai';
export { ClaudeProvider } from './claude';

export function createProvider(config: DeepSeekCodeConfig): LLMProviderBase {
  switch (config.provider) {
    case 'claude':
      return new ClaudeProvider(config);
    case 'openai':
    default:
      return new OpenAIProvider(config);
  }
}
