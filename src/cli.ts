#!/usr/bin/env node
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { batchCapture } from './batch.js';
import {
  askBrain,
  compareCaptures,
  detectAndWriteTrends,
  exportDesignSystem,
  generateComponentGraphCmd,
  generateMoodboard,
  generateReviewChecklist,
  initBrain,
  ingestInspiration,
  nameTokensCmd,
  recordOutcome,
  reindexBrain,
  runSystemDiff,
  searchBrain,
  analyzeWritingStyleCmd,
  buildGraphView,
  buildWiki,
  generateContext,
} from './commands.js';
import { runScorecard } from './scorecard.js';
import { shouldSkipPrompts } from './interactive.js';
import { resolveLlmConfig } from './llm.js';
import { getDefaultSkillRepo, installSkill, maybePromptSkillInstall } from './skillPrompt.js';
import { buildTasteProfile } from './taste.js';
import { renderTasteProfile } from './tasteRenderer.js';

function toStringList(value?: string | string[]): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => item.split(',')).map((item) => item.trim()).filter(Boolean);
  }

  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function parseInteger(value: string, defaultValue: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function parseViewports(values?: string[]): Array<{ label: string; width: number; height: number }> | undefined {
  if (!values || values.length === 0) {
    return undefined;
  }

  const parsed = values
    .flatMap((value) => value.split(','))
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item, index) => {
      const [label, size] = item.includes('=') ? item.split('=') : [`vp${index + 1}`, item];
      const [widthRaw, heightRaw] = size.split('x');
      const width = Number.parseInt(widthRaw, 10);
      const height = Number.parseInt(heightRaw, 10);
      if (!Number.isFinite(width) || !Number.isFinite(height)) {
        throw new Error(`Invalid viewport format: ${item}. Use label=1440x1200.`);
      }
      return { label: label.trim(), width, height };
    });

  return parsed.length > 0 ? parsed : undefined;
}

