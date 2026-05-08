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
exports.performUninstall = performUninstall;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process = __importStar(require("child_process"));
const i18n_1 = require("./i18n");
const display_1 = require("./ui/display");
const CONFIG_DIR = path.join(os.homedir(), '.deepseek-code');
async function performUninstall(removeProject = false) {
    const ui = (0, i18n_1.t)().uninstall;
    console.log();
    (0, display_1.showInfo)(ui.title);
    console.log();
    (0, display_1.showWarning)(ui.warning);
    console.log();
    const confirmInput = await (0, display_1.askInput)(ui.confirm);
    if (confirmInput !== ui.confirmType) {
        return { success: false, message: ui.confirmMismatch };
    }
    console.log();
    let removedItems = [];
    if (fs.existsSync(CONFIG_DIR)) {
        (0, display_1.showInfo)(ui.removingConfig);
        let sessionCount = 0;
        const sessionsDir = path.join(CONFIG_DIR, 'sessions');
        if (fs.existsSync(sessionsDir)) {
            (0, display_1.showInfo)(ui.removingSessions);
            const sessionFiles = fs.readdirSync(sessionsDir).filter((f) => f.endsWith('.json'));
            sessionCount = sessionFiles.length;
        }
        let skillCount = 0;
        const skillsDir = path.join(CONFIG_DIR, 'skills');
        if (fs.existsSync(skillsDir)) {
            (0, display_1.showInfo)(ui.removingSkills);
            const skillEntries = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory());
            skillCount = skillEntries.length;
        }
        try {
            fs.rmSync(CONFIG_DIR, { recursive: true, force: true });
            removedItems.push((0, i18n_1.template)(ui.configRemoved, { path: CONFIG_DIR }));
            if (sessionCount > 0) {
                removedItems.push((0, i18n_1.template)(ui.sessionsRemoved, { count: sessionCount }));
            }
            if (skillCount > 0) {
                removedItems.push((0, i18n_1.template)(ui.skillsRemoved, { count: skillCount }));
            }
        }
        catch (err) {
            return { success: false, message: `Failed to remove config dir: ${err.message}` };
        }
    }
    (0, display_1.showInfo)(ui.removingGlobalLink);
    try {
        child_process.execSync('npm unlink -g deepseek-code', { stdio: 'pipe' });
        removedItems.push(ui.globalLinkRemoved);
    }
    catch {
        (0, display_1.showInfo)(ui.notInstalled);
    }
    if (removeProject) {
        const projectDir = findProjectDir();
        if (projectDir && fs.existsSync(projectDir)) {
            (0, display_1.showInfo)(ui.removingProject);
            try {
                fs.rmSync(projectDir, { recursive: true, force: true });
                removedItems.push((0, i18n_1.template)(ui.projectRemoved, { path: projectDir }));
            }
            catch (err) {
                (0, display_1.showWarning)(ui.hint);
            }
        }
    }
    console.log();
    for (const item of removedItems) {
        (0, display_1.showSuccess)('  ✓ ' + item);
    }
    return { success: true, message: ui.success };
}
function findProjectDir() {
    try {
        const binPath = child_process.execSync('which deepseek-code 2>/dev/null', { encoding: 'utf-8' }).trim();
        if (binPath && fs.existsSync(binPath)) {
            const linkTarget = fs.readlinkSync(binPath);
            const resolved = path.resolve(path.dirname(binPath), linkTarget);
            const pkgDir = path.dirname(path.dirname(path.dirname(resolved)));
            if (fs.existsSync(path.join(pkgDir, 'package.json'))) {
                try {
                    const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf-8'));
                    if (pkg.name === 'deepseek-code')
                        return pkgDir;
                }
                catch { /* not our package */ }
            }
        }
    }
    catch { /* not found */ }
    const localDir = path.join(os.homedir(), 'deepseek-code');
    if (fs.existsSync(path.join(localDir, 'package.json'))) {
        return localDir;
    }
    return null;
}
//# sourceMappingURL=uninstall.js.map