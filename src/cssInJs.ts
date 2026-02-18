import type { ProjectRecord } from './types.js';
import {
  aggregateColors,
  aggregateTypography,
  aggregateMotion,
} from './aggregate.js';
import { nameColor, nameTypographySize, nameMotionDuration } from './tokenNaming.js';

export interface CssInJsTheme {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  fontSizes: Record<string, string>;
  transitions: Record<string, string>;
}

const COLOR_KEY_PATTERNS = /color|bg|border|text|fill|stroke|accent|brand|surface/i;
const COLOR_VALUE_RE = /^#[0-9a-f]{3,8}$/i;

function deriveColorKey(varName: string): string {
  let key = varName.replace(/^--/, '');
  key = key
    .replace(/^hds-canary-color-/, '')
    .replace(/^hds-color-/, '')
    .replace(/^hds-canary-/, '')
    .replace(/^hds-/, '')
    .replace(/^brand-/, '')
    .replace(/^theme-/, '');
  key = key.replace(/-+/g, '-').replace(/^-|-$/g, '');
  return key || varName.replace(/^--/, '');
}

function sanitizeFontKey(family: string): string {
  const first = family.split(',')[0].trim().replace(/['"]/g, '');
  return first.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function generateCssInJsTheme(project: ProjectRecord): CssInJsTheme {
  const colors: Record<string, string> = {};
  const fonts: Record<string, string> = {};
  const fontSizes: Record<string, string> = {};
  const transitions: Record<string, string> = {};

  // Colors from CSS variables first
  for (const inspo of project.inspirations) {
    for (const [varName, value] of Object.entries(inspo.analysis.cssVariables)) {
      if (!COLOR_KEY_PATTERNS.test(varName)) continue;
      if (!COLOR_VALUE_RE.test(value.trim())) continue;
      const key = deriveColorKey(varName);
      if (!colors[key]) {
        colors[key] = value.trim();
      }
    }
  }

  // Remaining colors with CSS named color heuristic
  const usedNames = new Map<string, number>();
  for (const color of aggregateColors(project.inspirations)) {
    const upper = color.hex.toUpperCase();
    const alreadyCovered = Object.values(colors).some((v) => v.toUpperCase() === upper);
    if (alreadyCovered) continue;

    const baseName = nameColor(color.hex);
    const count = usedNames.get(baseName) ?? 0;
    usedNames.set(baseName, count + 1);
    const key = count === 0 ? baseName : `${baseName}-${count + 1}`;
    colors[key] = color.hex;
  }

  // Fonts
  const seenFamilies = new Set<string>();
  for (const typo of aggregateTypography(project.inspirations)) {
    const key = sanitizeFontKey(typo.fontFamily);
    if (key && !seenFamilies.has(key)) {
      seenFamilies.add(key);
      fonts[key] = typo.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
    }
  }

  // Font sizes with semantic names
  const seenSizes = new Set<string>();
  const sizeEntries: Array<{ px: number; value: string }> = [];
  for (const typo of aggregateTypography(project.inspirations)) {
    const match = typo.fontSize.match(/^(\d+(?:\.\d+)?)\s*px$/i);
    if (match && !seenSizes.has(match[1])) {
      seenSizes.add(match[1]);
      sizeEntries.push({ px: parseFloat(match[1]), value: typo.fontSize });
    }
  }
  sizeEntries.sort((a, b) => a.px - b.px);

  const usedSizeNames = new Map<string, number>();
  for (const entry of sizeEntries) {
    const baseName = nameTypographySize(entry.value);
    const count = usedSizeNames.get(baseName) ?? 0;
    usedSizeNames.set(baseName, count + 1);
    const key = count === 0 ? baseName : `${baseName}-${count + 1}`;
    fontSizes[key] = entry.value;
  }

  // Transitions
  const seenDurations = new Set<string>();
  for (const motion of aggregateMotion(project.inspirations)) {
    for (const t of motion.transitions ?? []) {
      if (t.duration && t.duration !== '0s' && !seenDurations.has(t.duration)) {
        seenDurations.add(t.duration);
        const name = nameMotionDuration(t.duration);
        const easing = t.timingFunction || 'ease';
        transitions[name] = `${t.duration} ${easing}`;
      }
    }
  }

  return { colors, fonts, fontSizes, transitions };
}

export function renderCssInJsTheme(theme: CssInJsTheme): string {
  const lines = [
    'export const theme = {',
    '  colors: {',
  ];
  for (const [key, value] of Object.entries(theme.colors)) {
    lines.push(`    '${key}': '${value}',`);
  }
  lines.push('  },');
  lines.push('  fonts: {');
  for (const [key, value] of Object.entries(theme.fonts)) {
    lines.push(`    ${key}: '${value}',`);
  }
  lines.push('  },');
  lines.push('  fontSizes: {');
  for (const [key, value] of Object.entries(theme.fontSizes)) {
    lines.push(`    ${key}: '${value}',`);
  }
  lines.push('  },');
  lines.push('  transitions: {');
  for (const [key, value] of Object.entries(theme.transitions)) {
    lines.push(`    ${key}: '${value}',`);
  }
  lines.push('  },');
  lines.push('} as const;');
  lines.push('');
  lines.push('export type Theme = typeof theme;');
  lines.push('');
  return lines.join('\n');
}
