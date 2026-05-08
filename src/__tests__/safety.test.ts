import * as assert from 'assert';
import { isDangerousCommand, isHardBlockCommand, isSoftBlockCommand, isProtectedPath, isWriteToProtectedPath, shouldConfirm, getDangerReason } from '../agent/safety';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.log(`  ✗ ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n🧪 Safety Module Tests\n');

test('isHardBlockCommand detects rm -rf /', () => {
  assert.strictEqual(isHardBlockCommand('rm -rf /'), true);
});

test('isHardBlockCommand detects mkfs', () => {
  assert.strictEqual(isHardBlockCommand('mkfs /dev/sda1'), true);
});

test('isHardBlockCommand does not block ls', () => {
  assert.strictEqual(isHardBlockCommand('ls -la'), false);
});

test('isSoftBlockCommand detects shutdown', () => {
  assert.strictEqual(isSoftBlockCommand('shutdown now'), true);
});

test('isSoftBlockCommand detects reboot', () => {
  assert.strictEqual(isSoftBlockCommand('reboot'), true);
});

test('isDangerousCommand with safeMode=true blocks soft commands', () => {
  assert.strictEqual(isDangerousCommand('shutdown now', true), true);
});

test('isDangerousCommand with safeMode=false allows soft commands', () => {
  assert.strictEqual(isDangerousCommand('shutdown now', false), false);
});

test('isDangerousCommand always blocks hard commands', () => {
  assert.strictEqual(isDangerousCommand('rm -rf /', false), true);
  assert.strictEqual(isDangerousCommand('rm -rf /', true), true);
});

test('isProtectedPath detects /etc/passwd', () => {
  assert.strictEqual(isProtectedPath('/etc/passwd'), true);
});

test('isProtectedPath detects /boot/grub', () => {
  assert.strictEqual(isProtectedPath('/boot/grub'), true);
});

test('isProtectedPath allows /home/user/project', () => {
  assert.strictEqual(isProtectedPath('/home/user/project'), false);
});

test('isWriteToProtectedPath blocks writes to /etc', () => {
  assert.strictEqual(isWriteToProtectedPath('/etc/myconfig'), true);
});

test('shouldConfirm with safeMode=true confirms rm', () => {
  assert.strictEqual(shouldConfirm('rm file.txt', true), true);
});

test('shouldConfirm with safeMode=false skips confirmation', () => {
  assert.strictEqual(shouldConfirm('rm file.txt', false), false);
});

test('getDangerReason returns reason for rm -rf /', () => {
  const reason = getDangerReason('rm -rf /');
  assert.ok(reason && reason.includes('递归删除'));
});

test('getDangerReason returns reason for mkfs', () => {
  const reason = getDangerReason('mkfs /dev/sda1');
  assert.ok(reason && reason.includes('格式化'));
});

test('getDangerReason returns null for safe commands', () => {
  assert.strictEqual(getDangerReason('ls -la'), null);
});
