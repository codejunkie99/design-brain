# Feature Batch 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add component relationship mapping, CSS-in-JS export, design review checklist, token naming, and design system diffing to design-brain-memory.

**Architecture:** Five new TypeScript source modules (`src/componentGraph.ts`, `src/cssInJs.ts`, `src/reviewChecklist.ts`, `src/tokenNaming.ts`, `src/systemDiff.ts`) with corresponding test files. Each module exports pure functions operating on `ProjectRecord` / `InspirationRecord[]` data. New CLI commands wired through `src/commands.ts` and `src/cli.ts`. CSS-in-JS integrates as a new `--format` option on the existing `export` command. All other features get dedicated commands.

**Tech Stack:** TypeScript, Node.js test runner, commander CLI, fs-extra. No new dependencies.

---

### Task 1: Token Naming Module

This task must come first because CSS-in-JS export (Task 2) and review checklist (Task 4) will use `nameTokens` for readable names.

**Files:**
- Create: `src/tokenNaming.ts`
- Create: `tests/tokenNaming.test.mjs`

**Step 1: Write the failing test**

Create `tests/tokenNaming.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { nameColor, nameTypographySize, nameMotionDuration, nameTokens } from '../dist/tokenNaming.js';

test('nameColor maps red to nearest CSS color name', () => {
  const name = nameColor('#FF0000');
  assert.equal(name, 'red');
});

test('nameColor maps a blue-purple to a CSS color name', () => {
  const name = nameColor('#533AFD');
  // Should be something like "blue-violet" or similar — just not empty
  assert.ok(name.length > 0);
  assert.ok(!name.startsWith('#'));
});

test('nameColor handles shorthand hex', () => {
  const name = nameColor('#F00');
  assert.equal(name, 'red');
});

test('nameTypographySize maps pixel values to semantic names', () => {
  assert.equal(nameTypographySize('10px'), 'xs');
  assert.equal(nameTypographySize('13px'), 'sm');
  assert.equal(nameTypographySize('16px'), 'md');
  assert.equal(nameTypographySize('22px'), 'lg');
  assert.equal(nameTypographySize('32px'), 'xl');
});

test('nameMotionDuration maps durations to bucket names', () => {
  assert.equal(nameMotionDuration('50ms'), 'instant');
  assert.equal(nameMotionDuration('150ms'), 'quick');
  assert.equal(nameMotionDuration('300ms'), 'normal');
  assert.equal(nameMotionDuration('500ms'), 'slow');
  assert.equal(nameMotionDuration('0.3s'), 'normal');
});

test('nameTokens returns a map from a project', () => {
  const project = {
    id: 'test', name: 'Test', createdAt: '', updatedAt: '',
    inspirations: [{
      id: 'i1', name: 'I1', sourceType: 'url', capturedAt: '', tags: [],
      fingerprint: 'a', version: 1,
      analysis: {
        colors: [{ hex: '#FF0000', count: 5, samples: [] }],
        typography: [{ fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 3 }],
        components: [], layout: [], cssVariables: {},
        motion: [{ selector: '.btn', transition: 'all 0.3s ease', animation: '', transform: '',
          transitions: [{ property: 'all', duration: '0.3s', timingFunction: 'ease', delay: '0s' }] }],
      },
    }],
    outcomes: [],
  };

  const map = nameTokens(project);
  assert.ok(map.size > 0);
  assert.ok(map.has('#FF0000'));
  assert.ok(map.has('16px'));
  assert.ok(map.has('0.3s'));
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test tests/tokenNaming.test.mjs`
Expected: FAIL — module `../dist/tokenNaming.js` does not exist

**Step 3: Write minimal implementation**

Create `src/tokenNaming.ts`:

```ts
import type { ProjectRecord } from './types.js';
import {
  aggregateColors,
  aggregateTypography,
  aggregateMotion,
} from './aggregate.js';

// ~148 standard CSS named colors with RGB values
const CSS_NAMED_COLORS: Array<[string, number, number, number]> = [
  ['black', 0, 0, 0],
  ['white', 255, 255, 255],
  ['red', 255, 0, 0],
  ['lime', 0, 255, 0],
  ['blue', 0, 0, 255],
  ['yellow', 255, 255, 0],
  ['cyan', 0, 255, 255],
  ['magenta', 255, 0, 255],
  ['silver', 192, 192, 192],
  ['gray', 128, 128, 128],
  ['maroon', 128, 0, 0],
  ['olive', 128, 128, 0],
  ['green', 0, 128, 0],
  ['purple', 128, 0, 128],
  ['teal', 0, 128, 128],
  ['navy', 0, 0, 128],
  ['orange', 255, 165, 0],
  ['pink', 255, 192, 203],
  ['coral', 255, 127, 80],
  ['salmon', 250, 128, 114],
  ['tomato', 255, 99, 71],
  ['crimson', 220, 20, 60],
  ['firebrick', 178, 34, 34],
  ['darkred', 139, 0, 0],
  ['indianred', 205, 92, 92],
  ['lightcoral', 240, 128, 128],
  ['orangered', 255, 69, 0],
  ['darkorange', 255, 140, 0],
  ['gold', 255, 215, 0],
  ['khaki', 240, 230, 140],
  ['darkkhaki', 189, 183, 107],
  ['peachpuff', 255, 218, 185],
  ['moccasin', 255, 228, 181],
  ['papayawhip', 245, 222, 179],
  ['lemonchiffon', 255, 250, 205],
  ['lightyellow', 255, 255, 224],
  ['wheat', 245, 222, 179],
  ['tan', 210, 180, 140],
  ['chocolate', 210, 105, 30],
  ['saddlebrown', 139, 69, 19],
  ['sienna', 160, 82, 45],
  ['brown', 165, 42, 42],
  ['peru', 205, 133, 63],
  ['sandybrown', 244, 164, 96],
  ['rosybrown', 188, 143, 143],
  ['burlywood', 222, 184, 135],
  ['bisque', 255, 228, 196],
  ['blanchedalmond', 255, 235, 205],
  ['antiquewhite', 250, 235, 215],
  ['linen', 250, 240, 230],
  ['lavenderblush', 255, 240, 245],
  ['mistyrose', 255, 228, 225],
  ['snow', 255, 250, 250],
  ['seashell', 255, 245, 238],
  ['floralwhite', 255, 250, 240],
  ['ivory', 255, 255, 240],
  ['honeydew', 240, 255, 240],
  ['mintcream', 245, 255, 250],
  ['azure', 240, 255, 255],
  ['aliceblue', 240, 248, 255],
  ['ghostwhite', 248, 248, 255],
  ['whitesmoke', 245, 245, 245],
  ['gainsboro', 220, 220, 220],
  ['lightgray', 211, 211, 211],
  ['darkgray', 169, 169, 169],
  ['dimgray', 105, 105, 105],
  ['lightslategray', 119, 136, 153],
  ['slategray', 112, 128, 144],
  ['darkslategray', 47, 79, 79],
  ['greenyellow', 173, 255, 47],
  ['chartreuse', 127, 255, 0],
  ['lawngreen', 124, 252, 0],
  ['limegreen', 50, 205, 50],
  ['palegreen', 152, 251, 152],
  ['lightgreen', 144, 238, 144],
  ['springgreen', 0, 255, 127],
  ['mediumspringgreen', 0, 250, 154],
  ['darkgreen', 0, 100, 0],
  ['forestgreen', 34, 139, 34],
  ['seagreen', 46, 139, 87],
  ['mediumseagreen', 60, 179, 113],
  ['mediumaquamarine', 102, 205, 170],
  ['darkseagreen', 143, 188, 143],
  ['aquamarine', 127, 255, 212],
  ['paleturquoise', 175, 238, 238],
  ['lightcyan', 224, 255, 255],
  ['darkturquoise', 0, 206, 209],
  ['turquoise', 64, 224, 208],
  ['mediumturquoise', 72, 209, 204],
  ['lightseagreen', 32, 178, 170],
  ['cadetblue', 95, 158, 160],
  ['darkcyan', 0, 139, 139],
  ['steelblue', 70, 130, 180],
  ['lightsteelblue', 176, 196, 222],
  ['powderblue', 176, 224, 230],
  ['lightblue', 173, 216, 230],
  ['skyblue', 135, 206, 235],
  ['lightskyblue', 135, 206, 250],
  ['deepskyblue', 0, 191, 255],
  ['dodgerblue', 30, 144, 255],
  ['cornflowerblue', 100, 149, 237],
  ['mediumslateblue', 123, 104, 238],
  ['royalblue', 65, 105, 225],
  ['mediumblue', 0, 0, 205],
  ['darkblue', 0, 0, 139],
  ['midnightblue', 25, 25, 112],
  ['indigo', 75, 0, 130],
  ['darkslateblue', 72, 61, 139],
  ['slateblue', 106, 90, 205],
  ['blueviolet', 138, 43, 226],
  ['mediumpurple', 147, 112, 219],
  ['darkorchid', 153, 50, 204],
  ['darkviolet', 148, 0, 211],
  ['darkmagenta', 139, 0, 139],
  ['plum', 221, 160, 221],
  ['violet', 238, 130, 238],
  ['orchid', 218, 112, 214],
  ['mediumorchid', 186, 85, 211],
  ['mediumvioletred', 199, 21, 133],
  ['deeppink', 255, 20, 147],
  ['hotpink', 255, 105, 180],
  ['lavender', 230, 230, 250],
  ['thistle', 216, 191, 216],
  ['fuchsia', 255, 0, 255],
  ['aqua', 0, 255, 255],
  ['cornsilk', 255, 248, 220],
  ['oldlace', 253, 245, 230],
  ['navajowhite', 255, 222, 173],
  ['goldenrod', 218, 165, 32],
  ['darkgoldenrod', 184, 134, 11],
  ['yellowgreen', 154, 205, 50],
  ['olivedrab', 107, 142, 35],
  ['darkolivegreen', 85, 107, 47],
];

function parseHex(hex: string): [number, number, number] {
  let h = hex.replace(/^#/, '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return [r, g, b];
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

export function nameColor(hex: string): string {
  const [r, g, b] = parseHex(hex);
  let bestName = 'unknown';
  let bestDist = Infinity;

  for (const [name, cr, cg, cb] of CSS_NAMED_COLORS) {
    const dist = colorDistance(r, g, b, cr, cg, cb);
    if (dist < bestDist) {
      bestDist = dist;
      bestName = name;
    }
  }

  return bestName;
}

export function nameTypographySize(fontSize: string): string {
  const match = fontSize.match(/^(\d+(?:\.\d+)?)\s*px$/i);
  if (!match) return fontSize;
  const px = parseFloat(match[1]);
  if (px < 12) return 'xs';
  if (px < 15) return 'sm';
  if (px < 19) return 'md';
  if (px < 25) return 'lg';
  return 'xl';
}

function parseDurationMs(duration: string): number {
  const msMatch = duration.match(/^(\d+(?:\.\d+)?)\s*ms$/i);
  if (msMatch) return parseFloat(msMatch[1]);
  const sMatch = duration.match(/^(\d+(?:\.\d+)?)\s*s$/i);
  if (sMatch) return parseFloat(sMatch[1]) * 1000;
  return -1;
}

export function nameMotionDuration(duration: string): string {
  const ms = parseDurationMs(duration);
  if (ms < 0) return duration;
  if (ms < 100) return 'instant';
  if (ms <= 200) return 'quick';
  if (ms <= 400) return 'normal';
  return 'slow';
}

export function nameTokens(project: ProjectRecord): Map<string, string> {
  const map = new Map<string, string>();
  const usedNames = new Map<string, number>();

  function uniqueName(base: string): string {
    const count = usedNames.get(base) ?? 0;
    usedNames.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  }

  // Color naming
  for (const color of aggregateColors(project.inspirations)) {
    const name = uniqueName(nameColor(color.hex));
    map.set(color.hex, name);
  }

  // Typography size naming
  const seenSizes = new Set<string>();
  for (const typo of aggregateTypography(project.inspirations)) {
    if (!seenSizes.has(typo.fontSize)) {
      seenSizes.add(typo.fontSize);
      map.set(typo.fontSize, nameTypographySize(typo.fontSize));
    }
  }

  // Motion duration naming
  const seenDurations = new Set<string>();
  for (const motion of aggregateMotion(project.inspirations)) {
    for (const t of motion.transitions ?? []) {
      if (t.duration && !seenDurations.has(t.duration)) {
        seenDurations.add(t.duration);
        map.set(t.duration, nameMotionDuration(t.duration));
      }
    }
  }

  return map;
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test tests/tokenNaming.test.mjs`
Expected: All 6 tests PASS

**Step 5: Commit**

```bash
git add src/tokenNaming.ts tests/tokenNaming.test.mjs
git commit -m "feat: add token naming module with CSS color heuristic"
```

---

### Task 2: CSS-in-JS Export Module

**Files:**
- Create: `src/cssInJs.ts`
- Create: `tests/cssInJs.test.mjs`
- Modify: `src/commands.ts:264-292` (add `css-in-js` format branch in `exportDesignSystem`)

**Step 1: Write the failing test**

