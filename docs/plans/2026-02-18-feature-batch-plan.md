# Feature Batch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 6 features to design-brain-memory: Style Dictionary export, Compare command, Batch capture, Moodboard generator, Trend detection, and Design system scorecard.

**Architecture:** Each feature is a pure-function TypeScript module in `src/`, with CLI wiring in `src/cli.ts`, tests in `tests/`, and a matching plugin command in `plugins/design-brain/commands/`. Shared aggregation functions are extracted from `render.ts` into `src/aggregate.ts`.

**Tech Stack:** TypeScript, Node.js test runner, sharp (SVG→PNG), commander (CLI), fs-extra

---

### Task 1: Extract aggregate functions into shared module

**Files:**
- Create: `src/aggregate.ts`
- Modify: `src/render.ts:31-93` (remove 4 functions, import from aggregate)

**Step 1: Create `src/aggregate.ts`**

```typescript
import type {
  ColorToken,
  ComponentToken,
  InspirationRecord,
  MotionToken,
  TypographyToken,
} from './types.js';

export function aggregateColors(records: InspirationRecord[]): ColorToken[] {
  const map = new Map<string, ColorToken>();
  for (const record of records) {
    for (const color of record.analysis.colors) {
      const existing = map.get(color.hex) ?? { hex: color.hex, count: 0, samples: [] };
      existing.count += color.count;
      for (const sample of color.samples) {
        if (existing.samples.length < 6 && !existing.samples.includes(sample)) {
          existing.samples.push(sample);
        }
      }
      map.set(color.hex, existing);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 40);
}

export function aggregateTypography(records: InspirationRecord[]): TypographyToken[] {
  const map = new Map<string, TypographyToken>();
  for (const record of records) {
    for (const token of record.analysis.typography) {
      const key = `${token.fontFamily}|${token.fontSize}|${token.fontWeight}|${token.lineHeight}`;
      const existing = map.get(key) ?? { ...token, count: 0 };
      existing.count += token.count;
      map.set(key, existing);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 60);
}

export function aggregateComponents(records: InspirationRecord[]): Array<ComponentToken & { count: number }> {
  const map = new Map<string, ComponentToken & { count: number }>();
  for (const record of records) {
    for (const token of record.analysis.components) {
      const key = `${token.kind}|${token.tag}|${token.selector}`;
      const existing = map.get(key) ?? { ...token, count: 0 };
      existing.count += 1;
      map.set(key, existing);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 120);
}

export function aggregateMotion(records: InspirationRecord[]): Array<MotionToken & { count: number }> {
  const map = new Map<string, MotionToken & { count: number }>();
  for (const record of records) {
    for (const token of record.analysis.motion) {
      const key = `${token.selector}|${token.transition}|${token.animation}|${token.transform}`;
      const existing = map.get(key) ?? { ...token, count: 0 };
      existing.count += 1;
      map.set(key, existing);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 140);
}
```

**Step 2: Update `src/render.ts`**

Remove the 4 `function aggregate*` blocks (lines 31-93). Add import at top:

```typescript
import { aggregateColors, aggregateTypography, aggregateComponents, aggregateMotion } from './aggregate.js';
```

**Step 3: Build and verify**

Run: `cd /Users/arnavdas/design-brain && npm run build && node --test`
Expected: 29 tests pass (no behavior change)

**Step 4: Commit**

```bash
git add src/aggregate.ts src/render.ts
git commit -m "refactor: extract aggregate functions into shared module"
```

---

### Task 2: Style Dictionary export

**Files:**
- Create: `src/styleDictionary.ts`
- Create: `tests/styleDictionary.test.mjs`
- Modify: `src/commands.ts` (add to `exportDesignSystem`)
- Modify: `src/cli.ts:285` (update format option description)

**Step 1: Write the failing test**

Create `tests/styleDictionary.test.mjs`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateStyleDictionary } from '../dist/styleDictionary.js';

