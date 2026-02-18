# Feature Batch 2 Design

Five new features for design-brain-memory v0.7.0. All ripgrep-first, no external LLM required for core functionality.

## 1. Component Relationship Mapping

**File:** `src/componentGraph.ts`

**What it does:** Builds a graph of component relationships from captured data.

- **Parent-child nesting:** Derived from DOM selector containment (e.g., `.card .button` means button is child of card)
- **Co-occurrence frequency:** Counts how often component kinds appear together across captures

**Output:**
- `component-graph.json` — structured graph with nodes (component kinds) and edges (nesting + co-occurrence count)
- `component-graph.md` — markdown summary with relationship table

**CLI:** `design-brain-memory component-graph --project <id>`

Written to `.design-brain/projects/<project>/component-graph.json` and `.md`.

## 2. CSS-in-JS Export

**File:** `src/cssInJs.ts`

**What it does:** Generates a styled-components/emotion compatible theme object from project tokens.

**Theme shape:**
```ts
{
  colors: { primary: '#hex', ... },
  fonts: { body: 'Inter', heading: 'Poppins', ... },
  fontSizes: { xs: '11px', sm: '13px', md: '16px', lg: '20px', xl: '28px' },
  transitions: { quick: '150ms ease', normal: '300ms ease-in-out', ... }
}
```

- Semantic size names for fontSizes (xs/sm/md/lg/xl) from pixel ranges
- Colors from CSS variable names or numbered fallback
- Integrated as `--format css-in-js` on existing `export` command

**Output:** `theme.ts` in project directory.

## 3. Design Review Checklist

**File:** `src/reviewChecklist.ts`

**What it does:** Combines pattern/principle compliance checks with scorecard findings into a single review checklist.

**Two sections:**
1. **Pattern/principle compliance** — reads `notes/patterns/*.md` and `notes/principles/*.md` YAML frontmatter, checks project captures against documented patterns
2. **Scorecard action items** — off-palette colors, off-system typography, inconsistent motion (reuses scorecard logic when `--scan` provided)

**CLI:** `design-brain-memory review --project <id> [--scan <path>]`

`--scan` is optional. Without it, only pattern/principle compliance is checked.

**Output:** Markdown checklist at `.design-brain/projects/<project>/review-checklist.md`.

## 4. Token Naming

**File:** `src/tokenNaming.ts`

**What it does:** Maps raw token values to human-readable names using local heuristics only.

- **Colors:** Nearest CSS named color via Euclidean RGB distance (~148 standard colors)
- **Typography:** Semantic size from pixel range (xs: <12px, sm: 12-14px, md: 14-18px, lg: 18-24px, xl: 24px+)
- **Motion:** Duration bucket (instant: <100ms, quick: 100-200ms, normal: 200-400ms, slow: 400ms+)

**Function:** `nameTokens(project): Map<string, string>` (raw value to name)

**CLI:** `design-brain-memory name-tokens --project <id>` — prints mapping table.

Used internally by export commands for readable token names.

## 5. Design System Diffing

**File:** `src/systemDiff.ts`

**What it does:** Full system-level diff operating on aggregated project tokens.

**Two modes:**
1. **Cross-project** (`--project-a X --project-b Y`): Compares aggregated tokens between two projects. Shows shared vs unique per project.
2. **Temporal** (`--project X`): Splits captures by time (first half vs second half by `capturedAt`). Shows tokens added/removed/persisted over time.

**Output:** Markdown report with tables per category (colors, typography, components, motion) written to `.design-brain/projects/<id>/system-diff-<timestamp>.md`.

**CLI:** `design-brain-memory system-diff --project-a X --project-b Y` or `design-brain-memory system-diff --project X`

Uses existing `aggregate*` functions from `src/aggregate.ts`. Same Set-based diff as `compare.ts` but at project level.

## Architecture Notes

- All features use existing aggregate functions from `src/aggregate.ts`
- No new dependencies required
- All outputs are markdown/JSON — grep-friendly
- Token naming integrates with existing export pipeline
- Review checklist reuses scorecard scanning when `--scan` provided
