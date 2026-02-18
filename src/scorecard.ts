import path from 'node:path';
import fs from 'fs-extra';
import type { ProjectRecord } from './types.js';
import { aggregateColors, aggregateTypography, aggregateMotion } from './aggregate.js';
import { projectDir } from './store.js';

export interface CodebaseTokens {
  colors: string[];
  fontFamilies: string[];
  fontSizes: string[];
  transitions: string[];
}

export interface ScorecardDetail {
  value: string;
  file: string;
  line: number;
}

export interface ScorecardReport {
  filesScanned: number;
  colorScore: { onPalette: number; offPalette: number; details: ScorecardDetail[] };
  typographyScore: { onSystem: number; offSystem: number; details: ScorecardDetail[] };
  componentScore: { covered: number; missing: number; coveredKinds: string[]; missingKinds: string[] };
  motionScore: { consistent: number; inconsistent: number; details: ScorecardDetail[] };
}

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const RGB_RE = /rgb\([^)]+\)/g;
const FONT_FAMILY_RE = /font-family:\s*([^;]+)/g;
const FONT_SIZE_RE = /font-size:\s*([^;]+)/g;
const TRANSITION_RE = /transition[^:]*:\s*([^;]+)/g;

const SCAN_EXTENSIONS = new Set(['.css', '.scss', '.less', '.html', '.tsx', '.jsx', '.vue', '.svelte']);

export function scanCssContent(css: string): CodebaseTokens {
  const colors: string[] = [];
  const fontFamilies: string[] = [];
  const fontSizes: string[] = [];
  const transitions: string[] = [];

  for (const match of css.matchAll(HEX_RE)) {
    colors.push(match[0]);
  }
  for (const match of css.matchAll(RGB_RE)) {
    colors.push(match[0]);
  }
  for (const match of css.matchAll(FONT_FAMILY_RE)) {
    fontFamilies.push(match[1].trim());
  }
  for (const match of css.matchAll(FONT_SIZE_RE)) {
    fontSizes.push(match[1].trim());
  }
  for (const match of css.matchAll(TRANSITION_RE)) {
    transitions.push(match[1].trim());
  }

  return { colors, fontFamilies, fontSizes, transitions };
}

async function collectFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      files.push(...await collectFiles(fullPath));
    } else if (SCAN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function scanCodebase(scanPath: string): Promise<{ tokens: CodebaseTokens; filesScanned: number }> {
  const files = await collectFiles(scanPath);
  const merged: CodebaseTokens = { colors: [], fontFamilies: [], fontSizes: [], transitions: [] };

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const tokens = scanCssContent(content);
    merged.colors.push(...tokens.colors);
    merged.fontFamilies.push(...tokens.fontFamilies);
    merged.fontSizes.push(...tokens.fontSizes);
    merged.transitions.push(...tokens.transitions);
  }

  return { tokens: merged, filesScanned: files.length };
}