test('generateStyleDictionary extracts colors from cssVariables', () => {
  const project = {
    id: 'test', name: 'Test', createdAt: '', updatedAt: '',
    inspirations: [{
      id: 'inspo-1', name: 'Stripe', sourceType: 'url', capturedAt: '', tags: [],
      fingerprint: 'abc', version: 1,
      analysis: {
        colors: [{ hex: '#0055FF', count: 5, samples: [] }],
        typography: [{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 10 }],
        components: [], motion: [], layout: [],
        cssVariables: { '--brand-color-primary': '#0055FF', '--spacing-sm': '8px' },
      },
    }],
    outcomes: [],
  };

  const result = generateStyleDictionary(project);
  assert.ok(result.color);
  assert.ok(result.color['color-primary']);
  assert.equal(result.color['color-primary'].value, '#0055FF');
  assert.equal(result.color['color-primary'].type, 'color');
  assert.ok(result.font);
  assert.ok(result.font.family);
  assert.ok(result.font.size);
});

test('generateStyleDictionary extracts motion tokens', () => {
  const project = {
    id: 'test', name: 'Test', createdAt: '', updatedAt: '',
    inspirations: [{
      id: 'inspo-1', name: 'Test', sourceType: 'url', capturedAt: '', tags: [],
      fingerprint: 'abc', version: 1,
      analysis: {
        colors: [], typography: [], components: [], layout: [],
        motion: [{
          selector: '.btn', transition: 'all 0.3s ease', animation: 'none', transform: 'none',
          transitions: [{ property: 'all', duration: '0.3s', timingFunction: 'ease', delay: '0s' }],
        }],
        cssVariables: {},
      },
    }],
    outcomes: [],
  };

  const result = generateStyleDictionary(project);
  assert.ok(result.motion);
});

