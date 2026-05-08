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
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.isEncrypted = isEncrypted;
const crypto = __importStar(require("crypto"));
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_PREFIX = 'enc:';
function deriveKey() {
    const os = require('os');
    const machineId = os.hostname() + os.userInfo().username + process.platform;
    return crypto.createHash('sha256').update(machineId).digest();
}
function deriveIv() {
    const os = require('os');
    const ivSeed = os.hostname() + 'deepseek-code-iv-salt';
    return crypto.createHash('md5').update(ivSeed).digest();
}
function encrypt(text) {
    if (!text)
        return text;
    const key = deriveKey();
    const iv = deriveIv();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return ENCRYPTION_PREFIX + encrypted;
}
function decrypt(encryptedText) {
    if (!encryptedText || !encryptedText.startsWith(ENCRYPTION_PREFIX)) {
        return encryptedText;
    }
    try {
        const key = deriveKey();
        const iv = deriveIv();
        const encrypted = encryptedText.slice(ENCRYPTION_PREFIX.length);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch {
        return encryptedText;
    }
}
function isEncrypted(value) {
    return !!value && value.startsWith(ENCRYPTION_PREFIX);
}
//# sourceMappingURL=crypto.js.map