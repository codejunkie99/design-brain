# SVG Visual Catalog for design-brain-memory

**Date:** 2026-02-18
**Approach:** Pure SVG Renderer Module (Approach 1)
**Status:** Approved

## Summary

Add a visual catalog to design-brain-memory that generates four SVG files per project and per inspiration. SVGs render color palettes, component inventories, typography specimens, and layout wireframes from existing `DesignAnalysis` data. Zero new dependencies — SVG is generated as XML strings.

## SVG Types

### 1. palette.svg
- Grid of color swatches (60x60px, 12px gap, 5 per row, max 20)
- Each swatch: filled rect with hex label below
- Usage bar proportional to max count, count number below
- Input: `ColorToken[]`

### 2. components.svg
- Grouped by `kind` (button, card, nav, etc.), sorted by occurrence count
- Each item shows tag, selector, truncated text
- Two-column layout, groups stack vertically
- Input: `ComponentToken[]`

### 3. typography.svg
- Grouped by font family
- Each row: size/weight/lineHeight, usage bar, sample text at proportional size
- Sorted by count within each family
- Input: `TypographyToken[]`

### 4. layout.svg
- Nested rectangles based on semantic roles (header/main/footer/aside/section/nav)
- Labels show tag, selector, role, children count
- Depth limited to 3 levels
- Input: `LayoutToken[]`

## Output Structure

```
.design-brain/projects/<id>/
├── visuals/                    # aggregated across all inspirations
│   ├── palette.svg
│   ├── components.svg
│   ├── typography.svg
│   └── layout.svg
├── inspirations/
│   ├── <inspo-id>.md
│   └── <inspo-id>/             # per-inspiration visuals
│       ├── palette.svg
│       ├── components.svg
│       ├── typography.svg
│       └── layout.svg
```

## Integration

### Render Pipeline
`renderAll()` in `render.ts` calls SVG generators after writing markdown and CSV. SVGs auto-generate on every `ingest` and `reindex`.

### Markdown Embedding
Project README and inspiration `.md` files get a `## Visual Catalog` section with embedded SVG links:
```markdown
![Color Palette](./visuals/palette.svg)
![Component Inventory](./visuals/components.svg)
![Typography Specimen](./visuals/typography.svg)
![Layout Structure](./visuals/layout.svg)
```

### CLI
- No new commands. SVGs generate automatically on `ingest` and `reindex`.
- New flag: `--no-visuals` to skip SVG generation.

### Skill
- No skill workflow changes. SVGs are files the skill can reference in responses.
- Existing `reindex` hook hint covers regeneration.

## Files Changed

| File | Change |
|------|--------|
| `src/svg.ts` | **New** — four SVG generator functions |
| `src/render.ts` | Call SVG generators in `renderAll()`, embed SVG links in markdown |
| `src/commands.ts` | Pass `--no-visuals` option through |
| `src/cli.ts` | Add `--no-visuals` flag to `ingest` and `reindex` commands |
| `src/types.ts` | No changes needed |
| `tests/svg.test.mjs` | **New** — test SVG output for each generator |

## Constraints

- Zero new dependencies
- SVG generated as pure XML strings (same pattern as markdown in render.ts)
- Git-friendly output (text-based, diffable)
- Renders in GitHub, VS Code, browsers, markdown previewers
