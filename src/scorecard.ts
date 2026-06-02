import path from 'node:path';
import fs from 'fs-extra';
import type { ProjectRecord } from './types.js';
import { aggregateColors, aggregateTypography, aggregateMotion } from './aggregate.js';
import { projectDir } from './store.js';

export interface ScorecardDetail {
  value: string;
  file: string;
  line: number;
}

export interface CodebaseTokens {
  colors: string[];
  fontFamilies: string[];
  fontSizes: string[];
  transitions: string[];
  colorOccurrences?: ScorecardDetail[];
  fontFamilyOccurrences?: ScorecardDetail[];
  fontSizeOccurrences?: ScorecardDetail[];
  transitionOccurrences?: ScorecardDetail[];
  sourceText?: string;
}

export interface ScorecardReport {
  filesScanned: number;
  colorScore: { onPalette: number; offPalette: number; details: ScorecardDetail[] };
  typographyScore: { onSystem: number; offSystem: number; details: ScorecardDetail[] };
  componentScore: { covered: number; missing: number; coveredKinds: string[]; missingKinds: string[] };
  motionScore: { consistent: number; inconsistent: number; details: ScorecardDetail[] };
}

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const RGB_RE = /rgba?\([^)]+\)/g;
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

function cloneRegex(pattern: RegExp): RegExp {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  return new RegExp(pattern.source, flags);
}

function collectOccurrences(content: string, file: string): {
  colorOccurrences: ScorecardDetail[];
  fontFamilyOccurrences: ScorecardDetail[];
  fontSizeOccurrences: ScorecardDetail[];
  transitionOccurrences: ScorecardDetail[];
} {
  const lines = content.split(/\r?\n/);
  const colorOccurrences: ScorecardDetail[] = [];
  const fontFamilyOccurrences: ScorecardDetail[] = [];
  const fontSizeOccurrences: ScorecardDetail[] = [];
  const transitionOccurrences: ScorecardDetail[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNo = index + 1;

    for (const match of line.matchAll(cloneRegex(HEX_RE))) {
      colorOccurrences.push({ value: match[0], file, line: lineNo });
    }
    for (const match of line.matchAll(cloneRegex(RGB_RE))) {
      colorOccurrences.push({ value: match[0], file, line: lineNo });
    }
    for (const match of line.matchAll(cloneRegex(FONT_FAMILY_RE))) {
      fontFamilyOccurrences.push({ value: match[1].trim(), file, line: lineNo });
    }
    for (const match of line.matchAll(cloneRegex(FONT_SIZE_RE))) {
      fontSizeOccurrences.push({ value: match[1].trim(), file, line: lineNo });
    }
    for (const match of line.matchAll(cloneRegex(TRANSITION_RE))) {
      transitionOccurrences.push({ value: match[1].trim(), file, line: lineNo });
    }
  }

  return {
    colorOccurrences,
    fontFamilyOccurrences,
    fontSizeOccurrences,
    transitionOccurrences,
  };
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
  const merged: CodebaseTokens = {
    colors: [],
    fontFamilies: [],
    fontSizes: [],
    transitions: [],
    colorOccurrences: [],
    fontFamilyOccurrences: [],
    fontSizeOccurrences: [],
    transitionOccurrences: [],
    sourceText: '',
  };

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const tokens = scanCssContent(content);
    const occurrences = collectOccurrences(content, file);
    merged.colors.push(...tokens.colors);
    merged.fontFamilies.push(...tokens.fontFamilies);
    merged.fontSizes.push(...tokens.fontSizes);
    merged.transitions.push(...tokens.transitions);
    merged.colorOccurrences?.push(...occurrences.colorOccurrences);
    merged.fontFamilyOccurrences?.push(...occurrences.fontFamilyOccurrences);
    merged.fontSizeOccurrences?.push(...occurrences.fontSizeOccurrences);
    merged.transitionOccurrences?.push(...occurrences.transitionOccurrences);
    merged.sourceText = `${merged.sourceText ?? ''}\n${content.toLowerCase()}`;
  }

  return { tokens: merged, filesScanned: files.length };
}

