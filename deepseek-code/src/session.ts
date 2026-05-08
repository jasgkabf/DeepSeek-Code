import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Session, ChatMessage } from './types';

export type { Session };

const SESSION_DIR = path.join(os.homedir(), '.deepseek-code', 'sessions');

function ensureSessionDir(): void {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }
}

export function createSession(): Session {
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  const now = new Date().toISOString();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function saveSession(session: Session): void {
  ensureSessionDir();
  session.updatedAt = new Date().toISOString();
  const filePath = path.join(SESSION_DIR, `${session.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
}

export function loadSession(id: string): Session | null {
  ensureSessionDir();
  const filePath = path.join(SESSION_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function listSessions(): Array<{ id: string; createdAt: string; messageCount: number }> {
  ensureSessionDir();
  const files = fs.readdirSync(SESSION_DIR).filter((f) => f.endsWith('.json'));
  return files
    .map((f) => {
      try {
        const raw = fs.readFileSync(path.join(SESSION_DIR, f), 'utf-8');
        const session: Session = JSON.parse(raw);
        return {
          id: session.id,
          createdAt: session.createdAt,
          messageCount: session.messages.filter((m) => m.role === 'user').length,
        };
      } catch {
        return null;
      }
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function loadLatestSession(): Session | null {
  const sessions = listSessions();
  if (sessions.length === 0) return null;
  return loadSession(sessions[0].id);
}

export function addToSession(session: Session, message: ChatMessage): Session {
  session.messages.push(message);
  saveSession(session);
  return session;
}

export function clearSessionMessages(session: Session): Session {
  session.messages = [];
  session.updatedAt = new Date().toISOString();
  saveSession(session);
  return session;
}

export function trimSessionContext(session: Session, maxMessages = 50): Session {
  if (session.messages.length <= maxMessages) return session;
  const systemMsgs = session.messages.filter((m) => m.role === 'system');
  const otherMsgs = session.messages.filter((m) => m.role !== 'system');
  const trimmed = otherMsgs.slice(otherMsgs.length - maxMessages + systemMsgs.length);
  session.messages = [...systemMsgs, ...trimmed];
  saveSession(session);
  return session;
}
