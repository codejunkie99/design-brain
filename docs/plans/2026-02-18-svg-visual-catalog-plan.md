# SVG Visual Catalog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add four SVG visual generators (palette, components, typography, layout) that auto-generate on ingest/reindex, with per-project and per-inspiration output.

**Architecture:** New `src/svg.ts` module with four pure functions that take existing `DesignAnalysis` token arrays and return SVG XML strings. `render.ts` calls these and writes files. CLI gets `--no-visuals` flag.

**Tech Stack:** TypeScript, pure string concatenation for SVG (zero new dependencies)

**Design doc:** `docs/plans/2026-02-18-svg-visual-catalog-design.md`

---

### Task 1: Palette SVG Generator — Test

**Files:**
- Create: `tests/svg.test.mjs`

**Step 1: Write the failing test**

Create `tests/svg.test.mjs`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePaletteSvg } from '../dist/svg.js';

test('generatePaletteSvg returns valid SVG with color rects', () => {
  const colors = [
    { hex: '#0055FF', count: 42, samples: ['button', 'link'] },
    { hex: '#1A1A1A', count: 38, samples: ['text'] },
    { hex: '#F5F5F5', count: 31, samples: ['background'] },
  ];

  const svg = generatePaletteSvg(colors, 'Test Project');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.endsWith('</svg>'));
  assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.includes('#0055FF'));
  assert.ok(svg.includes('#1A1A1A'));
  assert.ok(svg.includes('#F5F5F5'));
  assert.ok(svg.includes('42'));
  assert.ok(svg.includes('Test Project'));
});