function parseRgbToHex(value: string): string | null {
  const match = value.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (!match) {
    return null;
  }

  const parts = match[1].split(',').map((part) => part.trim());
  const r = Number.parseFloat(parts[0] ?? '');
  const g = Number.parseFloat(parts[1] ?? '');
  const b = Number.parseFloat(parts[2] ?? '');
  if ([r, g, b].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  const toHex = (channel: number) =>
    Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function normalizeColor(value: string): string {
  const trimmed = value.trim();
  const rgbHex = parseRgbToHex(trimmed);
  if (rgbHex) {
    return rgbHex;
  }

  const hex = trimmed.toUpperCase();
  if (/^#[0-9A-F]{3}$/.test(hex)) {
    const [, r, g, b] = /^#([0-9A-F])([0-9A-F])([0-9A-F])$/.exec(hex) ?? [];
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return hex;
}

function parseDurationMs(value: string): number | null {
  const match = value.match(/(\d+(?:\.\d+)?)(ms|s)\b/i);
  if (!match) {
    return null;
  }
  const numeric = Number.parseFloat(match[1]);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return match[2].toLowerCase() === 's' ? Math.round(numeric * 1000) : Math.round(numeric);
}

function matchesKindInSource(kind: string, sourceText: string): boolean {
  const normalized = kind.toLowerCase();

  const aliases: Record<string, string[]> = {
    button: ['button', 'btn'],
    link: ['<a', 'href=', 'link'],
    navigation: ['<nav', 'navigation', 'navbar', 'menu'],
    card: ['card'],
    'form-control': ['form-control', '<input', '<select', '<textarea'],
    header: ['<header', 'header'],
    footer: ['<footer', 'footer'],
    hero: ['hero'],
  };

  const candidates = aliases[normalized] ?? [normalized];
  return candidates.some((candidate) => sourceText.includes(candidate));
}

function fallbackDetails(values: string[]): ScorecardDetail[] {
  return values.map((value) => ({ value, file: '', line: 0 }));
}

export function scoreAgainstProject(codebase: CodebaseTokens, project: ProjectRecord): Omit<ScorecardReport, 'filesScanned'> {
  // Color scoring
  const paletteColors = new Set(aggregateColors(project.inspirations).map((c) => normalizeColor(c.hex)));
  const colorEntries = codebase.colorOccurrences?.length
    ? codebase.colorOccurrences
    : fallbackDetails(codebase.colors);

  let onPalette = 0;
  let offPalette = 0;
  const colorDetails: ScorecardDetail[] = [];
  for (const color of colorEntries) {
    const normalized = normalizeColor(color.value);
    if (paletteColors.has(normalized)) {
      onPalette += 1;
    } else {
      offPalette += 1;
      colorDetails.push(color);
    }
  }

  // Typography scoring
  const systemFonts = new Set(
    aggregateTypography(project.inspirations).map((t) => t.fontFamily.split(',')[0].trim().replace(/['"]/g, '').toLowerCase())
  );
  const systemSizes = new Set(
    aggregateTypography(project.inspirations).map((t) => t.fontSize)
  );
  const familyEntries = codebase.fontFamilyOccurrences?.length
    ? codebase.fontFamilyOccurrences
    : fallbackDetails(codebase.fontFamilies);
  const sizeEntries = codebase.fontSizeOccurrences?.length
    ? codebase.fontSizeOccurrences
    : fallbackDetails(codebase.fontSizes);

  let onSystem = 0;
  let offSystem = 0;
  const typoDetails: ScorecardDetail[] = [];
  for (const family of familyEntries) {
    const first = family.value.split(',')[0].trim().replace(/['"]/g, '').toLowerCase();
    if (systemFonts.has(first)) {
      onSystem += 1;
    } else {
      offSystem += 1;
      typoDetails.push(family);
    }
  }
  for (const size of sizeEntries) {
    if (systemSizes.has(size.value.trim())) {
      onSystem += 1;
    } else {
      offSystem += 1;
      typoDetails.push(size);
    }
  }

  // Component scoring
  const capturedKinds = [...new Set(project.inspirations.flatMap((i) => i.analysis.components.map((c) => c.kind)))];
  const sourceText = (codebase.sourceText ?? '').toLowerCase();
  const coveredKinds = capturedKinds.filter((kind) => matchesKindInSource(kind, sourceText));
  const missingKinds = capturedKinds.filter((kind) => !coveredKinds.includes(kind));

  // Motion scoring
  const capturedDurations = new Set<number>();
  for (const m of aggregateMotion(project.inspirations)) {
    for (const t of m.transitions ?? []) {
      const ms = parseDurationMs(t.duration);
      if (ms !== null) {
        capturedDurations.add(ms);
      }
    }
  }
  const transitionEntries = codebase.transitionOccurrences?.length
    ? codebase.transitionOccurrences
    : fallbackDetails(codebase.transitions);

  let consistent = 0;
  let inconsistent = 0;
  const motionDetails: ScorecardDetail[] = [];
  for (const transition of transitionEntries) {
    const durationMs = parseDurationMs(transition.value);
    if (durationMs === null) {
      continue;
    }
    if (capturedDurations.has(durationMs)) {
      consistent += 1;
    } else {
      inconsistent += 1;
      motionDetails.push(transition);
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
      const location = d.file ? ` (${d.file}${d.line > 0 ? `:${d.line}` : ''})` : '';
      lines.push(`- \`${d.value}\`${location}`);
    }
    lines.push('');
  }

  if (report.typographyScore.details.length > 0) {
    lines.push('## Off-System Typography\n');
    for (const d of report.typographyScore.details) {
      const location = d.file ? ` (${d.file}${d.line > 0 ? `:${d.line}` : ''})` : '';
      lines.push(`- \`${d.value}\`${location}`);
    }
    lines.push('');
  }

  if (report.motionScore.details.length > 0) {
    lines.push('## Inconsistent Motion\n');
    for (const d of report.motionScore.details) {
      const location = d.file ? ` (${d.file}${d.line > 0 ? `:${d.line}` : ''})` : '';
      lines.push(`- \`${d.value}\`${location}`);
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
