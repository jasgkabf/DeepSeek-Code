import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Session, ChatMessage } from './types';

export type { Session };

const SESSION_DIR = path.join(os.homedir(), '.deepseek-code', 'sessions');

async function ensureSessionDir(): Promise<void> {
  try {
    await fs.promises.access(SESSION_DIR);
  } catch {
    await fs.promises.mkdir(SESSION_DIR, { recursive: true });
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

export async function saveSession(session: Session): Promise<void> {
  await ensureSessionDir();
  session.updatedAt = new Date().toISOString();
  const filePath = path.join(SESSION_DIR, `${session.id}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
}

export async function loadSession(id: string): Promise<Session | null> {
  await ensureSessionDir();
  const filePath = path.join(SESSION_DIR, `${id}.json`);
  try {
    await fs.promises.access(filePath);
  } catch {
    return null;
  }
  try {
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function deleteSession(id: string): Promise<boolean> {
  await ensureSessionDir();
  const filePath = path.join(SESSION_DIR, `${id}.json`);
  try {
    await fs.promises.access(filePath);
  } catch {
    return false;
  }
  try {
    await fs.promises.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function listSessions(): Promise<Array<{ id: string; createdAt: string; messageCount: number }>> {
  await ensureSessionDir();
  const files = await fs.promises.readdir(SESSION_DIR);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  const results: Array<{ id: string; createdAt: string; messageCount: number } | null> = await Promise.all(
    jsonFiles.map(async (f) => {
      try {
        const raw = await fs.promises.readFile(path.join(SESSION_DIR, f), 'utf-8');
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
  );

  return results
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function loadLatestSession(): Promise<Session | null> {
  const sessions = await listSessions();
  if (sessions.length === 0) return null;
  return loadSession(sessions[0].id);
}

export async function addToSession(session: Session, message: ChatMessage): Promise<Session> {
  session.messages.push(message);
  await saveSession(session);
  return session;
}

export async function clearSessionMessages(session: Session): Promise<Session> {
  session.messages = [];
  session.updatedAt = new Date().toISOString();
  await saveSession(session);
  return session;
}

function estimateTokens(text: string): number {
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
  const otherChars = text.length - cjkChars;
  return Math.ceil(cjkChars / 1.5 + otherChars / 4);
}

function estimateMessagesTokens(messages: ChatMessage[]): number {
  return messages.reduce((total, msg) => {
    let msgTokens = estimateTokens(msg.content || '');
    if (msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        msgTokens += estimateTokens(tc.function.name + tc.function.arguments);
      }
    }
    return total + msgTokens;
  }, 0);
}

export async function trimSessionContext(session: Session, maxTokens?: number): Promise<Session> {
  const limit = maxTokens || 32000;
  const totalTokens = estimateMessagesTokens(session.messages);

  if (totalTokens <= limit) return session;

  const systemMsgs = session.messages.filter((m) => m.role === 'system');
  const otherMsgs = session.messages.filter((m) => m.role !== 'system');

  const systemTokens = estimateMessagesTokens(systemMsgs);
  const remainingBudget = limit - systemTokens;

  let kept: ChatMessage[] = [];
  let usedTokens = 0;

  for (let i = otherMsgs.length - 1; i >= 0; i--) {
    const msgTokens = estimateMessagesTokens([otherMsgs[i]]);
    if (usedTokens + msgTokens > remainingBudget) break;
    kept.unshift(otherMsgs[i]);
    usedTokens += msgTokens;
  }

  session.messages = [...systemMsgs, ...kept];
  await saveSession(session);
  return session;
}
