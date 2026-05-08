import * as assert from 'assert';
import { detectEnvironment, isExternalStoragePath, getTermuxStorageHint, getRecommendedInstallCommand, clearEnvCache } from '../env';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.log(`  ✗ ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n🧪 Environment Module Tests\n');

test('detectEnvironment returns valid object', () => {
  clearEnvCache();
  const env = detectEnvironment();
  assert.ok(typeof env.isTermux === 'boolean');
  assert.ok(typeof env.terminalWidth === 'number');
  assert.ok(typeof env.hasStorageAccess === 'boolean');
  assert.ok(typeof env.packageManager === 'string');
});

test('detectEnvironment caches result', () => {
  const env1 = detectEnvironment();
  const env2 = detectEnvironment();
  assert.strictEqual(env1, env2);
});

test('isExternalStoragePath detects /sdcard paths', () => {
  assert.strictEqual(isExternalStoragePath('/sdcard/Download/file.txt'), true);
});

test('isExternalStoragePath detects /storage paths', () => {
  assert.strictEqual(isExternalStoragePath('/storage/emulated/0/file.txt'), true);
});

test('isExternalStoragePath allows normal paths', () => {
  assert.strictEqual(isExternalStoragePath('/home/user/project'), false);
});

test('isExternalStoragePath allows relative paths', () => {
  assert.strictEqual(isExternalStoragePath('./src/index.ts'), false);
});

test('getTermuxStorageHint returns non-empty string', () => {
  const hint = getTermuxStorageHint();
  assert.ok(hint.length > 0);
  assert.ok(hint.includes('termux-setup-storage'));
});

test('getRecommendedInstallCommand uses pkg in Termux', () => {
  clearEnvCache();
  const env = detectEnvironment();
  const cmd = getRecommendedInstallCommand('git');
  if (env.isTermux) {
    assert.ok(cmd.includes('pkg install'));
  } else {
    assert.ok(cmd.includes('apt install'));
  }
});
