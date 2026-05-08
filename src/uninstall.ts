import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import { t, template } from './i18n';
import { showInfo, showSuccess, showWarning, showError, askInput } from './ui/display';

const CONFIG_DIR = path.join(os.homedir(), '.deepseek-code');

export interface UninstallResult {
  success: boolean;
  message: string;
}

export async function performUninstall(removeProject: boolean = false): Promise<UninstallResult> {
  const ui = t().uninstall;

  console.log();
  showInfo(ui.title);
  console.log();
  showWarning(ui.warning);
  console.log();

  const confirmInput = await askInput(ui.confirm);
  if (confirmInput !== ui.confirmType) {
    return { success: false, message: ui.confirmMismatch };
  }

  console.log();

  let removedItems: string[] = [];

  if (fs.existsSync(CONFIG_DIR)) {
    showInfo(ui.removingConfig);

    let sessionCount = 0;
    const sessionsDir = path.join(CONFIG_DIR, 'sessions');
    if (fs.existsSync(sessionsDir)) {
      showInfo(ui.removingSessions);
      const sessionFiles = fs.readdirSync(sessionsDir).filter((f) => f.endsWith('.json'));
      sessionCount = sessionFiles.length;
    }

    let skillCount = 0;
    const skillsDir = path.join(CONFIG_DIR, 'skills');
    if (fs.existsSync(skillsDir)) {
      showInfo(ui.removingSkills);
      const skillEntries = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory());
      skillCount = skillEntries.length;
    }

    try {
      fs.rmSync(CONFIG_DIR, { recursive: true, force: true });
      removedItems.push(template(ui.configRemoved, { path: CONFIG_DIR }));
      if (sessionCount > 0) {
        removedItems.push(template(ui.sessionsRemoved, { count: sessionCount }));
      }
      if (skillCount > 0) {
        removedItems.push(template(ui.skillsRemoved, { count: skillCount }));
      }
    } catch (err: any) {
      return { success: false, message: `Failed to remove config dir: ${err.message}` };
    }
  }

  showInfo(ui.removingGlobalLink);
  try {
    child_process.execSync('npm unlink -g deepseek-code', { stdio: 'pipe' });
    removedItems.push(ui.globalLinkRemoved);
  } catch {
    showInfo(ui.notInstalled);
  }

  if (removeProject) {
    const projectDir = findProjectDir();
    if (projectDir && fs.existsSync(projectDir)) {
      showInfo(ui.removingProject);
      try {
        fs.rmSync(projectDir, { recursive: true, force: true });
        removedItems.push(template(ui.projectRemoved, { path: projectDir }));
      } catch (err: any) {
        showWarning(ui.hint);
      }
    }
  }

  console.log();
  for (const item of removedItems) {
    showSuccess('  ✓ ' + item);
  }

  return { success: true, message: ui.success };
}

function findProjectDir(): string | null {
  try {
    const binPath = child_process.execSync('which deepseek-code 2>/dev/null', { encoding: 'utf-8' }).trim();
    if (binPath && fs.existsSync(binPath)) {
      const linkTarget = fs.readlinkSync(binPath);
      const resolved = path.resolve(path.dirname(binPath), linkTarget);
      const pkgDir = path.dirname(path.dirname(path.dirname(resolved)));
      if (fs.existsSync(path.join(pkgDir, 'package.json'))) {
        try {
          const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf-8'));
          if (pkg.name === 'deepseek-code') return pkgDir;
        } catch { /* not our package */ }
      }
    }
  } catch { /* not found */ }

  const localDir = path.join(os.homedir(), 'deepseek-code');
  if (fs.existsSync(path.join(localDir, 'package.json'))) {
    return localDir;
  }

  return null;
}