test('generateStyleDictionary handles empty project', () => {
  const project = {
    id: 'test', name: 'Test', createdAt: '', updatedAt: '',
    inspirations: [], outcomes: [],
  };

  const result = generateStyleDictionary(project);
  assert.deepEqual(result.color, {});
  assert.deepEqual(result.font, { family: {}, size: {} });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run build && node --test tests/styleDictionary.test.mjs`
Expected: FAIL — module not found

**Step 3: Write `src/styleDictionary.ts`**

```typescript
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
```

**Step 4: Update `src/commands.ts`**

Add to `exportDesignSystem` function — after the tailwind check:

```typescript
import { generateStyleDictionary } from './styleDictionary.js';

// Inside exportDesignSystem, replace the format check:
if (params.format === 'tailwind') {
  // existing tailwind logic
} else if (params.format === 'style-dictionary') {
  const tokens = generateStyleDictionary(project);
  const outPath = path.join(projectDir(params.rootDir, project.id), 'tokens.json');
  await fs.ensureDir(path.dirname(outPath));
  await fs.writeJson(outPath, tokens, { spaces: 2 });
  return outPath;
} else {
  throw new Error(`Unsupported format: ${params.format}. Supported: tailwind, style-dictionary`);
}
```

**Step 5: Update `src/cli.ts:285`**

Change format option description:
```typescript
.option('--format <format>', 'Export format (tailwind, style-dictionary)', 'tailwind')
```

**Step 6: Export from index**

Add to `src/index.ts`:
```typescript
export { generateStyleDictionary } from './styleDictionary.js';
```

**Step 7: Build and test**

Run: `npm run build && node --test`
Expected: All tests pass (29 old + 3 new = 32)

**Step 8: Commit**

```bash
git add src/styleDictionary.ts src/commands.ts src/cli.ts src/index.ts tests/styleDictionary.test.mjs
git commit -m "feat: add Style Dictionary export format"
```

---

### Task 3: Compare command

**Files:**
- Create: `src/compare.ts`
- Create: `tests/compare.test.mjs`
- Modify: `src/commands.ts` (add `compareInspirations` export)
- Modify: `src/cli.ts` (add `compare` command)
- Modify: `src/index.ts` (export)

**Step 1: Write the failing test**

Create `tests/compare.test.mjs`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { compareInspirations, renderComparison } from '../dist/compare.js';

const makeInspo = (overrides) => ({
  id: 'inspo-1', name: 'Test A', sourceType: 'url', capturedAt: '', tags: [],
  fingerprint: 'abc', version: 1,
  analysis: {
    colors: [], typography: [], components: [], motion: [], layout: [],
    cssVariables: {},
  },
  ...overrides,
});

test('compareInspirations detects added and removed colors', () => {
  const a = makeInspo({
    id: 'a', name: 'A',
    analysis: {
      colors: [{ hex: '#FF0000', count: 5, samples: [] }, { hex: '#00FF00', count: 3, samples: [] }],
      typography: [], components: [], motion: [], layout: [], cssVariables: {},
    },
  });
  const b = makeInspo({
    id: 'b', name: 'B',
    analysis: {
      colors: [{ hex: '#FF0000', count: 8, samples: [] }, { hex: '#0000FF', count: 4, samples: [] }],
      typography: [], components: [], motion: [], layout: [], cssVariables: {},
    },
  });

  const report = compareInspirations(a, b);
  assert.equal(report.colors.added.length, 1);
  assert.equal(report.colors.added[0].hex, '#0000FF');
  assert.equal(report.colors.removed.length, 1);
  assert.equal(report.colors.removed[0].hex, '#00FF00');
  assert.equal(report.colors.shared.length, 1);
});

test('compareInspirations detects typography changes', () => {
  const a = makeInspo({
    id: 'a', name: 'A',
    analysis: {
      colors: [], components: [], motion: [], layout: [], cssVariables: {},
      typography: [{ fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 5 }],
    },
  });
  const b = makeInspo({
    id: 'b', name: 'B',
    analysis: {
      colors: [], components: [], motion: [], layout: [], cssVariables: {},
      typography: [
        { fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 8 },
        { fontFamily: 'Roboto', fontSize: '14px', fontWeight: '500', lineHeight: '20px', count: 3 },
      ],
    },
  });

  const report = compareInspirations(a, b);
  assert.equal(report.typography.added.length, 1);
  assert.equal(report.typography.shared.length, 1);
});

test('renderComparison produces markdown', () => {
  const a = makeInspo({ id: 'a', name: 'A' });
  const b = makeInspo({ id: 'b', name: 'B' });
  const report = compareInspirations(a, b);
  const md = renderComparison(report);
  assert.ok(md.includes('# Compare:'));
  assert.ok(md.includes('## Summary'));
});
```

**Step 2: Run test to verify it fails**

Run: `npm run build && node --test tests/compare.test.mjs`
Expected: FAIL — module not found

**Step 3: Write `src/compare.ts`**

```typescript
import type {
  ColorToken,
  ComponentToken,
  InspirationRecord,
  MotionToken,
  TypographyToken,
} from './types.js';

export interface ComparisonReport {
  nameA: string;
  nameB: string;
  idA: string;
  idB: string;
  colors: {
    added: ColorToken[];
    removed: ColorToken[];
    shared: Array<{ hex: string; countA: number; countB: number }>;
  };
  typography: {
    added: TypographyToken[];
    removed: TypographyToken[];
    shared: TypographyToken[];
  };
  components: {
    addedKinds: string[];
    removedKinds: string[];
    sharedKinds: string[];
  };
  motion: {
    addedCount: number;
    removedCount: number;
    sharedCount: number;
  };
}

export function compareInspirations(a: InspirationRecord, b: InspirationRecord): ComparisonReport {
  // Colors
  const colorsA = new Map(a.analysis.colors.map((c) => [c.hex.toUpperCase(), c]));
  const colorsB = new Map(b.analysis.colors.map((c) => [c.hex.toUpperCase(), c]));
  const addedColors = [...colorsB.values()].filter((c) => !colorsA.has(c.hex.toUpperCase()));
  const removedColors = [...colorsA.values()].filter((c) => !colorsB.has(c.hex.toUpperCase()));
  const sharedColors = [...colorsA.entries()]
    .filter(([hex]) => colorsB.has(hex))
    .map(([hex, ca]) => ({ hex, countA: ca.count, countB: colorsB.get(hex)!.count }));

  // Typography
  const typoKey = (t: TypographyToken) => `${t.fontFamily}|${t.fontSize}|${t.fontWeight}`;
  const typoA = new Map(a.analysis.typography.map((t) => [typoKey(t), t]));
  const typoB = new Map(b.analysis.typography.map((t) => [typoKey(t), t]));
  const addedTypo = [...typoB.values()].filter((t) => !typoA.has(typoKey(t)));
  const removedTypo = [...typoA.values()].filter((t) => !typoB.has(typoKey(t)));
  const sharedTypo = [...typoA.values()].filter((t) => typoB.has(typoKey(t)));

  // Components
  const kindsA = new Set(a.analysis.components.map((c) => c.kind));
  const kindsB = new Set(b.analysis.components.map((c) => c.kind));
  const addedKinds = [...kindsB].filter((k) => !kindsA.has(k));
  const removedKinds = [...kindsA].filter((k) => !kindsB.has(k));
  const sharedKinds = [...kindsA].filter((k) => kindsB.has(k));

  // Motion
  const motionKeyFn = (m: MotionToken) => `${m.selector}|${m.transition}|${m.animation}`;
  const motionA = new Set(a.analysis.motion.map(motionKeyFn));
  const motionB = new Set(b.analysis.motion.map(motionKeyFn));
  const addedMotion = [...motionB].filter((k) => !motionA.has(k)).length;
  const removedMotion = [...motionA].filter((k) => !motionB.has(k)).length;
  const sharedMotion = [...motionA].filter((k) => motionB.has(k)).length;

  return {
    nameA: a.name, nameB: b.name,
    idA: a.id, idB: b.id,
    colors: { added: addedColors, removed: removedColors, shared: sharedColors },
    typography: { added: addedTypo, removed: removedTypo, shared: sharedTypo },
    components: { addedKinds, removedKinds, sharedKinds },
    motion: { addedCount: addedMotion, removedCount: removedMotion, sharedCount: sharedMotion },
  };
}

export function renderComparison(report: ComparisonReport): string {
  const lines: string[] = [];
  lines.push(`# Compare: ${report.nameA} vs ${report.nameB}\n`);

  // Colors
  lines.push('## Colors\n');
  lines.push('| Status | Hex | Detail |');
  lines.push('| --- | --- | --- |');
  for (const c of report.colors.added) lines.push(`| + Added | ${c.hex} | count: ${c.count} |`);
  for (const c of report.colors.removed) lines.push(`| - Removed | ${c.hex} | count: ${c.count} |`);
  for (const c of report.colors.shared) lines.push(`| = Shared | ${c.hex} | ${c.countA} → ${c.countB} |`);
  lines.push('');

  // Typography
  lines.push('## Typography\n');
  lines.push('| Status | Font | Size | Weight |');
  lines.push('| --- | --- | --- | --- |');
  for (const t of report.typography.added) lines.push(`| + Added | ${t.fontFamily} | ${t.fontSize} | ${t.fontWeight} |`);
  for (const t of report.typography.removed) lines.push(`| - Removed | ${t.fontFamily} | ${t.fontSize} | ${t.fontWeight} |`);
  for (const t of report.typography.shared) lines.push(`| = Shared | ${t.fontFamily} | ${t.fontSize} | ${t.fontWeight} |`);
  lines.push('');

  // Components
  lines.push('## Components\n');
  if (report.components.addedKinds.length > 0) lines.push(`Added: ${report.components.addedKinds.join(', ')}`);
  if (report.components.removedKinds.length > 0) lines.push(`Removed: ${report.components.removedKinds.join(', ')}`);
  lines.push(`Shared: ${report.components.sharedKinds.length} kinds`);
  lines.push('');

  // Motion
  lines.push('## Motion\n');
  lines.push(`Added: ${report.motion.addedCount} | Removed: ${report.motion.removedCount} | Shared: ${report.motion.sharedCount}`);
  lines.push('');

  // Summary
  const ca = report.colors.added.length, cr = report.colors.removed.length, cs = report.colors.shared.length;
  const ta = report.typography.added.length, tr = report.typography.removed.length, ts = report.typography.shared.length;
  lines.push('## Summary\n');
  lines.push(`Colors: +${ca} -${cr} =${cs} | Typography: +${ta} -${tr} =${ts} | Components: +${report.components.addedKinds.length} -${report.components.removedKinds.length} =${report.components.sharedKinds.length}`);

  return lines.join('\n');
}
```

**Step 4: Add CLI command and commands.ts export**

In `src/commands.ts`, add:

```typescript
import { compareInspirations, renderComparison } from './compare.js';

export async function compareCaptures(params: {
  rootDir: string;
  inspoA?: string;
  inspoB?: string;
  inspo?: string;
}): Promise<string> {
  const db = await loadDatabase(params.rootDir);

  let a: InspirationRecord | undefined;
  let b: InspirationRecord | undefined;
  let projectId = '';

  if (params.inspo) {
    // Version diff mode — find inspo and its predecessor
    for (const project of db.projects) {
      const found = project.inspirations.find((i) => i.id === params.inspo);
      if (found) {
        b = found;
        projectId = project.id;
        if (found.supersedes) {
          a = project.inspirations.find((i) => i.id === found.supersedes);
        }
        break;
      }
    }
    if (!b) throw new Error(`Inspiration not found: ${params.inspo}`);
    if (!a) throw new Error(`No previous version found for ${params.inspo}`);
  } else if (params.inspoA && params.inspoB) {
    // Cross-capture mode
    for (const project of db.projects) {
      const foundA = project.inspirations.find((i) => i.id === params.inspoA);
      const foundB = project.inspirations.find((i) => i.id === params.inspoB);
      if (foundA) { a = foundA; projectId = project.id; }
      if (foundB) { b = foundB; if (!projectId) projectId = project.id; }
    }
    if (!a) throw new Error(`Inspiration not found: ${params.inspoA}`);
    if (!b) throw new Error(`Inspiration not found: ${params.inspoB}`);
  } else {
    throw new Error('Provide --a and --b for cross-capture, or --inspo for version diff');
  }

  const report = compareInspirations(a, b);
  const md = renderComparison(report);

  const compDir = path.join(projectDir(params.rootDir, projectId), 'comparisons');
  await fs.ensureDir(compDir);
  const outPath = path.join(compDir, `${a.id}-vs-${b.id}.md`);
  await fs.writeFile(outPath, md);

  return outPath;
}
```

In `src/cli.ts`, add the compare command after the export command:

```typescript
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
```

**Step 5: Build and test**

Run: `npm run build && node --test`
Expected: All tests pass (32 + 3 = 35)

**Step 6: Commit**

```bash
git add src/compare.ts src/commands.ts src/cli.ts tests/compare.test.mjs
git commit -m "feat: add compare command for cross-capture and version diffs"
```

---

### Task 4: Batch capture

**Files:**
- Create: `src/batch.ts`
- Create: `tests/batch.test.mjs`
- Modify: `src/cli.ts` (add `batch` command)
- Modify: `src/index.ts` (export)

**Step 1: Write the failing test**

Create `tests/batch.test.mjs`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBatchFile } from '../dist/batch.js';

test('parseBatchFile parses tab-separated lines', () => {
  const input = 'https://stripe.com\tStripe\tpayments,fintech\nhttps://linear.app\tLinear\n';
  const entries = parseBatchFile(input);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].url, 'https://stripe.com');
  assert.equal(entries[0].name, 'Stripe');
  assert.deepEqual(entries[0].tags, ['payments', 'fintech']);
  assert.equal(entries[1].url, 'https://linear.app');
  assert.equal(entries[1].name, 'Linear');
  assert.deepEqual(entries[1].tags, []);
});

test('parseBatchFile skips empty lines and comments', () => {
  const input = '# Header comment\nhttps://stripe.com\tStripe\n\n# Another comment\nhttps://linear.app\n';
  const entries = parseBatchFile(input);
  assert.equal(entries.length, 2);
});

test('parseBatchFile handles URL-only lines', () => {
  const input = 'https://stripe.com\nhttps://linear.app\n';
  const entries = parseBatchFile(input);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].name, undefined);
  assert.deepEqual(entries[0].tags, []);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run build && node --test tests/batch.test.mjs`
Expected: FAIL — module not found

**Step 3: Write `src/batch.ts`**

```typescript
import fs from 'fs-extra';
import { ingestInspiration } from './commands.js';

export interface BatchEntry {
  url: string;
  name?: string;
  tags: string[];
}

export function parseBatchFile(content: string): BatchEntry[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      const parts = line.split('\t');
      const url = parts[0].trim();
      const name = parts[1]?.trim() || undefined;
      const tags = parts[2] ? parts[2].split(',').map((t) => t.trim()).filter(Boolean) : [];
      return { url, name, tags };
    });
}

export async function batchCapture(params: {
  rootDir: string;
  project: string;
  filePath: string;
  skipVisuals: boolean;
}): Promise<{ total: number; succeeded: number; failed: string[] }> {
  const content = await fs.readFile(params.filePath, 'utf-8');
  const entries = parseBatchFile(content);
  const failed: string[] = [];
  let succeeded = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const label = entry.name || entry.url;
    console.log(`[${i + 1}/${entries.length}] Capturing ${label}...`);

    try {
      await ingestInspiration({
        rootDir: params.rootDir,
        project: params.project,
        url: entry.url,
        name: entry.name,
        tags: entry.tags,
        skipVisuals: params.skipVisuals,
      });
      succeeded++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  Failed: ${msg}`);
      failed.push(entry.url);
    }
  }

  return { total: entries.length, succeeded, failed };
}
```

**Step 4: Add CLI command**

In `src/cli.ts`, add:

```typescript
import { batchCapture } from './batch.js';