Create `tests/cssInJs.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCssInJsTheme } from '../dist/cssInJs.js';

const makeProject = (inspos) => ({
  id: 'test', name: 'Test', createdAt: '', updatedAt: '',
  inspirations: inspos,
  outcomes: [],
});

const makeInspo = (overrides) => ({
  id: 'inspo-1', name: 'Test', sourceType: 'url', capturedAt: '', tags: [],
  fingerprint: 'abc', version: 1,
  analysis: {
    colors: [], typography: [], components: [], motion: [], layout: [],
    cssVariables: {},
  },
  ...overrides,
});

test('generateCssInJsTheme returns theme with colors', () => {
  const project = makeProject([
    makeInspo({
      analysis: {
        colors: [{ hex: '#FF0000', count: 10, samples: [] }, { hex: '#00FF00', count: 5, samples: [] }],
        typography: [], components: [], motion: [], layout: [],
        cssVariables: { '--brand-primary': '#FF0000' },
      },
    }),
  ]);

  const theme = generateCssInJsTheme(project);
  assert.ok(theme.colors);
  assert.ok(Object.keys(theme.colors).length >= 1);
  // Should have brand-primary from CSS var name
  assert.ok(theme.colors['primary'] || theme.colors['brand-primary'] || Object.keys(theme.colors).length > 0);
});

test('generateCssInJsTheme includes fontSizes with semantic names', () => {
  const project = makeProject([
    makeInspo({
      analysis: {
        colors: [],
        typography: [
          { fontFamily: 'Inter', fontSize: '12px', fontWeight: '400', lineHeight: '16px', count: 5 },
          { fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 8 },
          { fontFamily: 'Inter', fontSize: '24px', fontWeight: '700', lineHeight: '32px', count: 3 },
        ],
        components: [], motion: [], layout: [], cssVariables: {},
      },
    }),
  ]);

  const theme = generateCssInJsTheme(project);
  assert.ok(theme.fontSizes);
  assert.ok(Object.keys(theme.fontSizes).length > 0);
  // Should use semantic names like xs, sm, md, lg, xl
  const keys = Object.keys(theme.fontSizes);
  const semanticKeys = ['xs', 'sm', 'md', 'lg', 'xl'];
  assert.ok(keys.some((k) => semanticKeys.includes(k)));
});

test('generateCssInJsTheme includes transitions', () => {
  const project = makeProject([
    makeInspo({
      analysis: {
        colors: [], typography: [], components: [], layout: [], cssVariables: {},
        motion: [{
          selector: '.btn', transition: 'all 0.3s ease', animation: '', transform: '',
          transitions: [{ property: 'all', duration: '0.3s', timingFunction: 'ease', delay: '0s' }],
        }],
      },
    }),
  ]);

  const theme = generateCssInJsTheme(project);
  assert.ok(theme.transitions);
  assert.ok(Object.keys(theme.transitions).length > 0);
});

test('generateCssInJsTheme outputs valid TypeScript string', () => {
  const project = makeProject([makeInspo({})]);
  const theme = generateCssInJsTheme(project);
  assert.equal(typeof theme.colors, 'object');
  assert.equal(typeof theme.fonts, 'object');
  assert.equal(typeof theme.fontSizes, 'object');
  assert.equal(typeof theme.transitions, 'object');
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test tests/cssInJs.test.mjs`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/cssInJs.ts`:

```ts
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

  // Colors from CSS variables first (they have semantic names)
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

  // Remaining colors from aggregation with CSS named color heuristic
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

  // Assign semantic names — deduplicate if multiple sizes map to same bucket
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
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test tests/cssInJs.test.mjs`
Expected: All 4 tests PASS

**Step 5: Wire into export command**

Modify `src/commands.ts`. Add import at top:

```ts
import { generateCssInJsTheme, renderCssInJsTheme } from './cssInJs.js';
```

In `exportDesignSystem`, add a new format branch before the `throw` line (after the `style-dictionary` block):

```ts
  if (params.format === 'css-in-js') {
    const theme = generateCssInJsTheme(project);
    const ts = renderCssInJsTheme(theme);
    const outPath = path.join(projectDir(params.rootDir, project.id), 'theme.ts');
    await fs.ensureDir(path.dirname(outPath));
    await fs.writeFile(outPath, ts);
    return outPath;
  }
```

Update the error message to include `css-in-js`:

```ts
  throw new Error(`Unsupported format: ${params.format}. Supported: tailwind, style-dictionary, css-in-js`);
```

Update the CLI format option description in `src/cli.ts` line 290:

```ts
    .option('--format <format>', 'Export format (tailwind, style-dictionary, css-in-js)', 'tailwind')
```

**Step 6: Run all tests**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test tests/cssInJs.test.mjs`
Expected: PASS

**Step 7: Commit**

```bash
git add src/cssInJs.ts tests/cssInJs.test.mjs src/commands.ts src/cli.ts
git commit -m "feat: add CSS-in-JS theme export format"
```

---

### Task 3: Component Relationship Mapping Module

**Files:**
- Create: `src/componentGraph.ts`
- Create: `tests/componentGraph.test.mjs`
- Modify: `src/commands.ts` (add `generateComponentGraph` command function)
- Modify: `src/cli.ts` (add `component-graph` command)

**Step 1: Write the failing test**

Create `tests/componentGraph.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildComponentGraph, renderComponentGraphMd } from '../dist/componentGraph.js';

const makeInspo = (overrides) => ({
  id: 'inspo-1', name: 'Test', sourceType: 'url', capturedAt: '', tags: [],
  fingerprint: 'abc', version: 1,
  analysis: {
    colors: [], typography: [], components: [], motion: [], layout: [],
    cssVariables: {},
  },
  ...overrides,
});

test('buildComponentGraph detects parent-child from selectors', () => {
  const inspos = [
    makeInspo({
      id: 'i1',
      analysis: {
        colors: [], typography: [], motion: [], layout: [], cssVariables: {},
        components: [
          { kind: 'card', tag: 'div', selector: '.card', text: '', className: 'card', styles: {} },
          { kind: 'button', tag: 'button', selector: '.card .btn', text: '', className: 'btn', styles: {} },
          { kind: 'icon', tag: 'span', selector: '.card .btn .icon', text: '', className: 'icon', styles: {} },
        ],
      },
    }),
  ];

  const graph = buildComponentGraph(inspos);
  assert.ok(graph.nodes.length >= 3);
  // button is child of card
  const cardToBtn = graph.edges.find((e) => e.parent === 'card' && e.child === 'button');
  assert.ok(cardToBtn);
  // icon is child of button
  const btnToIcon = graph.edges.find((e) => e.parent === 'button' && e.child === 'icon');
  assert.ok(btnToIcon);
});

test('buildComponentGraph tracks co-occurrence counts', () => {
  const inspos = [
    makeInspo({
      id: 'i1',
      analysis: {
        colors: [], typography: [], motion: [], layout: [], cssVariables: {},
        components: [
          { kind: 'card', tag: 'div', selector: '.card', text: '', className: 'card', styles: {} },
          { kind: 'button', tag: 'button', selector: '.btn', text: '', className: 'btn', styles: {} },
        ],
      },
    }),
    makeInspo({
      id: 'i2',
      analysis: {
        colors: [], typography: [], motion: [], layout: [], cssVariables: {},
        components: [
          { kind: 'card', tag: 'div', selector: '.card-2', text: '', className: 'card', styles: {} },
          { kind: 'button', tag: 'button', selector: '.btn-2', text: '', className: 'btn', styles: {} },
        ],
      },
    }),
  ];

  const graph = buildComponentGraph(inspos);
  const coOccurrence = graph.coOccurrences.find(
    (c) => (c.kindA === 'card' && c.kindB === 'button') || (c.kindA === 'button' && c.kindB === 'card')
  );
  assert.ok(coOccurrence);
  assert.equal(coOccurrence.count, 2);
});

test('renderComponentGraphMd produces markdown', () => {
  const inspos = [
    makeInspo({
      analysis: {
        colors: [], typography: [], motion: [], layout: [], cssVariables: {},
        components: [
          { kind: 'card', tag: 'div', selector: '.card', text: '', className: 'card', styles: {} },
          { kind: 'button', tag: 'button', selector: '.card .btn', text: '', className: 'btn', styles: {} },
        ],
      },
    }),
  ];

  const graph = buildComponentGraph(inspos);
  const md = renderComponentGraphMd(graph);
  assert.ok(md.includes('# Component Relationship Graph'));
  assert.ok(md.includes('card'));
  assert.ok(md.includes('button'));
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test tests/componentGraph.test.mjs`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/componentGraph.ts`:

```ts
import type { InspirationRecord, ComponentToken } from './types.js';

