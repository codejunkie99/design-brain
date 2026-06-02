# Feature Batch Design — Style Dictionary, Moodboard, Trends, Scorecard, Compare, Batch Capture

**Date:** 2026-02-18
**Status:** Approved
**Approach:** All features in npm package (TypeScript + tests + CLI commands)

---

## Feature 1: Style Dictionary Export

**File:** `src/styleDictionary.ts`

Generate Style Dictionary-compatible JSON from a project's captured tokens.

**Output format:**
```json
{
  "color": {
    "accent-default": { "value": "#533AFD", "type": "color" }
  },
  "font": {
    "family": {
      "sohne": { "value": "sohne-var, 'SF Pro Display', sans-serif", "type": "fontFamily" }
    },
    "size": {
      "16": { "value": "16px", "type": "fontSize" }
    }
  },
  "motion": {
    "transition-duration-fast": { "value": "0.24s", "type": "duration" },
    "transition-easing-default": { "value": "cubic-bezier(0.25, 1, 0.5, 1)", "type": "cubicBezier" }
  }
}
```

Reuses color-naming logic from `tailwind.ts`. Adds motion tokens (unique durations + easing curves from TransitionDetail[]).

**CLI:** `design-brain-memory export --project <id> --format style-dictionary`
**Output file:** `.design-brain/projects/<id>/tokens.json`

---

## Feature 2: Compare Command

**File:** `src/compare.ts`

Two modes:
- **Cross-capture:** Compare any two inspirations
- **Version diff:** Compare two versions of same URL via `supersedes` field

**CLI:**
```bash
design-brain-memory compare --a <inspo-id-1> --b <inspo-id-2> --root .
design-brain-memory compare --inspo <inspo-id> --root .  # finds previous version
```

**Output:** `.design-brain/projects/<project>/comparisons/<a>-vs-<b>.md`

Diff report with tables for colors (+added/-removed/=shared), typography, components, motion. Summary line at bottom.

**Core function:** `compareInspirations(a: InspirationRecord, b: InspirationRecord): ComparisonReport`
**Render function:** `renderComparison(report: ComparisonReport): string`

---

## Feature 3: Batch Capture

**File:** `src/batch.ts`

Reads a file with one URL per line and ingests sequentially.

**CLI:**
```bash
design-brain-memory batch --project my-project --file urls.txt --root .
```

**Input format (tab-separated):**
```
https://stripe.com	Stripe Homepage	payments,fintech
https://linear.app	Linear App	productivity,saas
```

URL required, name and tags optional. Calls `ingestInspiration()` per line. Logs progress `[1/3] Capturing...`. Continues on failure. Returns summary.

**Flags:** `--no-visuals` for speed.

---

## Feature 4: Moodboard Generator

**File:** `src/moodboard.ts`

Composes a visual moodboard from all captures in a project.

**Outputs:**
- `moodboard.html` — Styled HTML dashboard with CSS grid, color swatches with gradients, font specimens, component kind badges, motion stats. Opens in browser/Cursor preview.
- `moodboard.png` — Rendered via `sharp` from SVG for Claude Code / embedding.

**CLI:**
```bash
design-brain-memory moodboard --project my-project --root .
```

**Layout sections:**
1. Color palette — Top 10 colors as swatches with hex labels and frequency bars
2. Typography specimen — Top 3 font stacks rendered at heading/body/caption sizes
3. Component kinds — Top 6 kinds with occurrence counts as badges
4. Motion summary — Avg duration, top easing curve, transition/animation counts
5. Footer — Source inspiration names and capture count

**Implementation:** Extract aggregate functions from `render.ts` into shared `src/aggregate.ts`. Generate HTML with inline SVG + CSS. Convert SVG to PNG via `sharp`.

---

## Feature 5: Trend Detection

**File:** `src/trends.ts`

Analyze captures across time, generate trend notes in `notes/trends/`.

**What it tracks:**
- Color trends — Colors appearing in 3+ captures
- Typography trends — Font families gaining/losing across captures
- Component trends — Component kinds frequency shifts
- Motion trends — Easing curves and duration ranges shifting
- Pattern momentum — Patterns with rising confidence

**Trend note schema:**
```yaml
---
type: trend
title: "Rising: cubic-bezier easing replacing ease-in-out"
signal: rising | stable | declining
domain: motion
evidence: ["[[inspo-stripe]]", "[[inspo-linear]]"]
first_seen: 2026-02-01
last_seen: 2026-02-18
occurrences: 5
created: 2026-02-18
updated: 2026-02-18
---
```

**CLI:** `design-brain-memory trends --project <id> --root .`

Scans captures sorted by `capturedAt`, groups recurring tokens, writes trend notes for 3+ occurrences. Updates existing trend notes (bumps occurrences, updates last_seen). Adds `notes/mocs/trends.md`.

---

## Feature 6: Design System Scorecard

**File:** `src/scorecard.ts`

Scan local codebase and compare against brain's captured tokens.

**CLI:**
```bash
design-brain-memory scorecard --project my-project --scan ./src --root .
```

**Scans:** `*.css`, `*.scss`, `*.less`, `*.html`, `*.tsx`, `*.jsx`, `*.vue`, `*.svelte`, `tailwind.config.*`

**Checks:**
| Check | Method |
|-------|--------|
| Color adherence | Parse hex/rgb in CSS, compare against palette |
| Typography adherence | Parse font-family/size, compare against tokens |
| Component coverage | Grep for component selectors/class patterns |
| Motion consistency | Parse transition/animation, compare durations/easing |

**Output:** `.design-brain/projects/<project>/scorecard.md`

Percentage scores per category + overall. Tables showing on-palette vs off-palette with file:line references. Regex-based parsing (no CSS parser dependency).

**Core function:** `scanCodebase(scanPath: string, project: ProjectRecord): ScorecardReport`

---

## Shared Refactor

Extract aggregation functions from `render.ts` into `src/aggregate.ts`:
- `aggregateColors(records: InspirationRecord[]): ColorToken[]`
- `aggregateTypography(records: InspirationRecord[]): TypographyToken[]`
- `aggregateComponents(records: InspirationRecord[]): Array<ComponentToken & { count: number }>`
- `aggregateMotion(records: InspirationRecord[]): Array<MotionToken & { count: number }>`

Both `render.ts` and new features import from `aggregate.ts`.

---

## New CLI Commands Summary

| Command | Description |
|---------|-------------|
| `export --format style-dictionary` | New format option on existing export command |
| `compare --a <id> --b <id>` | Cross-capture comparison |
| `compare --inspo <id>` | Version diff (finds previous via supersedes) |
| `batch --file <path>` | Batch capture from URL list |
| `moodboard --project <id>` | Generate HTML + PNG moodboard |
| `trends --project <id>` | Detect and write trend notes |
| `scorecard --project <id> --scan <path>` | Codebase design system audit |

## Plugin Commands

| Command | Wraps |
|---------|-------|
| `/db-compare` | `design-brain-memory compare` |
| `/db-batch` | `design-brain-memory batch` |
| `/db-moodboard` | `design-brain-memory moodboard` |
| `/db-trends` | `design-brain-memory trends` |
| `/db-scorecard` | `design-brain-memory scorecard` |
