import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createSession, saveSession, loadSession, deleteSession, listSessions, addToSession, clearSessionMessages } from '../session';

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.log(`  ✗ ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

async function runTests(): Promise<void> {
  console.log('\n🧪 Session Module Tests\n');

  await test('createSession returns valid session', async () => {
    const session = createSession();
    assert.ok(session.id);
    assert.ok(session.createdAt);
    assert.ok(session.updatedAt);
    assert.strictEqual(session.messages.length, 0);
  });

  await test('addToSession appends message', async () => {
    const session = createSession();
    const updated = await addToSession(session, { role: 'user', content: 'hello' });
    assert.strictEqual(updated.messages.length, 1);
    assert.strictEqual(updated.messages[0].content, 'hello');
  });

  await test('clearSessionMessages empties messages', async () => {
    const session = createSession();
    await addToSession(session, { role: 'user', content: 'hello' });
    const cleared = await clearSessionMessages(session);
    assert.strictEqual(cleared.messages.length, 0);
  });

  await test('session has unique IDs', async () => {
    const s1 = createSession();
    const s2 = createSession();
    assert.notStrictEqual(s1.id, s2.id);
  });
}

runTests();