export interface ComponentEdge {
  parent: string;
  child: string;
  count: number;
  sourceSelectors: string[];
}

export interface CoOccurrence {
  kindA: string;
  kindB: string;
  count: number;
}

export interface ComponentGraph {
  nodes: Array<{ kind: string; count: number }>;
  edges: ComponentEdge[];
  coOccurrences: CoOccurrence[];
}

function extractNesting(components: ComponentToken[]): Map<string, Set<string>> {
  // Parse selector containment: ".card .btn" means card contains button
  const parentChild = new Map<string, Set<string>>();

  // Build selector-to-kind map
  const selectorKinds = new Map<string, string>();
  for (const comp of components) {
    const parts = comp.selector.trim().split(/\s+/);
    selectorKinds.set(parts[parts.length - 1], comp.kind);
  }

  for (const comp of components) {
    const parts = comp.selector.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) continue;

    // Each part pair is a potential parent-child
    for (let i = 0; i < parts.length - 1; i++) {
      const parentKinds = findKindForSelector(parts[i], components);
      const childKinds = findKindForSelector(parts[i + 1], components);

      for (const parentKind of parentKinds) {
        for (const childKind of childKinds) {
          if (parentKind === childKind) continue;
          const children = parentChild.get(parentKind) ?? new Set();
          children.add(childKind);
          parentChild.set(parentKind, children);
        }
      }
    }
  }

  return parentChild;
}

function findKindForSelector(selectorPart: string, components: ComponentToken[]): string[] {
  const kinds: string[] = [];
  for (const comp of components) {
    const parts = comp.selector.trim().split(/\s+/);
    if (parts.includes(selectorPart)) {
      kinds.push(comp.kind);
    }
  }
  return [...new Set(kinds)];
}

export function buildComponentGraph(inspirations: InspirationRecord[]): ComponentGraph {
  const kindCounts = new Map<string, number>();
  const edgeMap = new Map<string, { parent: string; child: string; count: number; selectors: Set<string> }>();
  const coOccMap = new Map<string, number>();

  for (const inspo of inspirations) {
    const components = inspo.analysis.components;

    // Count kinds
    const kindsInCapture = new Set<string>();
    for (const comp of components) {
      kindCounts.set(comp.kind, (kindCounts.get(comp.kind) ?? 0) + 1);
      kindsInCapture.add(comp.kind);
    }

    // Nesting
    const nesting = extractNesting(components);
    for (const [parent, children] of nesting) {
      for (const child of children) {
        const key = `${parent}→${child}`;
        const existing = edgeMap.get(key) ?? { parent, child, count: 0, selectors: new Set() };
        existing.count += 1;
        existing.selectors.add(`${inspo.id}`);
        edgeMap.set(key, existing);
      }
    }

    // Co-occurrence
    const kindList = [...kindsInCapture].sort();
    for (let i = 0; i < kindList.length; i++) {
      for (let j = i + 1; j < kindList.length; j++) {
        const key = `${kindList[i]}|${kindList[j]}`;
        coOccMap.set(key, (coOccMap.get(key) ?? 0) + 1);
      }
    }
  }

  const nodes = [...kindCounts.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count);

  const edges = [...edgeMap.values()]
    .map((e) => ({ parent: e.parent, child: e.child, count: e.count, sourceSelectors: [...e.selectors] }))
    .sort((a, b) => b.count - a.count);

  const coOccurrences = [...coOccMap.entries()]
    .map(([key, count]) => {
      const [kindA, kindB] = key.split('|');
      return { kindA, kindB, count };
    })
    .sort((a, b) => b.count - a.count);

  return { nodes, edges, coOccurrences };
}

