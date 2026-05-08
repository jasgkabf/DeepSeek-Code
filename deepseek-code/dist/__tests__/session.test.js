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
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const session_1 = require("../session");
const TEST_DIR = path.join(os.tmpdir(), 'deepseek-code-test-sessions-' + Date.now());
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
console.log('\n🧪 Session Module Tests\n');
const originalDir = process.env.HOME;
test('createSession returns valid session', () => {
    const session = (0, session_1.createSession)();
    assert.ok(session.id);
    assert.ok(session.createdAt);
    assert.ok(session.updatedAt);
    assert.strictEqual(session.messages.length, 0);
});
test('addToSession appends message', () => {
    const session = (0, session_1.createSession)();
    const updated = (0, session_1.addToSession)(session, { role: 'user', content: 'hello' });
    assert.strictEqual(updated.messages.length, 1);
    assert.strictEqual(updated.messages[0].content, 'hello');
});
test('clearSessionMessages empties messages', () => {
    const session = (0, session_1.createSession)();
    (0, session_1.addToSession)(session, { role: 'user', content: 'hello' });
    const cleared = (0, session_1.clearSessionMessages)(session);
    assert.strictEqual(cleared.messages.length, 0);
});
test('session has unique IDs', () => {
    const s1 = (0, session_1.createSession)();
    const s2 = (0, session_1.createSession)();
    assert.notStrictEqual(s1.id, s2.id);
});
//# sourceMappingURL=session.test.js.map