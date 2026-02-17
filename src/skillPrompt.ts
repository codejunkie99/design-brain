import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { confirmPrompt } from './interactive.js';

interface UserConfig {
  skillPromptDismissed?: boolean;
}

const CONFIG_DIRECTORY = join(homedir(), '.design-brain-memory');
const CONFIG_FILE = join(CONFIG_DIRECTORY, 'config.json');
const DEFAULT_SKILL_REPO = 'design-brain/design-brain';

function readConfig(): UserConfig {
  try {
    if (!existsSync(CONFIG_FILE)) {
      return {};
    }

    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) as UserConfig;
  } catch {
    return {};
  }
}

function writeConfig(config: UserConfig): void {
  try {
    if (!existsSync(CONFIG_DIRECTORY)) {
      mkdirSync(CONFIG_DIRECTORY, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch {
    // no-op: prompt persistence should never block command execution
  }
}

export function getDefaultSkillRepo(): string {
  return process.env.DESIGN_BRAIN_SKILL_REPO?.trim() || DEFAULT_SKILL_REPO;
}

export function installSkill(repo = getDefaultSkillRepo()): boolean {
  try {
    execSync(`npx -y skills add ${repo}`, { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

export async function maybePromptSkillInstall(skipPrompts: boolean): Promise<void> {
  const config = readConfig();
  if (config.skillPromptDismissed) {
    return;
  }
  if (skipPrompts) {
    return;
  }

  console.log('\nTip: install the Design Brain skill for coding agents (Cursor/Claude/Copilot).');
  console.log(`Run via skills registry: npx -y skills add ${getDefaultSkillRepo()}\n`);

  const shouldInstall = await confirmPrompt('Install Design Brain skill now?', true);
  if (!shouldInstall) {
    return;
  }

  const installed = installSkill();
  if (installed) {
    console.log('Design Brain skill installed.');
    writeConfig({ ...config, skillPromptDismissed: true });
    return;
  }

  console.log('Skill install failed. You can install manually:');
  console.log(`  npx -y skills add ${getDefaultSkillRepo()}`);
}
