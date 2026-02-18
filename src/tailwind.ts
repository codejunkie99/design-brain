import type { ProjectRecord, ColorToken, TypographyToken } from './types.js';

const COLOR_KEY_PATTERNS = /color|bg|border|text|fill|stroke|accent|brand|surface/i;
const COLOR_VALUE_RE = /^#[0-9a-f]{3,8}$/i;
const RGB_VALUE_RE = /^rgb/i;

function isColorValue(value: string): boolean {
  const trimmed = value.trim();
  return COLOR_VALUE_RE.test(trimmed) || RGB_VALUE_RE.test(trimmed);
}

function deriveColorKey(varName: string): string {
  // Strip leading -- and common prefixes
  let key = varName.replace(/^--/, '');

  // Remove common vendor/system prefixes (hds-, brand-, etc. keep the semantic part)
  // e.g. --hds-color-accent-default-icon-solid → accent-default-icon-solid
  //      --brand-bg-primary → bg-primary
  key = key
    .replace(/^hds-canary-color-/, '')
    .replace(/^hds-color-/, '')
    .replace(/^hds-canary-/, '')
    .replace(/^hds-/, '')
    .replace(/^brand-/, '')
    .replace(/^theme-/, '');

  // Collapse repeated segments and trim
  key = key.replace(/-+/g, '-').replace(/^-|-$/g, '');

  return key || varName.replace(/^--/, '');
}

function sanitizeFontKey(family: string): string {
  // Extract first font name: "sohne", sans-serif → sohne
  const first = family.split(',')[0].trim().replace(/['"]/g, '');
  return first.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseFontSize(size: string): string | undefined {
  const match = size.match(/^(\d+(?:\.\d+)?)\s*px$/i);
  return match ? match[1] : undefined;
}

export function generateTailwindConfig(project: ProjectRecord): string {
  const colorMap = new Map<string, { key: string; hex: string }>();
  const fontFamilies = new Map<string, string[]>();
  const fontSizes = new Map<string, string>();

  // 1. Extract colors from cssVariables across all inspirations
  for (const inspo of project.inspirations) {
    for (const [varName, value] of Object.entries(inspo.analysis.cssVariables)) {
      if (!COLOR_KEY_PATTERNS.test(varName)) continue;
      if (!isColorValue(value)) continue;

      const hex = value.trim();
      const upperHex = hex.toUpperCase();
      if (colorMap.has(upperHex)) continue;

      const key = deriveColorKey(varName);
      colorMap.set(upperHex, { key, hex });
    }
  }

  // 2. Merge ColorToken[] hex values not already covered
  const allColors: ColorToken[] = [];
  for (const inspo of project.inspirations) {
    for (const color of inspo.analysis.colors) {
      allColors.push(color);
    }
  }
  // Deduplicate and sort by count
  const colorsByHex = new Map<string, number>();
  for (const c of allColors) {
    colorsByHex.set(c.hex.toUpperCase(), (colorsByHex.get(c.hex.toUpperCase()) ?? 0) + c.count);
  }
  const sortedColors = [...colorsByHex.entries()].sort((a, b) => b[1] - a[1]);

  let colorIndex = 1;
  for (const [upperHex] of sortedColors) {
    if (colorMap.has(upperHex)) continue;
    colorMap.set(upperHex, { key: `color-${colorIndex}`, hex: upperHex });
    colorIndex++;
  }

  // 3. Extract typography
  for (const inspo of project.inspirations) {
    for (const token of inspo.analysis.typography) {
      const familyKey = sanitizeFontKey(token.fontFamily);
      if (familyKey && !fontFamilies.has(familyKey)) {
        const stack = token.fontFamily.split(',').map((f) => f.trim());
        fontFamilies.set(familyKey, stack);
      }

      const sizeKey = parseFontSize(token.fontSize);
      if (sizeKey && !fontSizes.has(sizeKey)) {
        fontSizes.set(sizeKey, token.fontSize);
      }
    }
  }

  // 4. Build config string
  const colorEntries = [...colorMap.values()]
    .map(({ key, hex }) => `        '${key}': '${hex}',`)
    .join('\n');

  const fontFamilyEntries = [...fontFamilies.entries()]
    .map(([key, stack]) => {
      const formatted = stack.map((f) => {
        const trimmed = f.trim();
        return trimmed.startsWith('"') || trimmed.startsWith("'") ? trimmed : `'${trimmed}'`;
      }).join(', ');
      return `        '${key}': [${formatted}],`;
    })
    .join('\n');

  const fontSizeEntries = [...fontSizes.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([key, value]) => `        '${key}': '${value}',`)
    .join('\n');

  return `/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
${colorEntries}
      },
      fontFamily: {
${fontFamilyEntries}
      },
      fontSize: {
${fontSizeEntries}
      },
    },
  },
};
`;
}
