import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createSession, saveSession, loadSession, deleteSession, listSessions, addToSession, clearSessionMessages } from '../session';

const TEST_DIR = path.join(os.tmpdir(), 'deepseek-code-test-sessions-' + Date.now());

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.log(`  ✗ ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n🧪 Session Module Tests\n');

const originalDir = process.env.HOME;

test('createSession returns valid session', () => {
  const session = createSession();
  assert.ok(session.id);
  assert.ok(session.createdAt);
  assert.ok(session.updatedAt);
  assert.strictEqual(session.messages.length, 0);
});

test('addToSession appends message', () => {
  const session = createSession();
  const updated = addToSession(session, { role: 'user', content: 'hello' });
  assert.strictEqual(updated.messages.length, 1);
  assert.strictEqual(updated.messages[0].content, 'hello');
});

test('clearSessionMessages empties messages', () => {
  const session = createSession();
  addToSession(session, { role: 'user', content: 'hello' });
  const cleared = clearSessionMessages(session);
  assert.strictEqual(cleared.messages.length, 0);
});

test('session has unique IDs', () => {
  const s1 = createSession();
  const s2 = createSession();
  assert.notStrictEqual(s1.id, s2.id);
});