// After the compare command:
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
```

**Step 5: Build and test**

Run: `npm run build && node --test`
Expected: All tests pass (35 + 3 = 38)

**Step 6: Commit**

```bash
git add src/batch.ts src/cli.ts tests/batch.test.mjs
git commit -m "feat: add batch capture from URL list file"
```

---

### Task 5: Moodboard generator

**Files:**
- Create: `src/moodboard.ts`
- Create: `tests/moodboard.test.mjs`
- Modify: `src/cli.ts` (add `moodboard` command)
- Modify: `src/commands.ts` (add `generateMoodboard` export)
- Modify: `src/index.ts` (export)

**Step 1: Write the failing test**

Create `tests/moodboard.test.mjs`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMoodboardHtml, generateMoodboardSvg } from '../dist/moodboard.js';

const makeProject = () => ({
  id: 'test', name: 'Test Project', createdAt: '', updatedAt: '',
  inspirations: [{
    id: 'inspo-1', name: 'Stripe', sourceType: 'url', capturedAt: '', tags: [],
    fingerprint: 'abc', version: 1,
    analysis: {
      colors: [
        { hex: '#533AFD', count: 100, samples: ['a:color'] },
        { hex: '#000000', count: 200, samples: ['div:color'] },
      ],
      typography: [{ fontFamily: 'sohne-var, sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 50 }],
      components: [
        { kind: 'button', tag: 'button', selector: '.btn', text: 'Click', className: 'btn', styles: {} },
        { kind: 'card', tag: 'div', selector: '.card', text: '', className: 'card', styles: {} },
      ],
      motion: [{
        selector: '.btn', transition: 'all 0.3s ease', animation: 'none', transform: 'none',
        transitions: [{ property: 'all', duration: '0.3s', timingFunction: 'ease', delay: '0s' }],
      }],
      layout: [], cssVariables: {},
    },
  }],
  outcomes: [],
});

test('generateMoodboardHtml produces valid HTML with sections', () => {
  const html = generateMoodboardHtml(makeProject());
  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('Test Project'));
  assert.ok(html.includes('#533AFD'));
  assert.ok(html.includes('sohne-var'));
  assert.ok(html.includes('button'));
});

test('generateMoodboardSvg produces valid SVG', () => {
  const svg = generateMoodboardSvg(makeProject());
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('Test Project'));
  assert.ok(svg.includes('#533AFD'));
});

test('generateMoodboardHtml handles empty project', () => {
  const project = { id: 'test', name: 'Empty', createdAt: '', updatedAt: '', inspirations: [], outcomes: [] };
  const html = generateMoodboardHtml(project);
  assert.ok(html.includes('Empty'));
  assert.ok(html.includes('No captures'));
});
```

