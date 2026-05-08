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
exports.detectEnvironment = detectEnvironment;
exports.isExternalStoragePath = isExternalStoragePath;
exports.getTermuxStorageHint = getTermuxStorageHint;
exports.getRecommendedInstallCommand = getRecommendedInstallCommand;
exports.clearEnvCache = clearEnvCache;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let _envCache = null;
function detectEnvironment() {
    if (_envCache)
        return _envCache;
    const isTermux = detectTermux();
    const termuxPrefix = isTermux ? getTermuxPrefix() : '';
    const terminalWidth = process.stdout.columns || 80;
    const hasStorageAccess = isTermux ? checkTermuxStorageAccess() : true;
    const packageManager = isTermux ? 'pkg' : 'apt';
    _envCache = { isTermux, termuxPrefix, terminalWidth, hasStorageAccess, packageManager };
    return _envCache;
}
function detectTermux() {
    if (process.env.TERMUX_VERSION)
        return true;
    if (process.env.TERMUX_PREFIX)
        return true;
    if (process.env.PREFIX && process.env.PREFIX.includes('com.termux'))
        return true;
    const home = process.env.HOME || '';
    if (home.includes('com.termux'))
        return true;
    if (fs.existsSync('/data/data/com.termux'))
        return true;
    return false;
}
function getTermuxPrefix() {
    return process.env.TERMUX_PREFIX || process.env.PREFIX || '/data/data/com.termux/files/usr';
}
function checkTermuxStorageAccess() {
    const sdcard = process.env.HOME + '/storage';
    return fs.existsSync(sdcard) || fs.existsSync('/sdcard');
}
function isExternalStoragePath(filePath) {
    const resolved = path.resolve(filePath);
    return resolved.startsWith('/sdcard') ||
        resolved.startsWith('/storage') ||
        resolved.startsWith('/mnt/media_rw');
}
function getTermuxStorageHint() {
    return '在 Termux 中访问手机存储需要运行: termux-setup-storage（需要先安装 termux-api: pkg install termux-api）';
}
function getRecommendedInstallCommand(packageName) {
    const env = detectEnvironment();
    return env.isTermux ? `pkg install ${packageName}` : `sudo apt install ${packageName}`;
}
function clearEnvCache() {
    _envCache = null;
}
//# sourceMappingURL=env.js.map