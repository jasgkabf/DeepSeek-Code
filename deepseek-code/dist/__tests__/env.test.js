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
const env_1 = require("../env");
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
console.log('\n🧪 Environment Module Tests\n');
test('detectEnvironment returns valid object', () => {
    (0, env_1.clearEnvCache)();
    const env = (0, env_1.detectEnvironment)();
    assert.ok(typeof env.isTermux === 'boolean');
    assert.ok(typeof env.terminalWidth === 'number');
    assert.ok(typeof env.hasStorageAccess === 'boolean');
    assert.ok(typeof env.packageManager === 'string');
});
test('detectEnvironment caches result', () => {
    const env1 = (0, env_1.detectEnvironment)();
    const env2 = (0, env_1.detectEnvironment)();
    assert.strictEqual(env1, env2);
});
test('isExternalStoragePath detects /sdcard paths', () => {
    assert.strictEqual((0, env_1.isExternalStoragePath)('/sdcard/Download/file.txt'), true);
});
test('isExternalStoragePath detects /storage paths', () => {
    assert.strictEqual((0, env_1.isExternalStoragePath)('/storage/emulated/0/file.txt'), true);
});
test('isExternalStoragePath allows normal paths', () => {
    assert.strictEqual((0, env_1.isExternalStoragePath)('/home/user/project'), false);
});
test('isExternalStoragePath allows relative paths', () => {
    assert.strictEqual((0, env_1.isExternalStoragePath)('./src/index.ts'), false);
});
test('getTermuxStorageHint returns non-empty string', () => {
    const hint = (0, env_1.getTermuxStorageHint)();
    assert.ok(hint.length > 0);
    assert.ok(hint.includes('termux-setup-storage'));
});
test('getRecommendedInstallCommand uses pkg in Termux', () => {
    (0, env_1.clearEnvCache)();
    const env = (0, env_1.detectEnvironment)();
    const cmd = (0, env_1.getRecommendedInstallCommand)('git');
    if (env.isTermux) {
        assert.ok(cmd.includes('pkg install'));
    }
    else {
        assert.ok(cmd.includes('apt install'));
    }
});
//# sourceMappingURL=env.test.js.map