**Step 2: Run test to verify it fails, then implement**

The implementation is large — `generateMoodboardHtml` builds a styled HTML page with CSS grid, `generateMoodboardSvg` builds a simpler SVG version for PNG conversion. Both use aggregate functions from `src/aggregate.ts`.

Key structure:
- `generateMoodboardHtml(project)` → full HTML with inline CSS, color swatches as `<div>` elements, typography rendered with `font-family`, component badges, motion stats
- `generateMoodboardSvg(project)` → SVG for sharp PNG conversion, similar layout to existing `svg.ts` patterns
- CLI command calls both, uses `sharp` to convert SVG→PNG

**Step 3: Add CLI command and commands export**

```typescript
// src/cli.ts
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
```

**Step 4: Build and test**

Run: `npm run build && node --test`
Expected: All tests pass (38 + 3 = 41)

**Step 5: Commit**

```bash
git add src/moodboard.ts src/aggregate.ts src/commands.ts src/cli.ts tests/moodboard.test.mjs
git commit -m "feat: add moodboard generator (HTML + PNG)"
```

---

### Task 6: Trend detection

**Files:**
- Create: `src/trends.ts`
- Create: `tests/trends.test.mjs`
- Modify: `src/commands.ts` (add `detectTrends` export)
- Modify: `src/cli.ts` (add `trends` command)
- Modify: `src/knowledge.ts` (add trends MOC generation)
- Modify: `src/types.ts` (add trend note type support)

