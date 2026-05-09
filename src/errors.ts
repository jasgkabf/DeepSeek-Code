export enum ErrorCode {
  NETWORK_ERROR = 'E_NETWORK',
  NETWORK_TIMEOUT = 'E_NET_TIMEOUT',
  NETWORK_AUTH = 'E_NET_AUTH',
  NETWORK_RATE_LIMIT = 'E_NET_RATE',
  NETWORK_DNS = 'E_NET_DNS',

  TOOL_NOT_FOUND = 'E_TOOL_NOT_FOUND',
  TOOL_INVALID_ARGS = 'E_TOOL_INVALID_ARGS',
  TOOL_EXEC_TIMEOUT = 'E_TOOL_TIMEOUT',
  TOOL_EXEC_FAILED = 'E_TOOL_FAILED',
  TOOL_PERMISSION_DENIED = 'E_TOOL_DENIED',

  FILE_NOT_FOUND = 'E_FILE_NOT_FOUND',
  FILE_READ_ERROR = 'E_FILE_READ',
  FILE_WRITE_ERROR = 'E_FILE_WRITE',
  FILE_PERMISSION_DENIED = 'E_FILE_DENIED',
  FILE_PROTECTED_PATH = 'E_FILE_PROTECTED',

  CMD_BLOCKED = 'E_CMD_BLOCKED',
  CMD_CONFIRM_CANCELLED = 'E_CMD_CANCELLED',
  CMD_TIMEOUT = 'E_CMD_TIMEOUT',
  CMD_FAILED = 'E_CMD_FAILED',

  AGENT_BUDGET_EXCEEDED = 'E_BUDGET',
  AGENT_LOOP_DETECTED = 'E_LOOP',
  AGENT_DUPLICATE_CALL = 'E_DUPLICATE',
  AGENT_MAX_ITERATIONS = 'E_MAX_ITER',

  MODEL_ERROR = 'E_MODEL',
  MODEL_CONTEXT_EXCEEDED = 'E_CONTEXT',

  UNKNOWN = 'E_UNKNOWN',
}

export class AgentError extends Error {
  code: ErrorCode;
  cause?: Error;
  recoverable: boolean;
  metadata: Record<string, any>;

  constructor(
    code: ErrorCode,
    message: string,
    opts?: { cause?: Error; recoverable?: boolean; metadata?: Record<string, any> }
  ) {
    super(message);
    this.name = 'AgentError';
    this.code = code;
    this.cause = opts?.cause;
    this.recoverable = opts?.recoverable ?? false;
    this.metadata = opts?.metadata ?? {};
  }
}

export function classifyError(err: any): AgentError {
  if (err instanceof AgentError) return err;

  const msg = err?.message || String(err);

  if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') || msg.includes('ECONNRESET')) {
    return new AgentError(ErrorCode.NETWORK_ERROR, msg, { cause: err, recoverable: true });
  }
  if (msg.includes('ETIMEDOUT') || msg.includes('timeout')) {
    return new AgentError(ErrorCode.NETWORK_TIMEOUT, msg, { cause: err, recoverable: true });
  }
  if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('认证')) {
    return new AgentError(ErrorCode.NETWORK_AUTH, msg, { cause: err, recoverable: false });
  }
  if (msg.includes('429') || msg.includes('rate') || msg.includes('速率')) {
    return new AgentError(ErrorCode.NETWORK_RATE_LIMIT, msg, { cause: err, recoverable: true });
  }
  if (msg.includes('ENOENT')) {
    return new AgentError(ErrorCode.FILE_NOT_FOUND, msg, { cause: err, recoverable: true });
  }
  if (msg.includes('EACCES') || msg.includes('permission')) {
    return new AgentError(ErrorCode.FILE_PERMISSION_DENIED, msg, { cause: err, recoverable: false });
  }

  return new AgentError(ErrorCode.UNKNOWN, msg, { cause: err, recoverable: false });
}

export function isRecoverable(err: any): boolean {
  if (err instanceof AgentError) return err.recoverable;
  return classifyError(err).recoverable;
}

export function userFriendlyMessage(err: any): string {
  const classified = classifyError(err);
  switch (classified.code) {
    case ErrorCode.NETWORK_AUTH:
      return 'API Key 无效或已过期，请输入 /setup 重新配置';
    case ErrorCode.NETWORK_RATE_LIMIT:
      return 'API 请求频率超限，请稍后重试或检查账户余额';
    case ErrorCode.NETWORK_TIMEOUT:
      return '网络请求超时，请检查网络连接后重试';
    case ErrorCode.NETWORK_DNS:
    case ErrorCode.NETWORK_ERROR:
      return '网络连接失败，请检查网络设置';
    case ErrorCode.FILE_NOT_FOUND:
      return '文件不存在，请检查路径是否正确';
    case ErrorCode.FILE_PERMISSION_DENIED:
      return '无权限访问文件，请检查文件权限';
    case ErrorCode.CMD_BLOCKED:
      return '命令被安全策略拦截';
    case ErrorCode.AGENT_BUDGET_EXCEEDED:
      return '任务执行超出预算限制，已自动停止';
    case ErrorCode.AGENT_LOOP_DETECTED:
      return '检测到重复操作循环，已自动停止';
    default:
      return classified.message;
  }
}
