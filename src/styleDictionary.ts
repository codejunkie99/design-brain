import type { ProjectRecord } from './types.js';

const COLOR_KEY_PATTERNS = /color|bg|border|text|fill|stroke|accent|brand|surface/i;
const COLOR_VALUE_RE = /^#[0-9a-f]{3,8}$/i;

interface StyleDictionaryToken {
  value: string;
  type: string;
  description?: string;
}

export interface StyleDictionaryOutput {
  color: Record<string, StyleDictionaryToken>;
  font: {
    family: Record<string, StyleDictionaryToken>;
    size: Record<string, StyleDictionaryToken>;
  };
  motion: Record<string, StyleDictionaryToken>;
}

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

export function generateStyleDictionary(project: ProjectRecord): StyleDictionaryOutput {
  const colors: Record<string, StyleDictionaryToken> = {};
  const fontFamilies: Record<string, StyleDictionaryToken> = {};
  const fontSizes: Record<string, StyleDictionaryToken> = {};
  const motion: Record<string, StyleDictionaryToken> = {};

  // Colors from CSS variables
  for (const inspo of project.inspirations) {
    for (const [varName, value] of Object.entries(inspo.analysis.cssVariables)) {
      if (!COLOR_KEY_PATTERNS.test(varName)) continue;
      if (!COLOR_VALUE_RE.test(value.trim())) continue;
      const key = deriveColorKey(varName);
      if (!colors[key]) {
        colors[key] = { value: value.trim(), type: 'color' };
      }
    }
  }

  // Colors from ColorToken[] not already covered
  for (const inspo of project.inspirations) {
    for (const color of inspo.analysis.colors) {
      const upper = color.hex.toUpperCase();
      const exists = Object.values(colors).some((t) => t.value.toUpperCase() === upper);
      if (!exists) {
        colors[`color-${Object.keys(colors).length + 1}`] = { value: color.hex, type: 'color' };
      }
    }
  }

  // Typography
  const seenFamilies = new Set<string>();
  const seenSizes = new Set<string>();
  for (const inspo of project.inspirations) {
    for (const token of inspo.analysis.typography) {
      const familyKey = sanitizeFontKey(token.fontFamily);
      if (familyKey && !seenFamilies.has(familyKey)) {
        seenFamilies.add(familyKey);
        fontFamilies[familyKey] = { value: token.fontFamily, type: 'fontFamily' };
      }
      const sizeMatch = token.fontSize.match(/^(\d+(?:\.\d+)?)\s*px$/i);
      if (sizeMatch && !seenSizes.has(sizeMatch[1])) {
        seenSizes.add(sizeMatch[1]);
        fontSizes[sizeMatch[1]] = { value: token.fontSize, type: 'fontSize' };
      }
    }
  }

  // Motion — unique durations and easing curves
  const seenDurations = new Set<string>();
  const seenEasing = new Set<string>();
  for (const inspo of project.inspirations) {
    for (const m of inspo.analysis.motion) {
      for (const t of m.transitions ?? []) {
        if (t.duration && t.duration !== '0s' && !seenDurations.has(t.duration)) {
          seenDurations.add(t.duration);
          const key = `transition-duration-${seenDurations.size}`;
          motion[key] = { value: t.duration, type: 'duration' };
        }
        if (t.timingFunction && t.timingFunction !== 'ease' && !seenEasing.has(t.timingFunction)) {
          seenEasing.add(t.timingFunction);
          const key = `transition-easing-${seenEasing.size}`;
          motion[key] = { value: t.timingFunction, type: 'cubicBezier' };
        }
      }
    }
  }

  return {
    color: colors,
    font: { family: fontFamilies, size: fontSizes },
    motion,
  };
}
