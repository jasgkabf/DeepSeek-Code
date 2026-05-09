import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export enum AuditEventType {
  TOOL_CALL = 'tool_call',
  TOOL_RESULT = 'tool_result',
  AGENT_STEP = 'agent_step',
  AGENT_COMPLETE = 'agent_complete',
  AGENT_ERROR = 'agent_error',
  BUDGET_EXCEEDED = 'budget_exceeded',
  LOOP_DETECTED = 'loop_detected',
  DUPLICATE_BLOCKED = 'duplicate_blocked',
  COMMAND_BLOCKED = 'cmd_blocked',
  FILE_ACCESS = 'file_access',
  API_REQUEST = 'api_request',
  API_RESPONSE = 'api_response',
}

export interface AuditEvent {
  ts: string;
  type: AuditEventType;
  data: Record<string, any>;
}

const AUDIT_DIR = path.join(os.homedir(), '.deepseek-code', 'logs');
const AUDIT_FILE = path.join(AUDIT_DIR, 'audit.jsonl');

let auditStream: fs.WriteStream | null = null;
let enabled = true;

function ensureStream(): fs.WriteStream {
  if (auditStream && !auditStream.destroyed) return auditStream;
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }
  auditStream = fs.createWriteStream(AUDIT_FILE, { flags: 'a' });
  return auditStream;
}

export function audit(type: AuditEventType, data: Record<string, any>): void {
  if (!enabled) return;
  try {
    const event: AuditEvent = {
      ts: new Date().toISOString(),
      type,
      data,
    };
    const stream = ensureStream();
    stream.write(JSON.stringify(event) + '\n');
  } catch { /* silent */ }
}

export function setAuditEnabled(on: boolean): void {
  enabled = on;
}

export function flushAudit(): void {
  if (auditStream && !auditStream.destroyed) {
    auditStream.end();
    auditStream = null;
  }
}

export function getRecentAuditEvents(count: number = 50): AuditEvent[] {
  if (!fs.existsSync(AUDIT_FILE)) return [];
  try {
    const lines = fs.readFileSync(AUDIT_FILE, 'utf-8').trim().split('\n');
    const recent = lines.slice(-count);
    return recent
      .map((line) => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter((e): e is AuditEvent => e !== null);
  } catch {
    return [];
  }
}
