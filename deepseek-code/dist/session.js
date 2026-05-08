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
exports.createSession = createSession;
exports.saveSession = saveSession;
exports.loadSession = loadSession;
exports.listSessions = listSessions;
exports.loadLatestSession = loadLatestSession;
exports.addToSession = addToSession;
exports.clearSessionMessages = clearSessionMessages;
exports.trimSessionContext = trimSessionContext;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const SESSION_DIR = path.join(os.homedir(), '.deepseek-code', 'sessions');
function ensureSessionDir() {
    if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
    }
}
function createSession() {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    const now = new Date().toISOString();
    return {
        id,
        createdAt: now,
        updatedAt: now,
        messages: [],
    };
}
function saveSession(session) {
    ensureSessionDir();
    session.updatedAt = new Date().toISOString();
    const filePath = path.join(SESSION_DIR, `${session.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
}
function loadSession(id) {
    ensureSessionDir();
    const filePath = path.join(SESSION_DIR, `${id}.json`);
    if (!fs.existsSync(filePath))
        return null;
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function listSessions() {
    ensureSessionDir();
    const files = fs.readdirSync(SESSION_DIR).filter((f) => f.endsWith('.json'));
    return files
        .map((f) => {
        try {
            const raw = fs.readFileSync(path.join(SESSION_DIR, f), 'utf-8');
            const session = JSON.parse(raw);
            return {
                id: session.id,
                createdAt: session.createdAt,
                messageCount: session.messages.filter((m) => m.role === 'user').length,
            };
        }
        catch {
            return null;
        }
    })
        .filter((s) => s !== null)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
function loadLatestSession() {
    const sessions = listSessions();
    if (sessions.length === 0)
        return null;
    return loadSession(sessions[0].id);
}
function addToSession(session, message) {
    session.messages.push(message);
    saveSession(session);
    return session;
}
function clearSessionMessages(session) {
    session.messages = [];
    session.updatedAt = new Date().toISOString();
    saveSession(session);
    return session;
}
function trimSessionContext(session, maxMessages = 50) {
    if (session.messages.length <= maxMessages)
        return session;
    const systemMsgs = session.messages.filter((m) => m.role === 'system');
    const otherMsgs = session.messages.filter((m) => m.role !== 'system');
    const trimmed = otherMsgs.slice(otherMsgs.length - maxMessages + systemMsgs.length);
    session.messages = [...systemMsgs, ...trimmed];
    saveSession(session);
    return session;
}
//# sourceMappingURL=session.js.map