function getVersion(): string {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function printBanner(version: string): void {
  const DIM = '\x1b[2m';
  const BOLD = '\x1b[1m';
  const CYAN = '\x1b[36m';
  const RESET = '\x1b[0m';

  const banner = [
    '',
    `${BOLD}${CYAN}  ┌─────────────────────────────────────────┐${RESET}`,
    `${BOLD}${CYAN}  │${RESET}                                         ${BOLD}${CYAN}│${RESET}`,
    `${BOLD}${CYAN}  │${RESET}   ${BOLD}design-brain${RESET}  ${DIM}v${version}${RESET}                   ${BOLD}${CYAN}│${RESET}`,
    `${BOLD}${CYAN}  │${RESET}   ${DIM}Relational design memory${RESET}                ${BOLD}${CYAN}│${RESET}`,
    `${BOLD}${CYAN}  │${RESET}                                         ${BOLD}${CYAN}│${RESET}`,
    `${BOLD}${CYAN}  └─────────────────────────────────────────┘${RESET}`,
    '',
  ];
  console.log(banner.join('\n'));
}

async function main(): Promise<void> {
  const version = getVersion();
  const program = new Command();

  program
    .name('design-brain-memory')
    .description('Relational markdown design memory powered by Agent Browser CLI')
    .version(version)
    .option('-y, --yes', 'Skip interactive prompts')
    .hook('preAction', () => {
      printBanner(version);
    });

  program
    .command('init')
    .description('Initialize .design-brain in the given workspace')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: { root: string }) => {
      await initBrain(path.resolve(options.root));
      console.log(`Initialized design brain at ${path.resolve(options.root, '.design-brain')}`);
    });

  program
    .command('ingest')
    .description('Ingest a URL or screenshot into a project design wiki')
    .requiredOption('--project <project>', 'Project ID/slug')
    .option('--project-name <name>', 'Readable project name')
    .option('--project-description <text>', 'Project description shown in the wiki')
    .option('--url <url>', 'Website URL inspiration source')
    .option('--screenshot <path>', 'Local screenshot inspiration source')
    .option('--name <name>', 'Record name')
    .option('--notes <notes>', 'Freeform notes about why it matters')
    .option('--inspiration <text>', 'Summary of what this source inspired')
    .option('--tags <tags...>', 'Tags list (repeat or comma-separated)')
    .option('--journey-steps <n>', 'How many click-through journey steps to capture', '3')
    .option('--viewport <viewports...>', 'Responsive viewports: desktop=1440x1200,mobile=390x844')
    .option('--llm-base-url <url>', 'OpenAI-compatible LLM base URL')
    .option('--llm-api-key <key>', 'LLM API key')
    .option('--llm-model <model>', 'LLM model id')
    .option('--llm-timeout-ms <ms>', 'LLM timeout in milliseconds', '30000')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .option('--no-visuals', 'Skip SVG visual generation')
    .option('--live', 'Show live extraction visualization in terminal')
    .action(async (options: {
      project: string;
      projectName?: string;
      projectDescription?: string;
      url?: string;
      screenshot?: string;
      name?: string;
      notes?: string;
      inspiration?: string;
      tags?: string[];
      journeySteps: string;
      viewport?: string[];
      llmBaseUrl?: string;
      llmApiKey?: string;
      llmModel?: string;
      llmTimeoutMs: string;
      root: string;
      visuals: boolean;
      live?: boolean;
    }) => {
      const llm = resolveLlmConfig({
        baseUrl: options.llmBaseUrl,
        apiKey: options.llmApiKey,
        model: options.llmModel,
        timeoutMs: parseInteger(options.llmTimeoutMs, 30000),
      });

      const result = await ingestInspiration({
        rootDir: path.resolve(options.root),
        project: options.project,
        projectName: options.projectName,
        projectDescription: options.projectDescription,
        url: options.url,
        screenshot: options.screenshot,
        name: options.name,
        notes: options.notes,
        inspirationSummary: options.inspiration,
        tags: toStringList(options.tags),
        llm,
        journeySteps: parseInteger(options.journeySteps, 3),
        responsiveViewports: parseViewports(options.viewport),
        skipVisuals: !options.visuals,
        live: options.live ?? false,
      });

      console.log(`Captured inspiration ${result.inspirationId} in project ${result.projectId}`);

      const globalOptions = program.opts<{ yes?: boolean }>();
      await maybePromptSkillInstall(shouldSkipPrompts(Boolean(globalOptions.yes)));
    });

  program
    .command('outcome')
    .description('Record what the team built and link it to inspirations')
    .requiredOption('--project <project>', 'Project ID/slug')
    .requiredOption('--title <title>', 'Outcome title')
    .requiredOption('--description <description>', 'Outcome description')
    .option('--artifact-url <url>', 'Deployed link, Figma link, or PR URL')
    .option('--inspired-by <ids...>', 'Linked inspiration IDs')
    .option('--tags <tags...>', 'Tags list (repeat or comma-separated)')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: {
      project: string;
      title: string;
      description: string;
      artifactUrl?: string;
      inspiredBy?: string[];
      tags?: string[];
      root: string;
    }) => {
      const result = await recordOutcome({
        rootDir: path.resolve(options.root),
        project: options.project,
        title: options.title,
        description: options.description,
        inspiredBy: toStringList(options.inspiredBy),
        artifactUrl: options.artifactUrl,
        tags: toStringList(options.tags),
      });

      console.log(`Recorded outcome ${result.outcomeId} in project ${result.projectId}`);
    });

  program
    .command('search')
    .description('Keyword search over relational design memory')
    .requiredOption('--query <text>', 'Search query')
    .option('--project <project>', 'Filter to project')
    .option('--limit <n>', 'Max results', '10')
    .option('--json', 'Output as JSON', false)
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: {
      query: string;
      project?: string;
      limit: string;
      json: boolean;
      root: string;
    }) => {
      const results = await searchBrain({
        rootDir: path.resolve(options.root),
        query: options.query,
        project: options.project,
        limit: parseInteger(options.limit, 10),
      });

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      if (results.length === 0) {
        console.log('No matches found.');
        return;
      }

      for (const result of results) {
        console.log(`[${result.type}] ${result.projectId}/${result.id} :: ${result.title} (score=${result.score})`);
        console.log(`  ${result.snippet}`);
      }
    });

  program
    .command('ask')
    .description('Ask a design question against the design brain')
    .requiredOption('--query <text>', 'Question')
    .option('--project <project>', 'Filter to project')
    .option('--limit <n>', 'Context result count', '8')
    .option('--llm-base-url <url>', 'OpenAI-compatible LLM base URL')
    .option('--llm-api-key <key>', 'LLM API key')
    .option('--llm-model <model>', 'LLM model id')
    .option('--llm-timeout-ms <ms>', 'LLM timeout in milliseconds', '30000')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: {
      query: string;
      project?: string;
      limit: string;
      llmBaseUrl?: string;
      llmApiKey?: string;
      llmModel?: string;
      llmTimeoutMs: string;
      root: string;
    }) => {
      const llm = resolveLlmConfig({
        baseUrl: options.llmBaseUrl,
        apiKey: options.llmApiKey,
        model: options.llmModel,
        timeoutMs: parseInteger(options.llmTimeoutMs, 30000),
      });

      const result = await askBrain({
        rootDir: path.resolve(options.root),
        query: options.query,
        project: options.project,
        limit: parseInteger(options.limit, 8),
        llm,
      });

      console.log(result.answer);
      if (result.matches.length > 0) {
        console.log('\nSources:');
        for (const match of result.matches.slice(0, 8)) {
          console.log(`- [${match.type}] ${match.projectId}/${match.id}: ${match.title}`);
        }
      }
    });

  program
    .command('install-skill')
    .description('Install Design Brain skill into your local skills registry')
    .option('--repo <repo>', 'Skill repository override', getDefaultSkillRepo())
    .action(async (options: { repo: string }) => {
      const installed = installSkill(options.repo);
      if (!installed) {
        throw new Error(`Skill install failed. Try manually: npx -y skills add ${options.repo}`);
      }
      console.log(`Installed skill from ${options.repo}`);
    });

  program
    .command('reindex')
    .description('Regenerate markdown wiki and relation graph from database.json')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .option('--no-visuals', 'Skip SVG visual generation')
    .action(async (options: { root: string; visuals: boolean }) => {
      await reindexBrain(path.resolve(options.root), !options.visuals);
      console.log(`Reindexed ${path.resolve(options.root, '.design-brain')}`);
    });

  program
    .command('export')
    .description('Export design system from captured data')
    .requiredOption('--project <project>', 'Project ID/slug')
    .option('--format <format>', 'Export format (tailwind, style-dictionary, css-in-js)', 'tailwind')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: {
      project: string;
      format: string;
      root: string;
    }) => {
      const outPath = await exportDesignSystem({
        rootDir: path.resolve(options.root),
        project: options.project,
        format: options.format,
      });
      console.log(`Exported ${options.format} config to ${outPath}`);
    });

  program
    .command('compare')
    .description('Compare two captures or two versions of the same URL')
    .option('--a <id>', 'First inspiration ID')
    .option('--b <id>', 'Second inspiration ID')
    .option('--inspo <id>', 'Inspiration ID (compares against previous version)')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: { a?: string; b?: string; inspo?: string; root: string }) => {
      const outPath = await compareCaptures({
        rootDir: path.resolve(options.root),
        inspoA: options.a,
        inspoB: options.b,
        inspo: options.inspo,
      });
      console.log(`Comparison written to ${outPath}`);
    });

  program
    .command('batch')
    .description('Batch capture from a file of URLs')
    .requiredOption('--project <project>', 'Project ID/slug')
    .requiredOption('--file <path>', 'Path to URL list file (tab-separated: URL, name, tags)')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .option('--no-visuals', 'Skip SVG visual generation')
    .action(async (options: { project: string; file: string; root: string; visuals: boolean }) => {
      const result = await batchCapture({
        rootDir: path.resolve(options.root),
        project: options.project,
        filePath: path.resolve(options.file),
        skipVisuals: !options.visuals,
      });
      console.log(`Batch complete: ${result.succeeded}/${result.total} captured`);
      if (result.failed.length > 0) {
        console.log(`Failed: ${result.failed.join(', ')}`);
      }
    });

  program
    .command('moodboard')
    .description('Generate visual moodboard from project captures')
    .requiredOption('--project <project>', 'Project ID/slug')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: { project: string; root: string }) => {
      const outPath = await generateMoodboard({
        rootDir: path.resolve(options.root),
        project: options.project,
      });
      console.log(`Moodboard generated at ${outPath}`);
    });

  program
    .command('trends')
    .description('Detect design trends across captures')
    .option('--project <project>', 'Filter to project')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: { project?: string; root: string }) => {
      const result = await detectAndWriteTrends({
        rootDir: path.resolve(options.root),
        project: options.project,
      });
      console.log(`Detected ${result.trends} trends, wrote ${result.written} notes`);
    });

  program
    .command('scorecard')
    .description('Audit local codebase against captured design tokens')
    .requiredOption('--project <project>', 'Project ID/slug')
    .requiredOption('--scan <path>', 'Directory to scan')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: { project: string; scan: string; root: string }) => {
      const outPath = await runScorecard({
        rootDir: path.resolve(options.root),
        project: options.project,
        scanPath: path.resolve(options.scan),
      });
      console.log(`Scorecard written to ${outPath}`);
    });

  program
    .command('component-graph')
    .description('Generate component relationship graph for a project')
    .requiredOption('--project <project>', 'Project ID/slug')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: { project: string; root: string }) => {
      const outPath = await generateComponentGraphCmd({
        rootDir: path.resolve(options.root),
        project: options.project,
      });
      console.log(`Component graph written to ${outPath}`);
    });

  program
    .command('review')
    .description('Generate design review checklist')
    .requiredOption('--project <project>', 'Project ID/slug')
    .option('--scan <path>', 'Directory to scan for codebase audit')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: { project: string; scan?: string; root: string }) => {
      const outPath = await generateReviewChecklist({
        rootDir: path.resolve(options.root),
        project: options.project,
        scanPath: options.scan ? path.resolve(options.scan) : undefined,
      });
      console.log(`Review checklist written to ${outPath}`);
    });

  program
    .command('name-tokens')
    .description('Preview human-readable token names for a project')
    .requiredOption('--project <project>', 'Project ID/slug')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: { project: string; root: string }) => {
      const map = await nameTokensCmd({
        rootDir: path.resolve(options.root),
        project: options.project,
      });
      for (const [raw, name] of map) {
        console.log(`${raw} → ${name}`);
      }
      console.log(`\n${map.size} tokens named`);
    });

  program
    .command('wiki')
    .description('Generate design wiki with per-project pages and shared context space')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: { root: string }) => {
      const result = await buildWiki({
        rootDir: path.resolve(options.root),
      });
      console.log(`Wiki generated: ${result.projectPages} project pages, ${result.sharedTokens} shared tokens`);
      console.log(`Browse at ${result.wikiDir}`);
    });

  program
    .command('graph')
    .description('Generate interactive knowledge graph visualization')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: { root: string }) => {
      const outPath = await buildGraphView({
        rootDir: path.resolve(options.root),
      });
      console.log(`Knowledge graph generated at ${outPath}`);
      console.log('Open in your browser to explore.');
    });

  program
    .command('context')
    .description('Generate design context file for AI tools (Claude Code, Cursor)')
    .option('--project <project>', 'Project ID (omit for unified cross-project context)')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: { project?: string; root: string }) => {
      const outPath = await generateContext({
        rootDir: path.resolve(options.root),
        project: options.project,
      });
      console.log(`Design context written to ${outPath}`);
      console.log('Drop this file into .claude/ or .cursorrules for AI-assisted development.');
    });

  program
    .command('writing-style')
    .description('Analyze writing style patterns across captured content')
    .requiredOption('--project <project>', 'Project ID/slug')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: { project: string; root: string }) => {
      const outPath = await analyzeWritingStyleCmd({
        rootDir: path.resolve(options.root),
        project: options.project,
      });
      console.log(`Writing style analysis written to ${outPath}`);
    });

  program
    .command('system-diff')
    .description('Diff design systems between projects or over time')
    .option('--project <project>', 'Project ID for temporal diff')
    .option('--project-a <project>', 'First project for cross-project diff')
    .option('--project-b <project>', 'Second project for cross-project diff')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (options: { project?: string; projectA?: string; projectB?: string; root: string }) => {
      const outPath = await runSystemDiff({
        rootDir: path.resolve(options.root),
        project: options.project,
        projectA: options.projectA,
        projectB: options.projectB,
      });
      console.log(`System diff written to ${outPath}`);
    });

  program
    .command('taste')
    .description('Build a taste profile from multiple design inspirations')
    .argument('<urls...>', 'URLs or domains to analyze')
    .requiredOption('--project <project>', 'Project ID/slug')
    .option('--project-name <name>', 'Readable project name')
    .option('--headed', 'Use visible browser for capture', false)
    .option('--llm-base-url <url>', 'OpenAI-compatible LLM base URL')
    .option('--llm-api-key <key>', 'LLM API key')
    .option('--llm-model <model>', 'LLM model id')
    .option('--llm-timeout-ms <ms>', 'LLM timeout in milliseconds', '30000')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .action(async (urls: string[], options: {
      project: string;
      projectName?: string;
      headed: boolean;
      llmBaseUrl?: string;
      llmApiKey?: string;
      llmModel?: string;
      llmTimeoutMs: string;
      root: string;
    }) => {
      const llm = resolveLlmConfig({
        baseUrl: options.llmBaseUrl,
        apiKey: options.llmApiKey,
        model: options.llmModel,
        timeoutMs: parseInteger(options.llmTimeoutMs, 30000),
      });

      const profile = await buildTasteProfile({
        rootDir: path.resolve(options.root),
        projectId: options.project,
        projectName: options.projectName,
        urls,
        headed: options.headed,
        llm,
      });

      console.log(renderTasteProfile(profile));
    });

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
