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
exports.isHardBlockCommand = isHardBlockCommand;
exports.isSoftBlockCommand = isSoftBlockCommand;
exports.isDangerousCommand = isDangerousCommand;
exports.isProtectedPath = isProtectedPath;
exports.isWriteToProtectedPath = isWriteToProtectedPath;
exports.getDangerReason = getDangerReason;
exports.shouldConfirm = shouldConfirm;
const path = __importStar(require("path"));
const HARD_BLOCK_PATTERNS = [
    /\brm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+|.*--no-preserve-root.*)\//,
    /\brm\s+-rf\s+\//,
    /\bmkfs\b/,
    /\bdd\s+if=/,
    /\bformat\s+[A-Z]:/i,
    />\s*\/dev\/sd/,
];
const SOFT_BLOCK_PATTERNS = [
    /\bshutdown\b/,
    /\breboot\b/,
    /\binit\s+[06]/,
    /\bchmod\s+-R\s+[0-7]*777\s+\//,
    /\bchown\s+-R\s+.*\s+\//,
    /\biptables\b/,
    /\bkill\s+-9\s+1\b/,
    /\bsystemctl\s+(stop|disable)\s+(ssh|sshd|network|firewall)/,
];
const PROTECTED_PATHS = [
    '/etc',
    '/boot',
    '/sys',
    '/proc',
    '/dev',
    '/usr/bin',
    '/usr/sbin',
    '/bin',
    '/sbin',
    '/root',
    'C:\\Windows',
    'C:\\Program Files',
];
const CONFIRM_PATTERNS = [
    /\brm\s+/,
    /\bgit\s+push/,
    /\bgit\s+reset\s+--hard/,
    /\bnpm\s+publish/,
    /\bdocker\s+(rm|rmi)/,
    /\bkubectl\s+delete/,
    /\bdrop\s+table\b/i,
    /\btruncate\s+/i,
    /\bchmod\s+/,
    /\bchown\s+/,
];
function isHardBlockCommand(command) {
    return HARD_BLOCK_PATTERNS.some((p) => p.test(command));
}
function isSoftBlockCommand(command) {
    return SOFT_BLOCK_PATTERNS.some((p) => p.test(command));
}
function isDangerousCommand(command, safeMode = true) {
    if (isHardBlockCommand(command))
        return true;
    if (safeMode && isSoftBlockCommand(command))
        return true;
    return false;
}
function isProtectedPath(filePath) {
    const resolved = path.resolve(filePath);
    return PROTECTED_PATHS.some((p) => resolved.startsWith(p));
}
function isWriteToProtectedPath(filePath) {
    return isProtectedPath(filePath);
}
function getDangerReason(command) {
    if (/\brm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+|.*--no-preserve-root.*)\//.test(command)) {
        return '该命令可能递归删除系统文件';
    }
    if (/\bmkfs\b/.test(command)) {
        return '该命令将格式化磁盘';
    }
    if (/\bdd\s+if=/.test(command)) {
        return '该命令可能直接写入磁盘设备';
    }
    if (/\bshutdown\b/.test(command) || /\breboot\b/.test(command)) {
        return '该命令将关闭或重启系统';
    }
    if (/\biptables\b/.test(command)) {
        return '该命令将修改防火墙规则';
    }
    if (isDangerousCommand(command)) {
        return '该命令被识别为潜在危险操作';
    }
    return null;
}
function shouldConfirm(command, safeMode = true) {
    if (!safeMode)
        return false;
    const lowerCmd = command.toLowerCase().trim();
    return CONFIRM_PATTERNS.some((p) => p.test(lowerCmd));
}
//# sourceMappingURL=safety.js.map