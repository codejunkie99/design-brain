import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { confirmPrompt } from './interactive.js';

interface UserConfig {
  skillPromptDismissed?: boolean;
}

interface SkillTarget {
  name: string;
  detect: () => boolean;
  install: () => void;
}

export interface LocalSkillInstallOptions {
  includeProjectLocalFallback?: boolean;
  workingDirectory?: string;
}

export interface SkillInstallResult {
  localTargets: string[];
  registryInstalled: boolean;
}

const CONFIG_DIRECTORY = join(homedir(), '.design-brain-memory');
const CONFIG_FILE = join(CONFIG_DIRECTORY, 'config.json');
const DEFAULT_SKILL_REPO = 'design-brain/design-brain';
const SKILL_NAME = 'design-brain';
const CODEX_AGENT_CONFIG = `interface:\n  display_name: "design-brain"\n  short_description: "Build and maintain a design knowledge system"\n`;

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

export function setSkillPromptDismissed(dismissed: boolean): void {
  const config = readConfig();
  writeConfig({ ...config, skillPromptDismissed: dismissed });
}

function isCommandAvailable(command: string): boolean {
  try {
    const whichCommand = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${whichCommand} ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function resolveBundledSkillSourceDir(): string | null {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(currentDir, '..', 'plugins', 'design-brain', 'skills', 'design-brain'),
    resolve(currentDir, '..', '..', 'plugins', 'design-brain', 'skills', 'design-brain'),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'SKILL.md'))) {
      return candidate;
    }
  }

  return null;
}

function copyBundledSkill(destinationDir: string, sourceDir: string): void {
  mkdirSync(destinationDir, { recursive: true });
  cpSync(sourceDir, destinationDir, { recursive: true, force: true });
}

function writeCodexAgentConfig(skillDir: string): void {
  const agentsDir = join(skillDir, 'agents');
  mkdirSync(agentsDir, { recursive: true });
  writeFileSync(join(agentsDir, 'openai.yaml'), CODEX_AGENT_CONFIG);
}

function getSkillTargets(
  sourceDir: string,
  options: Required<LocalSkillInstallOptions>,
): SkillTarget[] {
  const home = homedir();
  const targets: SkillTarget[] = [
    {
      name: 'Claude Code',
      detect: () => existsSync(join(home, '.claude')),
      install: () => copyBundledSkill(join(home, '.claude', 'skills', SKILL_NAME), sourceDir),
    },
    {
      name: 'Amp Code',
      detect: () => existsSync(join(home, '.config', 'amp')),
      install: () => copyBundledSkill(join(home, '.config', 'amp', 'skills', SKILL_NAME), sourceDir),
    },
    {
      name: 'Cursor',
      detect: () => existsSync(join(home, '.cursor')),
      install: () => copyBundledSkill(join(home, '.cursor', 'skills', SKILL_NAME), sourceDir),
    },
    {
      name: 'OpenCode',
      detect: () =>
        isCommandAvailable('opencode') || existsSync(join(home, '.config', 'opencode')),
      install: () =>
        copyBundledSkill(join(home, '.config', 'opencode', 'skills', SKILL_NAME), sourceDir),
    },
    {
      name: 'Antigravity',
      detect: () =>
        isCommandAvailable('agy') || existsSync(join(home, '.gemini', 'antigravity')),
      install: () =>
        copyBundledSkill(join(home, '.gemini', 'antigravity', 'skills', SKILL_NAME), sourceDir),
    },
    {
      name: 'Gemini CLI',
      detect: () => isCommandAvailable('gemini') || existsSync(join(home, '.gemini')),
      install: () => copyBundledSkill(join(home, '.gemini', 'skills', SKILL_NAME), sourceDir),
    },
    {
      name: 'Codex',
      detect: () => isCommandAvailable('codex') || existsSync(join(home, '.codex')),
      install: () => {
        const skillDir = join(home, '.codex', 'skills', SKILL_NAME);
        copyBundledSkill(skillDir, sourceDir);
        writeCodexAgentConfig(skillDir);
      },
    },
  ];

  if (options.includeProjectLocalFallback) {
    targets.push({
      name: '.agents/',
      detect: () => true,
      install: () => copyBundledSkill(join(options.workingDirectory, '.agents', SKILL_NAME), sourceDir),
    });
  }

  return targets;
}

export function installBundledSkillLocally(options: LocalSkillInstallOptions = {}): string[] {
  const sourceDir = resolveBundledSkillSourceDir();
  if (!sourceDir) {
    return [];
  }
  const resolvedOptions: Required<LocalSkillInstallOptions> = {
    includeProjectLocalFallback: options.includeProjectLocalFallback ?? true,
    workingDirectory: options.workingDirectory ?? process.cwd(),
  };

  const installedTargets: string[] = [];
  for (const target of getSkillTargets(sourceDir, resolvedOptions)) {
    if (!target.detect()) {
      continue;
    }

    try {
      target.install();
      installedTargets.push(target.name);
    } catch {
      // non-fatal: fall through to other targets / registry installer
    }
  }

  return installedTargets;
}

function installSkillFromRegistry(repo: string): boolean {
  try {
    execSync(`npx -y skills add ${repo}`, { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

export function installSkill(repo = getDefaultSkillRepo()): SkillInstallResult {
  const defaultRepo = getDefaultSkillRepo();
  const shouldTryLocalInstall = repo === defaultRepo;
  const localTargets = shouldTryLocalInstall ? installBundledSkillLocally() : [];
  const registryInstalled = localTargets.length > 0 ? false : installSkillFromRegistry(repo);
  return { localTargets, registryInstalled };
}

function formatInstalledTargets(targets: string[]): string {
  if (targets.length === 0) {
    return '';
  }
  if (targets.length === 1) {
    return targets[0];
  }
  if (targets.length === 2) {
    return `${targets[0]} and ${targets[1]}`;
  }
  return `${targets.slice(0, -1).join(', ')}, and ${targets.at(-1)}`;
}

export async function maybePromptSkillInstall(skipPrompts: boolean): Promise<void> {
  const config = readConfig();
  if (config.skillPromptDismissed) {
    return;
  }
  if (skipPrompts) {
    return;
  }

  console.log('\nTip: install the Design Brain skill for coding agents (Cursor/Claude/Codex).');
  console.log('We can auto-detect supported agent tools and install the skill locally.');
  console.log(`Fallback registry install: npx -y skills add ${getDefaultSkillRepo()}\n`);

  const shouldInstall = await confirmPrompt('Install Design Brain skill now?', true);
  if (!shouldInstall) {
    writeConfig({ ...config, skillPromptDismissed: true });
    return;
  }

  const result = installSkill();
  if (result.localTargets.length > 0) {
    console.log(`Design Brain skill installed in ${formatInstalledTargets(result.localTargets)}.`);
    writeConfig({ ...config, skillPromptDismissed: true });
    return;
  }
  if (result.registryInstalled) {
    console.log('Design Brain skill installed via registry.');
    writeConfig({ ...config, skillPromptDismissed: true });
    return;
  }

  console.log('Skill install failed. You can install manually:');
  console.log(`  npx -y skills add ${getDefaultSkillRepo()}`);
  writeConfig({ ...config, skillPromptDismissed: true });
}
