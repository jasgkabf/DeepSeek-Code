"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const safety_1 = require("../agent/safety");
function test(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
    }
    catch (err) {
        console.log(`  ✗ ${name}: ${err.message}`);
        process.exitCode = 1;
    }
}
console.log('\n🧪 Safety Module Tests\n');
test('isHardBlockCommand detects rm -rf /', () => {
    assert.strictEqual((0, safety_1.isHardBlockCommand)('rm -rf /'), true);
});
test('isHardBlockCommand detects mkfs', () => {
    assert.strictEqual((0, safety_1.isHardBlockCommand)('mkfs /dev/sda1'), true);
});
test('isHardBlockCommand does not block ls', () => {
    assert.strictEqual((0, safety_1.isHardBlockCommand)('ls -la'), false);
});
test('isSoftBlockCommand detects shutdown', () => {
    assert.strictEqual((0, safety_1.isSoftBlockCommand)('shutdown now'), true);
});
test('isSoftBlockCommand detects reboot', () => {
    assert.strictEqual((0, safety_1.isSoftBlockCommand)('reboot'), true);
});
test('isDangerousCommand with safeMode=true blocks soft commands', () => {
    assert.strictEqual((0, safety_1.isDangerousCommand)('shutdown now', true), true);
});
test('isDangerousCommand with safeMode=false allows soft commands', () => {
    assert.strictEqual((0, safety_1.isDangerousCommand)('shutdown now', false), false);
});
test('isDangerousCommand always blocks hard commands', () => {
    assert.strictEqual((0, safety_1.isDangerousCommand)('rm -rf /', false), true);
    assert.strictEqual((0, safety_1.isDangerousCommand)('rm -rf /', true), true);
});
test('isProtectedPath detects /etc/passwd', () => {
    assert.strictEqual((0, safety_1.isProtectedPath)('/etc/passwd'), true);
});
test('isProtectedPath detects /boot/grub', () => {
    assert.strictEqual((0, safety_1.isProtectedPath)('/boot/grub'), true);
});
test('isProtectedPath allows /home/user/project', () => {
    assert.strictEqual((0, safety_1.isProtectedPath)('/home/user/project'), false);
});
test('isWriteToProtectedPath blocks writes to /etc', () => {
    assert.strictEqual((0, safety_1.isWriteToProtectedPath)('/etc/myconfig'), true);
});
test('shouldConfirm with safeMode=true confirms rm', () => {
    assert.strictEqual((0, safety_1.shouldConfirm)('rm file.txt', true), true);
});
test('shouldConfirm with safeMode=false skips confirmation', () => {
    assert.strictEqual((0, safety_1.shouldConfirm)('rm file.txt', false), false);
});
test('getDangerReason returns reason for rm -rf /', () => {
    const reason = (0, safety_1.getDangerReason)('rm -rf /');
    assert.ok(reason && reason.includes('递归删除'));
});
test('getDangerReason returns reason for mkfs', () => {
    const reason = (0, safety_1.getDangerReason)('mkfs /dev/sda1');
    assert.ok(reason && reason.includes('格式化'));
});
test('getDangerReason returns null for safe commands', () => {
    assert.strictEqual((0, safety_1.getDangerReason)('ls -la'), null);
});
//# sourceMappingURL=safety.test.js.map