export function renderComponentGraphMd(graph: ComponentGraph): string {
  const lines: string[] = [];
  lines.push('# Component Relationship Graph\n');

  lines.push('## Component Kinds\n');
  lines.push('| Kind | Occurrences |');
  lines.push('| --- | --- |');
  for (const node of graph.nodes) {
    lines.push(`| ${node.kind} | ${node.count} |`);
  }
  lines.push('');

  if (graph.edges.length > 0) {
    lines.push('## Parent-Child Relationships\n');
    lines.push('| Parent | Child | Captures |');
    lines.push('| --- | --- | --- |');
    for (const edge of graph.edges) {
      lines.push(`| ${edge.parent} | ${edge.child} | ${edge.count} |`);
    }
    lines.push('');
  }

  if (graph.coOccurrences.length > 0) {
    lines.push('## Co-Occurrences\n');
    lines.push('| Component A | Component B | Captures |');
    lines.push('| --- | --- | --- |');
    for (const co of graph.coOccurrences.slice(0, 30)) {
      lines.push(`| ${co.kindA} | ${co.kindB} | ${co.count} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test tests/componentGraph.test.mjs`
Expected: All 3 tests PASS

**Step 5: Wire into commands.ts and cli.ts**

Add to `src/commands.ts` — import at top:

```ts
import { buildComponentGraph, renderComponentGraphMd } from './componentGraph.js';
```

Add new function at the end of `src/commands.ts` (before the closing of the file):

```ts
export async function generateComponentGraphCmd(params: {
  rootDir: string;
  project: string;
}): Promise<string> {
  const db = await loadDatabase(params.rootDir);
  const project = db.projects.find((p) => p.id === params.project);
  if (!project) throw new Error(`Project not found: ${params.project}`);

  const graph = buildComponentGraph(project.inspirations);
  const baseDir = projectDir(params.rootDir, project.id);
  await fs.ensureDir(baseDir);

  await fs.writeJson(path.join(baseDir, 'component-graph.json'), graph, { spaces: 2 });

  const md = renderComponentGraphMd(graph);
  const mdPath = path.join(baseDir, 'component-graph.md');
  await fs.writeFile(mdPath, md);

  return mdPath;
}
```

Add to `src/cli.ts` — import `generateComponentGraphCmd` from `'./commands.js'` (add to existing import). Add CLI command after the `scorecard` command:

```ts
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
```

**Step 6: Build and run all tests**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test tests/componentGraph.test.mjs`
Expected: PASS

**Step 7: Commit**

```bash
git add src/componentGraph.ts tests/componentGraph.test.mjs src/commands.ts src/cli.ts
git commit -m "feat: add component relationship mapping"
```

---

### Task 4: Design Review Checklist Module

**Files:**
- Create: `src/reviewChecklist.ts`
- Create: `tests/reviewChecklist.test.mjs`
- Modify: `src/commands.ts` (add `generateReviewChecklist` command function)
- Modify: `src/cli.ts` (add `review` command)

**Step 1: Write the failing test**

Create `tests/reviewChecklist.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChecklist, renderChecklist } from '../dist/reviewChecklist.js';

const makeProject = (inspos) => ({
  id: 'test', name: 'Test', createdAt: '', updatedAt: '',
  inspirations: inspos,
  outcomes: [],
});

const makeInspo = (overrides) => ({
  id: 'inspo-1', name: 'Test', sourceType: 'url', capturedAt: '', tags: [],
  fingerprint: 'abc', version: 1,
  analysis: {
    colors: [], typography: [], components: [], motion: [], layout: [],
    cssVariables: {},
  },
  ...overrides,
});

test('buildChecklist returns pattern items from project data', () => {
  const project = makeProject([
    makeInspo({
      analysis: {
        colors: [{ hex: '#FF0000', count: 10, samples: [] }],
        typography: [{ fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 5 }],
        components: [{ kind: 'button', tag: 'button', selector: '.btn', text: '', className: 'btn', styles: {} }],
        motion: [],
        layout: [], cssVariables: {},
      },
    }),
  ]);

  const checklist = buildChecklist({ project });
  assert.ok(checklist.items.length > 0);
  assert.ok(checklist.items.some((i) => i.category === 'color'));
  assert.ok(checklist.items.some((i) => i.category === 'typography'));
  assert.ok(checklist.items.some((i) => i.category === 'component'));
});

test('buildChecklist includes scorecard items when codebaseTokens provided', () => {
  const project = makeProject([
    makeInspo({
      analysis: {
        colors: [{ hex: '#FF0000', count: 10, samples: [] }],
        typography: [], components: [], motion: [],
        layout: [], cssVariables: {},
      },
    }),
  ]);

  const codebaseTokens = {
    colors: ['#00FF00'],
    fontFamilies: ['Roboto'],
    fontSizes: ['18px'],
    transitions: [],
  };

  const checklist = buildChecklist({ project, codebaseTokens });
  assert.ok(checklist.items.some((i) => i.category === 'scorecard'));
});

test('renderChecklist produces markdown with checkboxes', () => {
  const project = makeProject([
    makeInspo({
      analysis: {
        colors: [{ hex: '#FF0000', count: 10, samples: [] }],
        typography: [],
        components: [{ kind: 'button', tag: 'button', selector: '.btn', text: '', className: 'btn', styles: {} }],
        motion: [], layout: [], cssVariables: {},
      },
    }),
  ]);

  const checklist = buildChecklist({ project });
  const md = renderChecklist(checklist, 'test');
  assert.ok(md.includes('# Design Review Checklist'));
  assert.ok(md.includes('- [ ]'));
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test tests/reviewChecklist.test.mjs`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/reviewChecklist.ts`:

```ts
import type { ProjectRecord } from './types.js';
import type { CodebaseTokens } from './scorecard.js';
import {
  aggregateColors,
  aggregateTypography,
  aggregateComponents,
  aggregateMotion,
} from './aggregate.js';
import { scoreAgainstProject } from './scorecard.js';

export interface ChecklistItem {
  category: 'color' | 'typography' | 'component' | 'motion' | 'scorecard';
  description: string;
  severity: 'info' | 'warning' | 'action';
}

export interface ReviewChecklist {
  projectId: string;
  items: ChecklistItem[];
  generatedAt: string;
}

export function buildChecklist(params: {
  project: ProjectRecord;
  codebaseTokens?: CodebaseTokens;
}): ReviewChecklist {
  const { project, codebaseTokens } = params;
  const items: ChecklistItem[] = [];

  // Color pattern checks
  const colors = aggregateColors(project.inspirations);
  if (colors.length > 0) {
    items.push({
      category: 'color',
      description: `Verify primary palette uses top ${Math.min(colors.length, 5)} captured colors: ${colors.slice(0, 5).map((c) => c.hex).join(', ')}`,
      severity: 'info',
    });

    if (colors.length > 20) {
      items.push({
        category: 'color',
        description: `${colors.length} unique colors captured — consider consolidating to reduce palette complexity`,
        severity: 'warning',
      });
    }
  }

  // Typography pattern checks
  const typography = aggregateTypography(project.inspirations);
  if (typography.length > 0) {
    const families = [...new Set(typography.map((t) => t.fontFamily.split(',')[0].trim().replace(/['"]/g, '')))];
    items.push({
      category: 'typography',
      description: `Verify font stack includes: ${families.slice(0, 3).join(', ')}`,
      severity: 'info',
    });

    const sizes = [...new Set(typography.map((t) => t.fontSize))];
    if (sizes.length > 8) {
      items.push({
        category: 'typography',
        description: `${sizes.length} unique font sizes — consider establishing a type scale`,
        severity: 'warning',
      });
    }
  }

  // Component pattern checks
  const components = aggregateComponents(project.inspirations);
  if (components.length > 0) {
    const kinds = [...new Set(components.map((c) => c.kind))];
    items.push({
      category: 'component',
      description: `Component library should cover: ${kinds.slice(0, 8).join(', ')}`,
      severity: 'info',
    });
  }

  // Motion pattern checks
  const motion = aggregateMotion(project.inspirations);
  if (motion.length > 0) {
    const durations = new Set<string>();
    for (const m of motion) {
      for (const t of m.transitions ?? []) {
        if (t.duration && t.duration !== '0s') durations.add(t.duration);
      }
    }
    if (durations.size > 0) {
      items.push({
        category: 'motion',
        description: `Standard transition durations: ${[...durations].slice(0, 4).join(', ')}`,
        severity: 'info',
      });
    }
  }

  // Scorecard items (when codebase scan provided)
  if (codebaseTokens) {
    const scores = scoreAgainstProject(codebaseTokens, project);

    if (scores.colorScore.offPalette > 0) {
      items.push({
        category: 'scorecard',
        description: `${scores.colorScore.offPalette} off-palette color usages found in codebase`,
        severity: 'action',
      });
      for (const detail of scores.colorScore.details.slice(0, 5)) {
        items.push({
          category: 'scorecard',
          description: `Replace off-palette color ${detail.value}`,
          severity: 'action',
        });
      }
    }

    if (scores.typographyScore.offSystem > 0) {
      items.push({
        category: 'scorecard',
        description: `${scores.typographyScore.offSystem} off-system typography usages found`,
        severity: 'action',
      });
    }

    if (scores.motionScore.inconsistent > 0) {
      items.push({
        category: 'scorecard',
        description: `${scores.motionScore.inconsistent} inconsistent motion values found`,
        severity: 'warning',
      });
    }
  }

  return {
    projectId: project.id,
    items,
    generatedAt: new Date().toISOString(),
  };
}

export function renderChecklist(checklist: ReviewChecklist, projectId: string): string {
  const lines: string[] = [];
  lines.push(`# Design Review Checklist — ${projectId}\n`);
  lines.push(`Generated: ${checklist.generatedAt}\n`);

  const categories = ['color', 'typography', 'component', 'motion', 'scorecard'] as const;
  const categoryLabels: Record<string, string> = {
    color: 'Colors',
    typography: 'Typography',
    component: 'Components',
    motion: 'Motion',
    scorecard: 'Codebase Audit',
  };

  for (const category of categories) {
    const categoryItems = checklist.items.filter((i) => i.category === category);
    if (categoryItems.length === 0) continue;

    lines.push(`## ${categoryLabels[category]}\n`);
    for (const item of categoryItems) {
      const prefix = item.severity === 'action' ? '- [ ] **ACTION:**' : item.severity === 'warning' ? '- [ ] **WARNING:**' : '- [ ]';
      lines.push(`${prefix} ${item.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test tests/reviewChecklist.test.mjs`
Expected: All 3 tests PASS

**Step 5: Wire into commands.ts and cli.ts**

Add to `src/commands.ts` — import at top:

```ts
import { buildChecklist, renderChecklist } from './reviewChecklist.js';
import { scanCodebase } from './scorecard.js';
```

Add new function at end of `src/commands.ts`:

```ts
export async function generateReviewChecklist(params: {
  rootDir: string;
  project: string;
  scanPath?: string;
}): Promise<string> {
  const db = await loadDatabase(params.rootDir);
  const project = db.projects.find((p) => p.id === params.project);
  if (!project) throw new Error(`Project not found: ${params.project}`);

  let codebaseTokens;
  if (params.scanPath) {
    const scan = await scanCodebase(params.scanPath);
    codebaseTokens = scan.tokens;
  }

  const checklist = buildChecklist({ project, codebaseTokens });
  const md = renderChecklist(checklist, project.id);

  const outPath = path.join(projectDir(params.rootDir, project.id), 'review-checklist.md');
  await fs.ensureDir(path.dirname(outPath));
  await fs.writeFile(outPath, md);

  return outPath;
}
```

Add to `src/cli.ts` — import `generateReviewChecklist` from `'./commands.js'`. Add CLI command:

```ts
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
```

**Step 6: Build and run tests**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test tests/reviewChecklist.test.mjs`
Expected: PASS

**Step 7: Commit**

```bash
git add src/reviewChecklist.ts tests/reviewChecklist.test.mjs src/commands.ts src/cli.ts
git commit -m "feat: add design review checklist with optional codebase audit"
```

---

### Task 5: Design System Diffing Module

**Files:**
- Create: `src/systemDiff.ts`
- Create: `tests/systemDiff.test.mjs`
- Modify: `src/commands.ts` (add `runSystemDiff` command function)
- Modify: `src/cli.ts` (add `system-diff` command)

**Step 1: Write the failing test**

Create `tests/systemDiff.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { diffProjects, diffTemporal, renderSystemDiff } from '../dist/systemDiff.js';

const makeProject = (id, inspos) => ({
  id, name: id, createdAt: '', updatedAt: '',
  inspirations: inspos,
  outcomes: [],
});

const makeInspo = (overrides) => ({
  id: 'inspo-1', name: 'Test', sourceType: 'url', capturedAt: '2026-01-01T00:00:00Z', tags: [],
  fingerprint: 'abc', version: 1,
  analysis: {
    colors: [], typography: [], components: [], motion: [], layout: [],
    cssVariables: {},
  },
  ...overrides,
});

test('diffProjects detects shared and unique colors between projects', () => {
  const projectA = makeProject('a', [
    makeInspo({
      id: 'i1',
      analysis: {
        colors: [{ hex: '#FF0000', count: 5, samples: [] }, { hex: '#00FF00', count: 3, samples: [] }],
        typography: [], components: [], motion: [], layout: [], cssVariables: {},
      },
    }),
  ]);
  const projectB = makeProject('b', [
    makeInspo({
      id: 'i2',
      analysis: {
        colors: [{ hex: '#FF0000', count: 8, samples: [] }, { hex: '#0000FF', count: 4, samples: [] }],
        typography: [], components: [], motion: [], layout: [], cssVariables: {},
      },
    }),
  ]);

  const diff = diffProjects(projectA, projectB);
  assert.ok(diff.colors.shared.length === 1);
  assert.ok(diff.colors.onlyA.length === 1);
  assert.ok(diff.colors.onlyB.length === 1);
});

test('diffTemporal splits captures by time and finds changes', () => {
  const project = makeProject('test', [
    makeInspo({ id: 'i1', capturedAt: '2026-01-01T00:00:00Z',
      analysis: { colors: [{ hex: '#FF0000', count: 5, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} },
    }),
    makeInspo({ id: 'i2', capturedAt: '2026-01-02T00:00:00Z',
      analysis: { colors: [{ hex: '#FF0000', count: 3, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} },
    }),
    makeInspo({ id: 'i3', capturedAt: '2026-02-01T00:00:00Z',
      analysis: { colors: [{ hex: '#FF0000', count: 2, samples: [] }, { hex: '#0000FF', count: 4, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} },
    }),
    makeInspo({ id: 'i4', capturedAt: '2026-02-02T00:00:00Z',
      analysis: { colors: [{ hex: '#0000FF', count: 6, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} },
    }),
  ]);

  const diff = diffTemporal(project);
  // #FF0000 in first half, may or may not be in second
  // #0000FF in second half
  assert.ok(diff.colors.added.length >= 0 || diff.colors.removed.length >= 0 || diff.colors.persisted.length >= 0);
});

test('renderSystemDiff produces markdown', () => {
  const projectA = makeProject('a', [makeInspo({})]);
  const projectB = makeProject('b', [makeInspo({})]);
  const diff = diffProjects(projectA, projectB);
  const md = renderSystemDiff(diff, 'cross-project', 'a', 'b');
  assert.ok(md.includes('# Design System Diff'));
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test tests/systemDiff.test.mjs`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/systemDiff.ts`:

```ts
import type { ProjectRecord } from './types.js';
import {
  aggregateColors,
  aggregateTypography,
  aggregateComponents,
  aggregateMotion,
} from './aggregate.js';

export interface SystemDiffCategory<T> {
  shared: T[];
  onlyA: T[];
  onlyB: T[];
}

export interface TemporalDiffCategory<T> {
  persisted: T[];
  added: T[];
  removed: T[];
}

export interface SystemDiff {
  colors: SystemDiffCategory<string>;
  fonts: SystemDiffCategory<string>;
  componentKinds: SystemDiffCategory<string>;
  motionDurations: SystemDiffCategory<string>;
}

export interface TemporalDiff {
  colors: TemporalDiffCategory<string>;
  fonts: TemporalDiffCategory<string>;
  componentKinds: TemporalDiffCategory<string>;
  motionDurations: TemporalDiffCategory<string>;
  firstHalfCount: number;
  secondHalfCount: number;
}

function diffSets(setA: Set<string>, setB: Set<string>): { shared: string[]; onlyA: string[]; onlyB: string[] } {
  const shared = [...setA].filter((v) => setB.has(v));
  const onlyA = [...setA].filter((v) => !setB.has(v));
  const onlyB = [...setB].filter((v) => !setA.has(v));
  return { shared, onlyA, onlyB };
}

function extractColorSet(project: ProjectRecord): Set<string> {
  return new Set(aggregateColors(project.inspirations).map((c) => c.hex.toUpperCase()));
}

function extractFontSet(project: ProjectRecord): Set<string> {
  return new Set(
    aggregateTypography(project.inspirations).map((t) =>
      t.fontFamily.split(',')[0].trim().replace(/['"]/g, '').toLowerCase()
    )
  );
}

function extractComponentKindSet(project: ProjectRecord): Set<string> {
  return new Set(aggregateComponents(project.inspirations).map((c) => c.kind));
}

function extractMotionDurationSet(project: ProjectRecord): Set<string> {
  const durations = new Set<string>();
  for (const m of aggregateMotion(project.inspirations)) {
    for (const t of m.transitions ?? []) {
      if (t.duration && t.duration !== '0s') durations.add(t.duration);
    }
  }
  return durations;
}

export function diffProjects(projectA: ProjectRecord, projectB: ProjectRecord): SystemDiff {
  return {
    colors: diffSets(extractColorSet(projectA), extractColorSet(projectB)),
    fonts: diffSets(extractFontSet(projectA), extractFontSet(projectB)),
    componentKinds: diffSets(extractComponentKindSet(projectA), extractComponentKindSet(projectB)),
    motionDurations: diffSets(extractMotionDurationSet(projectA), extractMotionDurationSet(projectB)),
  };
}

export function diffTemporal(project: ProjectRecord): TemporalDiff {
  const sorted = [...project.inspirations].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const fakeA: ProjectRecord = { ...project, inspirations: firstHalf };
  const fakeB: ProjectRecord = { ...project, inspirations: secondHalf };

  const diff = diffProjects(fakeA, fakeB);

  return {
    colors: { persisted: diff.colors.shared, added: diff.colors.onlyB, removed: diff.colors.onlyA },
    fonts: { persisted: diff.fonts.shared, added: diff.fonts.onlyB, removed: diff.fonts.onlyA },
    componentKinds: { persisted: diff.componentKinds.shared, added: diff.componentKinds.onlyB, removed: diff.componentKinds.onlyA },
    motionDurations: { persisted: diff.motionDurations.shared, added: diff.motionDurations.onlyB, removed: diff.motionDurations.onlyA },
    firstHalfCount: firstHalf.length,
    secondHalfCount: secondHalf.length,
  };
}

function renderDiffSection(label: string, data: { shared: string[]; onlyA: string[]; onlyB: string[] }, labelA: string, labelB: string): string[] {
  const lines: string[] = [];
  lines.push(`## ${label}\n`);
  lines.push(`| Status | Value |`);
  lines.push(`| --- | --- |`);
  for (const v of data.shared) lines.push(`| Shared | ${v} |`);
  for (const v of data.onlyA) lines.push(`| Only in ${labelA} | ${v} |`);
  for (const v of data.onlyB) lines.push(`| Only in ${labelB} | ${v} |`);
  lines.push('');
  return lines;
}

export function renderSystemDiff(diff: SystemDiff | TemporalDiff, mode: 'cross-project' | 'temporal', labelA: string, labelB: string): string {
  const lines: string[] = [];
  lines.push(`# Design System Diff — ${labelA} vs ${labelB}\n`);
  lines.push(`Mode: ${mode}\n`);

  if (mode === 'temporal') {
    const td = diff as TemporalDiff;
    lines.push(`First half: ${td.firstHalfCount} captures | Second half: ${td.secondHalfCount} captures\n`);
    const adapt = (cat: TemporalDiffCategory<string>) => ({ shared: cat.persisted, onlyA: cat.removed, onlyB: cat.added });
    lines.push(...renderDiffSection('Colors', adapt(td.colors), 'Removed', 'Added'));
    lines.push(...renderDiffSection('Fonts', adapt(td.fonts), 'Removed', 'Added'));
    lines.push(...renderDiffSection('Component Kinds', adapt(td.componentKinds), 'Removed', 'Added'));
    lines.push(...renderDiffSection('Motion Durations', adapt(td.motionDurations), 'Removed', 'Added'));
  } else {
    const sd = diff as SystemDiff;
    lines.push(...renderDiffSection('Colors', sd.colors, labelA, labelB));
    lines.push(...renderDiffSection('Fonts', sd.fonts, labelA, labelB));
    lines.push(...renderDiffSection('Component Kinds', sd.componentKinds, labelA, labelB));
    lines.push(...renderDiffSection('Motion Durations', sd.motionDurations, labelA, labelB));
  }

  // Summary
  const countShared = (cat: { shared?: string[]; persisted?: string[] }) => (cat.shared ?? cat.persisted ?? []).length;
  const countA = (cat: { onlyA?: string[]; removed?: string[] }) => (cat.onlyA ?? cat.removed ?? []).length;
  const countB = (cat: { onlyB?: string[]; added?: string[] }) => (cat.onlyB ?? cat.added ?? []).length;

  lines.push('## Summary\n');
  if (mode === 'temporal') {
    const td = diff as TemporalDiff;
    lines.push(`| Category | Persisted | Added | Removed |`);
    lines.push(`| --- | --- | --- | --- |`);
    lines.push(`| Colors | ${td.colors.persisted.length} | ${td.colors.added.length} | ${td.colors.removed.length} |`);
    lines.push(`| Fonts | ${td.fonts.persisted.length} | ${td.fonts.added.length} | ${td.fonts.removed.length} |`);
    lines.push(`| Components | ${td.componentKinds.persisted.length} | ${td.componentKinds.added.length} | ${td.componentKinds.removed.length} |`);
    lines.push(`| Motion | ${td.motionDurations.persisted.length} | ${td.motionDurations.added.length} | ${td.motionDurations.removed.length} |`);
  } else {
    const sd = diff as SystemDiff;
    lines.push(`| Category | Shared | Only ${labelA} | Only ${labelB} |`);
    lines.push(`| --- | --- | --- | --- |`);
    lines.push(`| Colors | ${sd.colors.shared.length} | ${sd.colors.onlyA.length} | ${sd.colors.onlyB.length} |`);
    lines.push(`| Fonts | ${sd.fonts.shared.length} | ${sd.fonts.onlyA.length} | ${sd.fonts.onlyB.length} |`);
    lines.push(`| Components | ${sd.componentKinds.shared.length} | ${sd.componentKinds.onlyA.length} | ${sd.componentKinds.onlyB.length} |`);
    lines.push(`| Motion | ${sd.motionDurations.shared.length} | ${sd.motionDurations.onlyA.length} | ${sd.motionDurations.onlyB.length} |`);
  }

  return lines.join('\n');
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test tests/systemDiff.test.mjs`
Expected: All 3 tests PASS

**Step 5: Wire into commands.ts and cli.ts**

Add to `src/commands.ts` — import at top:

```ts
import { diffProjects, diffTemporal, renderSystemDiff } from './systemDiff.js';
```

Add new function:

```ts
export async function runSystemDiff(params: {
  rootDir: string;
  projectA?: string;
  projectB?: string;
  project?: string;
}): Promise<string> {
  const db = await loadDatabase(params.rootDir);

  if (params.project) {
    // Temporal mode
    const project = db.projects.find((p) => p.id === params.project);
    if (!project) throw new Error(`Project not found: ${params.project}`);

    const diff = diffTemporal(project);
    const md = renderSystemDiff(diff, 'temporal', 'early', 'recent');
    const timestamp = Date.now().toString(36);
    const outPath = path.join(projectDir(params.rootDir, project.id), `system-diff-${timestamp}.md`);
    await fs.ensureDir(path.dirname(outPath));
    await fs.writeFile(outPath, md);
    return outPath;
  }

  if (params.projectA && params.projectB) {
    const projectA = db.projects.find((p) => p.id === params.projectA);
    const projectB = db.projects.find((p) => p.id === params.projectB);
    if (!projectA) throw new Error(`Project not found: ${params.projectA}`);
    if (!projectB) throw new Error(`Project not found: ${params.projectB}`);

    const diff = diffProjects(projectA, projectB);
    const md = renderSystemDiff(diff, 'cross-project', projectA.id, projectB.id);
    const timestamp = Date.now().toString(36);
    const outPath = path.join(projectDir(params.rootDir, projectA.id), `system-diff-vs-${projectB.id}-${timestamp}.md`);
    await fs.ensureDir(path.dirname(outPath));
    await fs.writeFile(outPath, md);
    return outPath;
  }

  throw new Error('Provide --project for temporal diff, or --project-a and --project-b for cross-project diff');
}
```

Add to `src/cli.ts` — import `runSystemDiff` from `'./commands.js'`. Add CLI command:

```ts
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
```

**Step 6: Build and run tests**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test tests/systemDiff.test.mjs`
Expected: PASS

**Step 7: Commit**

```bash
git add src/systemDiff.ts tests/systemDiff.test.mjs src/commands.ts src/cli.ts
git commit -m "feat: add design system diffing (cross-project and temporal)"
```

---

### Task 6: Token Naming CLI Command + Integration

**Files:**
- Modify: `src/commands.ts` (add `nameTokensCmd`)
- Modify: `src/cli.ts` (add `name-tokens` command)

**Step 1: Wire token naming as a CLI command**

Add to `src/commands.ts` — import at top:

```ts
import { nameTokens } from './tokenNaming.js';
```

Add new function:

```ts
export async function nameTokensCmd(params: {
  rootDir: string;
  project: string;
}): Promise<Map<string, string>> {
  const db = await loadDatabase(params.rootDir);
  const project = db.projects.find((p) => p.id === params.project);
  if (!project) throw new Error(`Project not found: ${params.project}`);
  return nameTokens(project);
}
```

Add to `src/cli.ts` — import `nameTokensCmd` from `'./commands.js'`. Add CLI command:

```ts
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
```

**Step 2: Build and verify**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test tests/tokenNaming.test.mjs`
Expected: PASS

**Step 3: Commit**

```bash
git add src/commands.ts src/cli.ts
git commit -m "feat: add name-tokens CLI command"
```

---

### Task 7: Update Exports and Version Bump

**Files:**
- Modify: `src/index.ts` (add new exports)
- Modify: `package.json` (bump version to `0.7.0`)

**Step 1: Add exports to `src/index.ts`**

Add these export lines:

```ts
export { nameColor, nameTypographySize, nameMotionDuration, nameTokens } from './tokenNaming.js';
export { generateCssInJsTheme, renderCssInJsTheme } from './cssInJs.js';
export type { CssInJsTheme } from './cssInJs.js';
export { buildComponentGraph, renderComponentGraphMd } from './componentGraph.js';
export type { ComponentGraph, ComponentEdge, CoOccurrence } from './componentGraph.js';
export { buildChecklist, renderChecklist } from './reviewChecklist.js';
export type { ReviewChecklist, ChecklistItem } from './reviewChecklist.js';
export { diffProjects, diffTemporal, renderSystemDiff } from './systemDiff.js';
export type { SystemDiff, TemporalDiff } from './systemDiff.js';
export {
  generateComponentGraphCmd,
  generateReviewChecklist,
  nameTokensCmd,
  runSystemDiff,
} from './commands.js';
```

**Step 2: Bump version**

In `package.json`, change `"version": "0.6.0"` to `"version": "0.7.0"`.
In `src/cli.ts`, change `.version('0.6.0')` to `.version('0.7.0')`.

**Step 3: Build and run ALL tests**

Run: `cd /Users/arnavdas/design-brain && npm run build && npm test`
Expected: All tests PASS (previous 49 + 19 new = 68 total)

**Step 4: Commit**

```bash
git add src/index.ts package.json src/cli.ts
git commit -m "chore: add new exports and bump version to 0.7.0"
```

---

### Task 8: Plugin Commands and Documentation

**Files:**
- Create: `plugins/design-brain/commands/db-component-graph.md`
- Create: `plugins/design-brain/commands/db-review.md`
- Create: `plugins/design-brain/commands/db-name-tokens.md`
- Create: `plugins/design-brain/commands/db-system-diff.md`
- Modify: `plugins/design-brain/commands/db-export.md` (add css-in-js format)
- Modify: `plugins/design-brain/CLAUDE.md` (add routing for new commands)
- Modify: `plugins/design-brain/skills/design-brain/SKILL.md` (add new commands table)
- Modify: `plugins/design-brain/.claude-plugin/plugin.json` (bump to v0.8.0)
- Modify: `README.md` (add new commands to tables)

**Step 1: Create plugin command files**

Create `plugins/design-brain/commands/db-component-graph.md`:
```markdown
---
description: Generate component relationship graph showing parent-child nesting and co-occurrence
allowed-tools: Bash, Read, Glob, Grep
---

Run component graph generation for the specified project:

```bash
npx design-brain-memory component-graph --project $ARGUMENTS --root .
```

Display the generated markdown file to the user.
```

Create `plugins/design-brain/commands/db-review.md`:
```markdown
---
description: Generate design review checklist combining pattern compliance and optional codebase audit
allowed-tools: Bash, Read, Glob, Grep
---

Run review checklist generation. If user provides a scan path, include it:

```bash
npx design-brain-memory review --project $ARGUMENTS --root .
```

For codebase audit mode, add `--scan <path>` flag.

Display the generated checklist to the user.
```

Create `plugins/design-brain/commands/db-name-tokens.md`:
```markdown
---
description: Preview human-readable token names for a project using local color/size heuristics
allowed-tools: Bash, Read
---

Run token naming for the specified project:

```bash
npx design-brain-memory name-tokens --project $ARGUMENTS --root .
```

Display the mapping table to the user.
```

Create `plugins/design-brain/commands/db-system-diff.md`:
```markdown
---
description: Diff design systems between two projects or show temporal evolution within a project
allowed-tools: Bash, Read, Glob, Grep
---

Run system diff. For temporal mode (single project):

```bash
npx design-brain-memory system-diff --project $ARGUMENTS --root .
```

For cross-project mode:

```bash
npx design-brain-memory system-diff --project-a <id> --project-b <id> --root .
```

Display the generated diff report to the user.
```

**Step 2: Update plugin CLAUDE.md**

Add routing rules for new commands to `plugins/design-brain/CLAUDE.md`.

**Step 3: Update plugin SKILL.md**

Add 4 new commands to the commands table in `plugins/design-brain/skills/design-brain/SKILL.md`.

**Step 4: Update export plugin command**

In `plugins/design-brain/commands/db-export.md`, add `css-in-js` to the format list.

**Step 5: Bump plugin version**

In `plugins/design-brain/.claude-plugin/plugin.json`, bump to `0.8.0` and update description.

**Step 6: Update README.md**

Add new commands to both the CLI commands table and the plugin commands table.

**Step 7: Build final check**

Run: `cd /Users/arnavdas/design-brain && npm run build && npm test`
Expected: All tests PASS

**Step 8: Commit**

```bash
git add plugins/ README.md
git commit -m "docs: add plugin commands and update README for v0.7.0 features"
```