**Step 1: Write the failing test**

Create `tests/trends.test.mjs`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { detectTrends } from '../dist/trends.js';

test('detectTrends finds colors appearing in 3+ captures', () => {
  const inspirations = [
    { id: 'a', name: 'A', capturedAt: '2026-01-01', analysis: { colors: [{ hex: '#FF0000', count: 5, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} } },
    { id: 'b', name: 'B', capturedAt: '2026-01-15', analysis: { colors: [{ hex: '#FF0000', count: 3, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} } },
    { id: 'c', name: 'C', capturedAt: '2026-02-01', analysis: { colors: [{ hex: '#FF0000', count: 8, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} } },
  ];

  const trends = detectTrends(inspirations);
  const colorTrend = trends.find((t) => t.domain === 'color');
  assert.ok(colorTrend);
  assert.equal(colorTrend.occurrences, 3);
  assert.equal(colorTrend.signal, 'rising');
});

test('detectTrends finds component kind trends', () => {
  const inspirations = [
    { id: 'a', name: 'A', capturedAt: '2026-01-01', analysis: { colors: [], typography: [], components: [{ kind: 'card', tag: 'div', selector: '.card', text: '', className: '', styles: {} }], motion: [], layout: [], cssVariables: {} } },
    { id: 'b', name: 'B', capturedAt: '2026-01-15', analysis: { colors: [], typography: [], components: [{ kind: 'card', tag: 'div', selector: '.card2', text: '', className: '', styles: {} }], motion: [], layout: [], cssVariables: {} } },
    { id: 'c', name: 'C', capturedAt: '2026-02-01', analysis: { colors: [], typography: [], components: [{ kind: 'card', tag: 'div', selector: '.card3', text: '', className: '', styles: {} }], motion: [], layout: [], cssVariables: {} } },
  ];

  const trends = detectTrends(inspirations);
  const componentTrend = trends.find((t) => t.domain === 'components');
  assert.ok(componentTrend);
  assert.ok(componentTrend.title.includes('card'));
});

test('detectTrends returns empty for insufficient data', () => {
  const inspirations = [
    { id: 'a', name: 'A', capturedAt: '2026-01-01', analysis: { colors: [{ hex: '#FF0000', count: 5, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} } },
  ];

  const trends = detectTrends(inspirations);
  assert.equal(trends.length, 0);
});
```

**Step 2: Implement `src/trends.ts`**

Core function `detectTrends(inspirations: InspirationRecord[]): TrendNote[]` that:
- Groups colors/fonts/component kinds/easing curves by value across captures
- Filters to items appearing in 3+ captures
- Determines signal: `rising` if frequency increases over time, `stable` if flat, `declining` if decreasing
- Returns structured trend notes

`writeTrendNotes(rootDir, trends)` writes markdown files to `notes/trends/`.

**Step 3: CLI command**

```typescript
program
  .command('trends')
  .description('Detect design trends across captures')
  .option('--project <project>', 'Filter to project')
  .option('--root <dir>', 'Workspace root', process.cwd())
  .action(...)
```

**Step 4: Build and test**

Run: `npm run build && node --test`
Expected: All tests pass (41 + 3 = 44)

**Step 5: Commit**

```bash
git add src/trends.ts src/commands.ts src/cli.ts src/knowledge.ts tests/trends.test.mjs
git commit -m "feat: add trend detection with auto-generated trend notes"
```

---

### Task 7: Design system scorecard

**Files:**
- Create: `src/scorecard.ts`
- Create: `tests/scorecard.test.mjs`
- Modify: `src/commands.ts` (add `runScorecard` export)
- Modify: `src/cli.ts` (add `scorecard` command)

**Step 1: Write the failing test**

Create `tests/scorecard.test.mjs`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { scanCssContent, renderScorecard } from '../dist/scorecard.js';

test('scanCssContent extracts hex colors', () => {
  const css = 'body { color: #333; background: #FF0000; border: 1px solid #533AFD; }';
  const result = scanCssContent(css);
  assert.ok(result.colors.includes('#333'));
  assert.ok(result.colors.includes('#FF0000'));
  assert.ok(result.colors.includes('#533AFD'));
});

test('scanCssContent extracts font families', () => {
  const css = 'body { font-family: Inter, sans-serif; } h1 { font-family: "Playfair Display", serif; }';
  const result = scanCssContent(css);
  assert.ok(result.fontFamilies.some((f) => f.includes('Inter')));
  assert.ok(result.fontFamilies.some((f) => f.includes('Playfair Display')));
});

test('scanCssContent extracts font sizes', () => {
  const css = 'body { font-size: 16px; } h1 { font-size: 32px; }';
  const result = scanCssContent(css);
  assert.ok(result.fontSizes.includes('16px'));
  assert.ok(result.fontSizes.includes('32px'));
});

test('scanCssContent extracts transition durations', () => {
  const css = '.btn { transition: all 0.3s ease; } .card { transition: opacity 200ms linear; }';
  const result = scanCssContent(css);
  assert.ok(result.transitions.length >= 2);
});

test('renderScorecard produces markdown with scores', () => {
  const report = {
    filesScanned: 5,
    colorScore: { onPalette: 8, offPalette: 2, details: [] },
    typographyScore: { onSystem: 3, offSystem: 1, details: [] },
    componentScore: { covered: 5, missing: 3, coveredKinds: [], missingKinds: [] },
    motionScore: { consistent: 4, inconsistent: 1, details: [] },
  };
  const md = renderScorecard(report, 'test-project');
  assert.ok(md.includes('# Design System Scorecard'));
  assert.ok(md.includes('80%'));  // 8/(8+2)
  assert.ok(md.includes('75%'));  // 3/(3+1)
});
```

**Step 2: Implement `src/scorecard.ts`**

Core functions:
- `scanCssContent(css: string): CodebaseTokens` — Regex extraction of colors, fonts, sizes, transitions from CSS content
- `scanCodebase(scanPath: string): Promise<CodebaseTokens>` — Recursively reads CSS/TSX/HTML files, calls `scanCssContent` per file
- `scoreAgainstProject(codebase: CodebaseTokens, project: ProjectRecord): ScorecardReport` — Compares codebase tokens against project's captured tokens
- `renderScorecard(report: ScorecardReport, projectId: string): string` — Markdown output

Regex patterns:
- Colors: `/#[0-9a-fA-F]{3,8}\b/g` and `/rgb\([^)]+\)/g`
- Font families: `/font-family:\s*([^;]+)/g`
- Font sizes: `/font-size:\s*([^;]+)/g`
- Transitions: `/transition[^:]*:\s*([^;]+)/g`

**Step 3: CLI command**

```typescript
program
  .command('scorecard')
  .description('Audit local codebase against captured design tokens')
  .requiredOption('--project <project>', 'Project ID/slug')
  .requiredOption('--scan <path>', 'Directory to scan')
  .option('--root <dir>', 'Workspace root', process.cwd())
  .action(...)
```

**Step 4: Build and test**

Run: `npm run build && node --test`
Expected: All tests pass (44 + 5 = 49)

**Step 5: Commit**

```bash
git add src/scorecard.ts src/commands.ts src/cli.ts tests/scorecard.test.mjs
git commit -m "feat: add design system scorecard — codebase audit against captured tokens"
```

---

### Task 8: Update plugin commands, exports, version, README

**Files:**
- Create: `plugins/design-brain/commands/db-compare.md`
- Create: `plugins/design-brain/commands/db-batch.md`
- Create: `plugins/design-brain/commands/db-moodboard.md`
- Create: `plugins/design-brain/commands/db-trends.md`
- Create: `plugins/design-brain/commands/db-scorecard.md`
- Modify: `src/index.ts` (add all exports)
- Modify: `package.json` (bump version to 0.6.0)
- Modify: `src/cli.ts` (bump version string)
- Modify: `README.md` (add new commands)
- Modify: `plugins/design-brain/CLAUDE.md` (routing rules)
- Modify: `plugins/design-brain/skills/design-brain/SKILL.md` (command table)

**Step 1: Create plugin commands** (one wrapper each)

**Step 2: Update exports and version**

**Step 3: Update README**

**Step 4: Build, test, commit, push**

```bash
npm run build && node --test
git add -A
git commit -m "feat: complete feature batch — style dict, compare, batch, moodboard, trends, scorecard"
git push
```

---

Plan complete and saved to `docs/plans/2026-02-18-feature-batch-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Direct (this session)** — I implement each task myself right here, commit after each

Which approach?