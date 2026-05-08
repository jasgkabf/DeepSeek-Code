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
const crypto_1 = require("../crypto");
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
console.log('\n🧪 Crypto Module Tests\n');
test('encrypt returns prefixed string', () => {
    const result = (0, crypto_1.encrypt)('my-secret-key');
    assert.ok(result.startsWith('enc:'));
});
test('decrypt recovers original value', () => {
    const original = 'my-secret-api-key-12345';
    const encrypted = (0, crypto_1.encrypt)(original);
    const decrypted = (0, crypto_1.decrypt)(encrypted);
    assert.strictEqual(decrypted, original);
});
test('isEncrypted detects encrypted values', () => {
    const encrypted = (0, crypto_1.encrypt)('test');
    assert.strictEqual((0, crypto_1.isEncrypted)(encrypted), true);
});
test('isEncrypted returns false for plaintext', () => {
    assert.strictEqual((0, crypto_1.isEncrypted)('plain-text'), false);
});
test('decrypt returns plaintext unchanged', () => {
    const plain = 'not-encrypted';
    assert.strictEqual((0, crypto_1.decrypt)(plain), plain);
});
test('encrypt handles empty string', () => {
    assert.strictEqual((0, crypto_1.encrypt)(''), '');
});
test('decrypt handles empty string', () => {
    assert.strictEqual((0, crypto_1.decrypt)(''), '');
});
test('encrypt/decrypt handles unicode', () => {
    const original = '中文密钥🔑';
    const encrypted = (0, crypto_1.encrypt)(original);
    const decrypted = (0, crypto_1.decrypt)(encrypted);
    assert.strictEqual(decrypted, original);
});
//# sourceMappingURL=crypto.test.js.map