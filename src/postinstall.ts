import path from 'node:path';
import { isAutomatedEnvironment } from './interactive.js';
import { installBundledSkillLocally, setSkillPromptDismissed } from './skillPrompt.js';

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function shouldSkipPostinstall(): boolean {
  if (isTruthyEnv(process.env.DESIGN_BRAIN_SKIP_POSTINSTALL)) {
    return true;
  }
  if (isAutomatedEnvironment()) {
    return true;
  }

  const initCwd = process.env.INIT_CWD;
  if (initCwd && path.resolve(initCwd) === path.resolve(process.cwd())) {
    // Likely a local development install in this repo; avoid surprising writes to $HOME.
    return true;
  }

  return false;
}

function main(): void {
  if (shouldSkipPostinstall()) {
    return;
  }

  try {
    const localTargets = installBundledSkillLocally({ includeProjectLocalFallback: false });
    if (localTargets.length === 0) {
      return;
    }

    setSkillPromptDismissed(true);
    console.log(
      `[design-brain-memory] Installed Design Brain skill for: ${localTargets.join(', ')}`,
    );
  } catch {
    // Never fail package installation for onboarding automation.
  }
}

main();
