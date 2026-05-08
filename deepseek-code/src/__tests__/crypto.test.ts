import * as assert from 'assert';
import { encrypt, decrypt, isEncrypted } from '../crypto';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.log(`  ✗ ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n🧪 Crypto Module Tests\n');

test('encrypt returns prefixed string', () => {
  const result = encrypt('my-secret-key');
  assert.ok(result.startsWith('enc:'));
});

test('decrypt recovers original value', () => {
  const original = 'my-secret-api-key-12345';
  const encrypted = encrypt(original);
  const decrypted = decrypt(encrypted);
  assert.strictEqual(decrypted, original);
});

test('isEncrypted detects encrypted values', () => {
  const encrypted = encrypt('test');
  assert.strictEqual(isEncrypted(encrypted), true);
});

test('isEncrypted returns false for plaintext', () => {
  assert.strictEqual(isEncrypted('plain-text'), false);
});

test('decrypt returns plaintext unchanged', () => {
  const plain = 'not-encrypted';
  assert.strictEqual(decrypt(plain), plain);
});

test('encrypt handles empty string', () => {
  assert.strictEqual(encrypt(''), '');
});

test('decrypt handles empty string', () => {
  assert.strictEqual(decrypt(''), '');
});

test('encrypt/decrypt handles unicode', () => {
  const original = '中文密钥🔑';
  const encrypted = encrypt(original);
  const decrypted = decrypt(encrypted);
  assert.strictEqual(decrypted, original);
});
