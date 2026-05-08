export type LLMProvider = 'openai' | 'claude';

export interface DeepSeekCodeConfig {
  apiKey: string;
  apiBase: string;
  model: string;
  maxTokens: number;
  temperature: number;
  safeMode: boolean;
  provider: LLMProvider;
  projectDir: string;
  maxContextTokens: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
  reasoning_content?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

export interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  content: string;
}

export interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface StreamDelta {
  role?: string;
  content?: string | null;
  reasoning_content?: string;
  tool_calls?: Array<{
    index: number;
    id?: string;
    type?: string;
    function?: {
      name?: string;
      arguments?: string;
    };
  }>;
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: StreamDelta;
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface APIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamCallbacks {
  onContent: (text: string) => void;
  onToolCallStart: (toolCall: ToolCall) => void;
  onToolCallDelta: (index: number, argsDelta: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export interface ChatCompletionResult {
  message: ChatMessage;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export const DEFAULT_CONFIG: DeepSeekCodeConfig = {
  apiKey: '',
  apiBase: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  maxTokens: 4096,
  temperature: 0.7,
  safeMode: true,
  provider: 'openai',
  projectDir: '',
  maxContextTokens: 32000,
};