export function scoreAgainstProject(codebase: CodebaseTokens, project: ProjectRecord): Omit<ScorecardReport, 'filesScanned'> {
  // Color scoring
  const paletteColors = new Set(aggregateColors(project.inspirations).map((c) => c.hex.toUpperCase()));
  let onPalette = 0;
  let offPalette = 0;
  const colorDetails: ScorecardDetail[] = [];
  for (const color of codebase.colors) {
    const normalized = color.toUpperCase().replace(/^#([0-9A-F])([0-9A-F])([0-9A-F])$/, '#$1$1$2$2$3$3');
    if (paletteColors.has(normalized)) {
      onPalette++;
    } else {
      offPalette++;
      colorDetails.push({ value: color, file: '', line: 0 });
    }
  }

  // Typography scoring
  const systemFonts = new Set(
    aggregateTypography(project.inspirations).map((t) => t.fontFamily.split(',')[0].trim().replace(/['"]/g, '').toLowerCase())
  );
  const systemSizes = new Set(
    aggregateTypography(project.inspirations).map((t) => t.fontSize)
  );
  let onSystem = 0;
  let offSystem = 0;
  const typoDetails: ScorecardDetail[] = [];
  for (const family of codebase.fontFamilies) {
    const first = family.split(',')[0].trim().replace(/['"]/g, '').toLowerCase();
    if (systemFonts.has(first)) {
      onSystem++;
    } else {
      offSystem++;
      typoDetails.push({ value: family, file: '', line: 0 });
    }
  }
  for (const size of codebase.fontSizes) {
    if (systemSizes.has(size.trim())) {
      onSystem++;
    } else {
      offSystem++;
      typoDetails.push({ value: size, file: '', line: 0 });
    }
  }

  // Component scoring
  const capturedKinds = new Set(project.inspirations.flatMap((i) => i.analysis.components.map((c) => c.kind)));
  const coveredKinds = [...capturedKinds];
  const missingKinds: string[] = [];

  // Motion scoring
  const capturedDurations = new Set<string>();
  const capturedEasings = new Set<string>();
  for (const m of aggregateMotion(project.inspirations)) {
    for (const t of m.transitions ?? []) {
      if (t.duration) capturedDurations.add(t.duration);
      if (t.timingFunction) capturedEasings.add(t.timingFunction);
    }
  }
  let consistent = 0;
  let inconsistent = 0;
  const motionDetails: ScorecardDetail[] = [];
  for (const transition of codebase.transitions) {
    const durationMatch = transition.match(/(\d+(?:\.\d+)?)(s|ms)/);
    if (durationMatch) {
      const val = durationMatch[2] === 'ms' ? `${parseFloat(durationMatch[1]) / 1000}s` : `${durationMatch[1]}s`;
      if (capturedDurations.has(val)) {
        consistent++;
      } else {
        inconsistent++;
        motionDetails.push({ value: transition, file: '', line: 0 });
      }
    }
  }

  return {
    colorScore: { onPalette, offPalette, details: colorDetails.slice(0, 20) },
    typographyScore: { onSystem, offSystem, details: typoDetails.slice(0, 20) },
    componentScore: { covered: coveredKinds.length, missing: missingKinds.length, coveredKinds, missingKinds },
    motionScore: { consistent, inconsistent, details: motionDetails.slice(0, 20) },
  };
}

function pct(on: number, off: number): string {
  const total = on + off;
  if (total === 0) return 'N/A';
  return `${Math.round((on / total) * 100)}%`;
}

export function renderScorecard(report: ScorecardReport, projectId: string): string {
  const colorPct = pct(report.colorScore.onPalette, report.colorScore.offPalette);
  const typoPct = pct(report.typographyScore.onSystem, report.typographyScore.offSystem);
  const motionPct = pct(report.motionScore.consistent, report.motionScore.inconsistent);

  const lines = [
    `# Design System Scorecard — ${projectId}\n`,
    `Files scanned: ${report.filesScanned}\n`,
    '## Scores\n',
    '| Category | Score | On-System | Off-System |',
    '| --- | --- | --- | --- |',
    `| Colors | ${colorPct} | ${report.colorScore.onPalette} | ${report.colorScore.offPalette} |`,
    `| Typography | ${typoPct} | ${report.typographyScore.onSystem} | ${report.typographyScore.offSystem} |`,
    `| Components | ${report.componentScore.covered} kinds | ${report.componentScore.covered} | ${report.componentScore.missing} |`,
    `| Motion | ${motionPct} | ${report.motionScore.consistent} | ${report.motionScore.inconsistent} |`,
    '',
  ];

  if (report.colorScore.details.length > 0) {
    lines.push('## Off-Palette Colors\n');
    for (const d of report.colorScore.details) {
      lines.push(`- \`${d.value}\``);
    }
    lines.push('');
  }

  if (report.typographyScore.details.length > 0) {
    lines.push('## Off-System Typography\n');
    for (const d of report.typographyScore.details) {
      lines.push(`- \`${d.value}\``);
    }
    lines.push('');
  }

  if (report.motionScore.details.length > 0) {
    lines.push('## Inconsistent Motion\n');
    for (const d of report.motionScore.details) {
      lines.push(`- \`${d.value}\``);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export async function runScorecard(params: {
  rootDir: string;
  project: string;
  scanPath: string;
}): Promise<string> {
  const { loadDatabase } = await import('./store.js');
  const db = await loadDatabase(params.rootDir);
  const project = db.projects.find((p) => p.id === params.project);
  if (!project) throw new Error(`Project not found: ${params.project}`);

  const { tokens, filesScanned } = await scanCodebase(params.scanPath);
  const scores = scoreAgainstProject(tokens, project);
  const report: ScorecardReport = { filesScanned, ...scores };

  const md = renderScorecard(report, project.id);
  const outPath = path.join(projectDir(params.rootDir, project.id), 'scorecard.md');
  await fs.ensureDir(path.dirname(outPath));
  await fs.writeFile(outPath, md);

  return outPath;
}