test('generatePaletteSvg handles empty colors', () => {
  const svg = generatePaletteSvg([], 'Empty');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('No colors'));
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/example/design-brain && npm run build && node --test tests/svg.test.mjs`
Expected: FAIL — `../dist/svg.js` does not exist

---

### Task 2: Palette SVG Generator — Implementation

**Files:**
- Create: `src/svg.ts`

**Step 1: Write minimal implementation**

Create `src/svg.ts`:

```typescript
import type { ColorToken } from './types.js';
import { truncate } from './util.js';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const SWATCH_SIZE = 60;
const SWATCH_GAP = 12;
const COLS = 5;
const MAX_COLORS = 20;
const FONT = 'system-ui, -apple-system, sans-serif';

export function generatePaletteSvg(colors: ColorToken[], title: string): string {
  const items = colors.slice(0, MAX_COLORS);

  if (items.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 60">\n`
      + `  <text x="10" y="30" font-family="${FONT}" font-size="14" fill="#888">No colors captured</text>\n`
      + `</svg>`;
  }

  const maxCount = Math.max(...items.map((c) => c.count), 1);
  const rows = Math.ceil(items.length / COLS);
  const cellW = SWATCH_SIZE + SWATCH_GAP;
  const rowH = SWATCH_SIZE + 60; // swatch + hex + bar + count
  const width = COLS * cellW + SWATCH_GAP;
  const height = 40 + rows * rowH + 10;

  const rects = items.map((color, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = SWATCH_GAP + col * cellW;
    const y = 40 + row * rowH;
    const barW = Math.round((color.count / maxCount) * SWATCH_SIZE);
    const hex = escapeXml(color.hex);

    return [
      `  <rect x="${x}" y="${y}" width="${SWATCH_SIZE}" height="${SWATCH_SIZE}" fill="${hex}" rx="4"/>`,
      `  <text x="${x}" y="${y + SWATCH_SIZE + 14}" font-family="${FONT}" font-size="10" fill="#333">${hex}</text>`,
      `  <rect x="${x}" y="${y + SWATCH_SIZE + 20}" width="${barW}" height="6" fill="${hex}" rx="2"/>`,
      `  <rect x="${x}" y="${y + SWATCH_SIZE + 20}" width="${SWATCH_SIZE}" height="6" fill="#eee" rx="2" opacity="0.3"/>`,
      `  <rect x="${x}" y="${y + SWATCH_SIZE + 20}" width="${barW}" height="6" fill="${hex}" rx="2"/>`,
      `  <text x="${x}" y="${y + SWATCH_SIZE + 40}" font-family="${FONT}" font-size="9" fill="#888">${color.count}</text>`,
    ].join('\n');
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">\n`
    + `  <text x="${SWATCH_GAP}" y="24" font-family="${FONT}" font-size="16" font-weight="600" fill="#111">${escapeXml(title)} — Color Palette</text>\n`
    + rects.join('\n')
    + `\n</svg>`;
}
```

**Step 2: Build and run test**

Run: `cd /Users/example/design-brain && npm run build && node --test tests/svg.test.mjs`
Expected: PASS for both palette tests

**Step 3: Commit**

```bash
cd /Users/example/design-brain
git add src/svg.ts tests/svg.test.mjs
git commit -m "feat: add palette SVG generator with tests"
```

---

### Task 3: Components SVG Generator — Test

**Files:**
- Modify: `tests/svg.test.mjs`

**Step 1: Add failing tests to `tests/svg.test.mjs`**

Append:

```javascript
import { generateComponentsSvg } from '../dist/svg.js';

test('generateComponentsSvg groups by kind', () => {
  const components = [
    { kind: 'button', tag: 'button', selector: '.btn-primary', text: 'Submit', className: 'btn-primary', styles: {} },
    { kind: 'button', tag: 'a', selector: '.cta-link', text: 'Learn more', className: 'cta-link', styles: {} },
    { kind: 'card', tag: 'div', selector: '.card-main', text: 'Feature', className: 'card-main', styles: {} },
  ];

  const svg = generateComponentsSvg(components, 'Test Project');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('button'));
  assert.ok(svg.includes('card'));
  assert.ok(svg.includes('.btn-primary'));
  assert.ok(svg.includes('Submit'));
});

test('generateComponentsSvg handles empty components', () => {
  const svg = generateComponentsSvg([], 'Empty');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('No components'));
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/example/design-brain && npm run build && node --test tests/svg.test.mjs`
Expected: FAIL — `generateComponentsSvg` is not exported

---

### Task 4: Components SVG Generator — Implementation

**Files:**
- Modify: `src/svg.ts`

**Step 1: Add `generateComponentsSvg` to `src/svg.ts`**

Add import of `ComponentToken` to types import, then append:

```typescript
const COMP_GROUP_W = 220;
const COMP_ITEM_H = 52;
const COMP_GAP = 16;

export function generateComponentsSvg(components: ComponentToken[], title: string): string {
  if (components.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 60">\n`
      + `  <text x="10" y="30" font-family="${FONT}" font-size="14" fill="#888">No components captured</text>\n`
      + `</svg>`;
  }

  // Group by kind
  const groups = new Map<string, ComponentToken[]>();
  for (const comp of components) {
    const list = groups.get(comp.kind) ?? [];
    list.push(comp);
    groups.set(comp.kind, list);
  }

  const sortedGroups = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  // Two-column layout
  const colOffsets = [COMP_GAP, COMP_GROUP_W + COMP_GAP * 2];
  let colHeights = [50, 50]; // start below title

  const groupSvgs: string[] = [];

  for (const [kind, items] of sortedGroups) {
    const col = colHeights[0] <= colHeights[1] ? 0 : 1;
    const x = colOffsets[col];
    let y = colHeights[col];

    // Group header
    groupSvgs.push(
      `  <text x="${x}" y="${y + 16}" font-family="${FONT}" font-size="13" font-weight="600" fill="#333">${escapeXml(kind)} (${items.length})</text>`
    );
    y += 24;

    // Group box
    const boxH = items.slice(0, 8).length * COMP_ITEM_H + 8;
    groupSvgs.push(
      `  <rect x="${x}" y="${y}" width="${COMP_GROUP_W}" height="${boxH}" fill="none" stroke="#ddd" rx="6"/>`
    );

    for (const item of items.slice(0, 8)) {
      groupSvgs.push(
        `  <text x="${x + 8}" y="${y + 18}" font-family="${FONT}" font-size="11" fill="#555">&lt;${escapeXml(item.tag)}&gt;</text>`,
        `  <text x="${x + 8}" y="${y + 32}" font-family="monospace" font-size="10" fill="#888">${escapeXml(item.selector)}</text>`,
        `  <text x="${x + 8}" y="${y + 44}" font-family="${FONT}" font-size="10" fill="#aaa">${escapeXml(truncate(item.text || '-', 30))}</text>`,
      );
      y += COMP_ITEM_H;
      if (items.indexOf(item) < items.length - 1 && items.indexOf(item) < 7) {
        groupSvgs.push(`  <line x1="${x + 8}" y1="${y}" x2="${x + COMP_GROUP_W - 8}" y2="${y}" stroke="#eee"/>`);
      }
    }

    colHeights[col] = y + boxH / items.slice(0, 8).length + COMP_GAP;
  }

  const height = Math.max(...colHeights) + 10;
  const width = colOffsets[1] + COMP_GROUP_W + COMP_GAP;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">\n`
    + `  <text x="${COMP_GAP}" y="28" font-family="${FONT}" font-size="16" font-weight="600" fill="#111">${escapeXml(title)} — Component Inventory</text>\n`
    + groupSvgs.join('\n')
    + `\n</svg>`;
}
```

**Step 2: Build and run tests**

Run: `cd /Users/example/design-brain && npm run build && node --test tests/svg.test.mjs`
Expected: PASS for all tests

**Step 3: Commit**

```bash
cd /Users/example/design-brain
git add src/svg.ts tests/svg.test.mjs
git commit -m "feat: add components SVG generator with tests"
```

---

### Task 5: Typography SVG Generator — Test + Implementation

**Files:**
- Modify: `tests/svg.test.mjs`
- Modify: `src/svg.ts`

**Step 1: Add failing test to `tests/svg.test.mjs`**

Append:

```javascript
import { generateTypographySvg } from '../dist/svg.js';

test('generateTypographySvg groups by font family', () => {
  const typography = [
    { fontFamily: 'Inter', fontSize: '32px', fontWeight: '700', lineHeight: '1.2', count: 8 },
    { fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '1.5', count: 24 },
    { fontFamily: 'Roboto Mono', fontSize: '14px', fontWeight: '400', lineHeight: '1.6', count: 5 },
  ];

  const svg = generateTypographySvg(typography, 'Test Project');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('Inter'));
  assert.ok(svg.includes('Roboto Mono'));
  assert.ok(svg.includes('32px'));
  assert.ok(svg.includes('700'));
});

test('generateTypographySvg handles empty typography', () => {
  const svg = generateTypographySvg([], 'Empty');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('No typography'));
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/example/design-brain && npm run build && node --test tests/svg.test.mjs`
Expected: FAIL — `generateTypographySvg` not exported

**Step 3: Add `generateTypographySvg` to `src/svg.ts`**

Add import of `TypographyToken` to types import, then append:

```typescript
const TYPO_ROW_H = 36;
const TYPO_BAR_W = 60;

export function generateTypographySvg(tokens: TypographyToken[], title: string): string {
  if (tokens.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 60">\n`
      + `  <text x="10" y="30" font-family="${FONT}" font-size="14" fill="#888">No typography captured</text>\n`
      + `</svg>`;
  }

  // Group by font family
  const families = new Map<string, TypographyToken[]>();
  for (const token of tokens) {
    const list = families.get(token.fontFamily) ?? [];
    list.push(token);
    families.set(token.fontFamily, list);
  }

  const maxCount = Math.max(...tokens.map((t) => t.count), 1);
  const width = 600;
  let y = 50;
  const lines: string[] = [];

  for (const [family, items] of families) {
    // Family heading
    lines.push(
      `  <text x="12" y="${y}" font-family="${FONT}" font-size="14" font-weight="600" fill="#222">${escapeXml(family)}</text>`
    );
    y += 6;
    lines.push(
      `  <line x1="12" y1="${y}" x2="${width - 12}" y2="${y}" stroke="#ddd"/>`
    );
    y += 20;

    for (const token of items.slice(0, 10)) {
      const meta = `${escapeXml(token.fontSize)} / ${escapeXml(token.fontWeight)} / ${escapeXml(token.lineHeight)}`;
      const barW = Math.round((token.count / maxCount) * TYPO_BAR_W);

      lines.push(
        `  <text x="12" y="${y}" font-family="${FONT}" font-size="11" fill="#555">${meta}</text>`,
        `  <rect x="240" y="${y - 8}" width="${TYPO_BAR_W}" height="8" fill="#eee" rx="2"/>`,
        `  <rect x="240" y="${y - 8}" width="${barW}" height="8" fill="#555" rx="2"/>`,
        `  <text x="310" y="${y}" font-family="${FONT}" font-size="9" fill="#888">${token.count}</text>`,
        `  <text x="350" y="${y}" font-family="${escapeXml(family)}, ${FONT}" font-size="12" fill="#333">Aa Bb Cc 123</text>`,
      );
      y += TYPO_ROW_H;
    }
    y += 12;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${y + 10}">\n`
    + `  <text x="12" y="28" font-family="${FONT}" font-size="16" font-weight="600" fill="#111">${escapeXml(title)} — Typography Specimen</text>\n`
    + lines.join('\n')
    + `\n</svg>`;
}
```

**Step 4: Build and run tests**

Run: `cd /Users/example/design-brain && npm run build && node --test tests/svg.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
cd /Users/example/design-brain
git add src/svg.ts tests/svg.test.mjs
git commit -m "feat: add typography SVG generator with tests"
```

---

### Task 6: Layout SVG Generator — Test + Implementation

**Files:**
- Modify: `tests/svg.test.mjs`
- Modify: `src/svg.ts`

**Step 1: Add failing test to `tests/svg.test.mjs`**

Append:

```javascript
import { generateLayoutSvg } from '../dist/svg.js';

test('generateLayoutSvg renders nested layout boxes', () => {
  const layout = [
    { tag: 'header', selector: '.site-header', role: 'banner', children: 3 },
    { tag: 'main', selector: '.content', role: 'main', children: 2 },
    { tag: 'aside', selector: '.sidebar', role: 'complementary', children: 4 },
    { tag: 'footer', selector: '.site-footer', role: 'contentinfo', children: 3 },
  ];

  const svg = generateLayoutSvg(layout, 'Test Project');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('header'));
  assert.ok(svg.includes('main'));
  assert.ok(svg.includes('.site-header'));
  assert.ok(svg.includes('banner'));
});

test('generateLayoutSvg handles empty layout', () => {
  const svg = generateLayoutSvg([], 'Empty');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('No layout'));
});
```

**Step 2: Run to verify fail, then implement**

Add `generateLayoutSvg` to `src/svg.ts` (add `LayoutToken` to imports):

```typescript
const LAYOUT_W = 500;
const LAYOUT_PAD = 16;
const LAYOUT_ITEM_H = 56;

const ROLE_COLORS: Record<string, string> = {
  banner: '#E3F2FD',
  navigation: '#FFF3E0',
  main: '#E8F5E9',
  complementary: '#F3E5F5',
  contentinfo: '#ECEFF1',
  region: '#FFFDE7',
};

export function generateLayoutSvg(layout: LayoutToken[], title: string): string {
  if (layout.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 60">\n`
      + `  <text x="10" y="30" font-family="${FONT}" font-size="14" fill="#888">No layout captured</text>\n`
      + `</svg>`;
  }

  const items = layout.slice(0, 12);
  let y = 50;
  const lines: string[] = [];

  // Determine nesting: header/footer at top level, others inside "main" if it exists
  const topLevel = ['header', 'nav', 'main', 'footer'];
  const mainChildren = ['aside', 'section', 'article'];

  for (const item of items) {
    const isNested = mainChildren.includes(item.tag);
    const indent = isNested ? LAYOUT_PAD * 2 : LAYOUT_PAD;
    const boxW = isNested ? LAYOUT_W - LAYOUT_PAD * 4 : LAYOUT_W - LAYOUT_PAD * 2;
    const fill = ROLE_COLORS[item.role] ?? '#F5F5F5';

    lines.push(
      `  <rect x="${indent}" y="${y}" width="${boxW}" height="${LAYOUT_ITEM_H}" fill="${fill}" stroke="#ccc" rx="4"/>`,
      `  <text x="${indent + 8}" y="${y + 18}" font-family="${FONT}" font-size="11" font-weight="600" fill="#333">&lt;${escapeXml(item.tag)}&gt; ${escapeXml(item.selector)} [${escapeXml(item.role || '-')}]</text>`,
      `  <text x="${indent + 8}" y="${y + 36}" font-family="${FONT}" font-size="10" fill="#888">children: ${item.children}</text>`,
    );
    y += LAYOUT_ITEM_H + 8;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LAYOUT_W} ${y + 10}">\n`
    + `  <text x="${LAYOUT_PAD}" y="28" font-family="${FONT}" font-size="16" font-weight="600" fill="#111">${escapeXml(title)} — Layout Structure</text>\n`
    + lines.join('\n')
    + `\n</svg>`;
}
```

**Step 3: Build and run all tests**

Run: `cd /Users/example/design-brain && npm run build && node --test tests/svg.test.mjs`
Expected: PASS all 8 tests

**Step 4: Commit**

```bash
cd /Users/example/design-brain
git add src/svg.ts tests/svg.test.mjs
git commit -m "feat: add layout SVG generator with tests"
```

---

### Task 7: Integrate SVG Generation into Render Pipeline

**Files:**
- Modify: `src/render.ts` (lines 1-13 for imports, lines 358-405 for `renderAll`)

**Step 1: Add SVG imports to `render.ts`**

At the top of `src/render.ts`, add after existing imports:

```typescript
import {
  generatePaletteSvg,
  generateComponentsSvg,
  generateTypographySvg,
  generateLayoutSvg,
} from './svg.js';
```

**Step 2: Add `renderVisuals` helper and call it in `renderAll`**

Add this function before `renderAll`:

```typescript
async function renderVisuals(
  baseDir: string,
  project: ProjectRecord,
  skipVisuals: boolean,
): Promise<void> {
  if (skipVisuals) return;

  // Project-level aggregated visuals
  const visualDir = path.join(baseDir, 'visuals');
  await fs.ensureDir(visualDir);

  const colors = aggregateColors(project.inspirations);
  const components = aggregateComponents(project.inspirations);
  const typography = aggregateTypography(project.inspirations);
  const layout = project.inspirations.at(-1)?.analysis.layout ?? [];

  await fs.writeFile(path.join(visualDir, 'palette.svg'), generatePaletteSvg(colors, project.name));
  await fs.writeFile(path.join(visualDir, 'components.svg'), generateComponentsSvg(components.map(({ count, ...rest }) => rest), project.name));
  await fs.writeFile(path.join(visualDir, 'typography.svg'), generateTypographySvg(typography, project.name));
  await fs.writeFile(path.join(visualDir, 'layout.svg'), generateLayoutSvg(layout, project.name));

  // Per-inspiration visuals
  for (const inspiration of project.inspirations) {
    const inspoVisualDir = path.join(baseDir, 'inspirations', inspiration.id);
    await fs.ensureDir(inspoVisualDir);

    await fs.writeFile(path.join(inspoVisualDir, 'palette.svg'), generatePaletteSvg(inspiration.analysis.colors, inspiration.name));
    await fs.writeFile(path.join(inspoVisualDir, 'components.svg'), generateComponentsSvg(inspiration.analysis.components, inspiration.name));
    await fs.writeFile(path.join(inspoVisualDir, 'typography.svg'), generateTypographySvg(inspiration.analysis.typography, inspiration.name));
    await fs.writeFile(path.join(inspoVisualDir, 'layout.svg'), generateLayoutSvg(inspiration.analysis.layout, inspiration.name));
  }
}
```

**Step 3: Update `renderAll` signature and add SVG call**

Change `renderAll` to accept `skipVisuals` parameter:

```typescript
export async function renderAll(rootDir: string, db: DesignBrainDatabase, skipVisuals = false): Promise<void> {
```

Add this call inside the project loop, after the `tokenFiles` writes (after line 389):

```typescript
    await renderVisuals(baseDir, project, skipVisuals);
```

**Step 4: Embed SVG links in markdown**

In `renderProjectReadme`, add after the `## Wiki` section (after line 107):

```typescript
    + `## Visual Catalog\n\n`
    + `![Color Palette](./visuals/palette.svg)\n`
    + `![Component Inventory](./visuals/components.svg)\n`
    + `![Typography Specimen](./visuals/typography.svg)\n`
    + `![Layout Structure](./visuals/layout.svg)\n\n`
```

In `renderInspiration`, add before `## Colors` (before line 199):

```typescript
    + `## Visual Catalog\n\n`
    + `![Color Palette](./${record.id}/palette.svg)\n`
    + `![Component Inventory](./${record.id}/components.svg)\n`
    + `![Typography Specimen](./${record.id}/typography.svg)\n`
    + `![Layout Structure](./${record.id}/layout.svg)\n\n`
```

**Step 5: Build and run all tests**

Run: `cd /Users/example/design-brain && npm run build && node --test tests/*.test.mjs`
Expected: PASS all tests

**Step 6: Commit**

```bash
cd /Users/example/design-brain
git add src/render.ts
git commit -m "feat: integrate SVG visual catalog into render pipeline"
```

---

### Task 8: Wire --no-visuals Flag Through CLI

**Files:**
- Modify: `src/cli.ts` (lines 75-138 for ingest, lines 267-274 for reindex)
- Modify: `src/commands.ts` (lines 79-183 for ingestInspiration, lines 222-225 for reindexBrain)

**Step 1: Add `--no-visuals` flag to `ingest` command in `src/cli.ts`**

Add after line 91 (after `--root` option):

```typescript
    .option('--no-visuals', 'Skip SVG visual generation')
```

Add `noVisuals?: boolean` to the action options type.

Pass it through to `ingestInspiration`:

```typescript
      const result = await ingestInspiration({
        // ... existing options ...
        skipVisuals: Boolean(options.noVisuals),
      });
```

**Step 2: Add `--no-visuals` to `reindex` command in `src/cli.ts`**

Add the flag and pass through:

```typescript
  program
    .command('reindex')
    .description('Regenerate markdown wiki and relation graph from database.json')
    .option('--root <dir>', 'Workspace root', process.cwd())
    .option('--no-visuals', 'Skip SVG visual generation')
    .action(async (options: { root: string; noVisuals?: boolean }) => {
      await reindexBrain(path.resolve(options.root), Boolean(options.noVisuals));
      console.log(`Reindexed ${path.resolve(options.root, '.design-brain')}`);
    });
```

**Step 3: Update `src/types.ts` — add `skipVisuals` to `IngestOptions`**

Add to `IngestOptions` interface:

```typescript
  skipVisuals?: boolean;
```

**Step 4: Update `src/commands.ts` — pass `skipVisuals` to `renderAll`**

In `ingestInspiration` (line 180), change:

```typescript
  await renderAll(options.rootDir, db, options.skipVisuals);
```

In `recordOutcome` (line 217), keep as-is (no skip option for outcome).

Update `reindexBrain` signature and pass through:

```typescript
export async function reindexBrain(rootDir: string, skipVisuals = false): Promise<void> {
  const db = await loadDatabase(rootDir);
  await renderAll(rootDir, db, skipVisuals);
}
```

In `initBrain` (line 76), keep as-is (always render visuals on init).

**Step 5: Build and run all tests**

Run: `cd /Users/example/design-brain && npm run build && node --test tests/*.test.mjs`
Expected: PASS

**Step 6: Commit**

```bash
cd /Users/example/design-brain
git add src/cli.ts src/commands.ts src/types.ts
git commit -m "feat: add --no-visuals flag to ingest and reindex commands"
```

---

### Task 9: Integration Test — Full Round-Trip

**Files:**
- Modify: `tests/svg.test.mjs`

**Step 1: Add integration test**

Append to `tests/svg.test.mjs`:

```javascript
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { renderAll } from '../dist/render.js';

test('renderAll generates SVG files in visuals directory', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'design-brain-svg-'));
  const brain = path.join(root, '.design-brain');
  await fs.mkdir(path.join(brain, 'projects'), { recursive: true });
  await fs.mkdir(path.join(brain, 'assets'), { recursive: true });
  await fs.mkdir(path.join(brain, 'graph'), { recursive: true });

  const db = {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projects: [{
      id: 'test-proj',
      name: 'Test Project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inspirations: [{
        id: 'inspo-1',
        name: 'Stripe',
        sourceType: 'url',
        capturedAt: new Date().toISOString(),
        tags: ['button'],
        fingerprint: 'abc123',
        version: 1,
        analysis: {
          colors: [{ hex: '#0055FF', count: 10, samples: ['btn'] }],
          typography: [{ fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '1.5', count: 5 }],
          components: [{ kind: 'button', tag: 'button', selector: '.btn', text: 'Pay', className: 'btn', styles: {} }],
          motion: [],
          layout: [{ tag: 'main', selector: '.content', role: 'main', children: 2 }],
          cssVariables: {},
        },
      }],
      outcomes: [],
    }],
  };

  await fs.writeFile(path.join(brain, 'database.json'), JSON.stringify(db, null, 2));
  await renderAll(root, db);

  // Check project-level visuals exist
  const visualDir = path.join(brain, 'projects', 'test-proj', 'visuals');
  const palette = await fs.readFile(path.join(visualDir, 'palette.svg'), 'utf-8');
  const components = await fs.readFile(path.join(visualDir, 'components.svg'), 'utf-8');
  const typography = await fs.readFile(path.join(visualDir, 'typography.svg'), 'utf-8');
  const layout = await fs.readFile(path.join(visualDir, 'layout.svg'), 'utf-8');

  assert.ok(palette.includes('#0055FF'));
  assert.ok(components.includes('button'));
  assert.ok(typography.includes('Inter'));
  assert.ok(layout.includes('main'));

  // Check per-inspiration visuals exist
  const inspoDir = path.join(brain, 'projects', 'test-proj', 'inspirations', 'inspo-1');
  const inspoPalette = await fs.readFile(path.join(inspoDir, 'palette.svg'), 'utf-8');
  assert.ok(inspoPalette.includes('#0055FF'));

  // Check markdown embeds SVG links
  const readme = await fs.readFile(path.join(brain, 'projects', 'test-proj', 'README.md'), 'utf-8');
  assert.ok(readme.includes('palette.svg'));
});
```

**Step 2: Build and run**

Run: `cd /Users/example/design-brain && npm run build && node --test tests/svg.test.mjs`
Expected: PASS all tests

**Step 3: Commit**

```bash
cd /Users/example/design-brain
git add tests/svg.test.mjs
git commit -m "test: add SVG visual catalog integration test"
```

---

### Task 10: Final Verification

**Step 1: Run full test suite**

Run: `cd /Users/example/design-brain && npm test`
Expected: All tests pass (util, query, svg)

**Step 2: Verify build is clean**

Run: `cd /Users/example/design-brain && npm run build 2>&1`
Expected: No TypeScript errors

**Step 3: Dry-run pack to check dist includes svg.js**

Run: `cd /Users/example/design-brain && npm run pack:dry 2>&1 | grep svg`
Expected: `dist/svg.js` and `dist/svg.d.ts` appear in the tarball listing

**Step 4: Run existing tests to confirm no regressions**

Run: `cd /Users/example/design-brain && node --test tests/util.test.mjs tests/query.test.mjs`
Expected: PASS
