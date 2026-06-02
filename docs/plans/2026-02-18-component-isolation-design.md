# Component Isolation — Design Token JSON Export

**Date:** 2026-02-18
**Approach:** Enhance Browser Extraction Script (Approach 1)
**Status:** Approved

## Summary

Extract outerHTML during the existing browser capture pass and export structured design token JSON files grouped by component kind. Each kind (button, card, link, etc.) gets its own JSON file with deduplicated variants, styles, HTML, and source tracking.

## Data Model Change

Add `html?: string` to `ComponentToken` in `types.ts`. Truncated to 2KB per component. Optional so existing data still works.

## Token Export Structure

Output: `.design-brain/projects/<id>/tokens/components/<kind>.json`

```json
{
  "kind": "button",
  "project": "test",
  "count": 12,
  "variants": [
    {
      "selector": "button.hds-button--primary",
      "tag": "button",
      "text": "Start now",
      "className": "hds-button hds-button--primary",
      "html": "<button class=\"hds-button--primary\">Start now</button>",
      "styles": { "backgroundColor": "#533AFD", "borderRadius": "4px" },
      "sources": ["inspo-stripe-abc123"]
    }
  ]
}
```

- Deduplicated by selector across inspirations
- `sources` array tracks which inspirations contributed each variant
- Sorted by occurrence count (most common first)

## Integration

- Extraction: Add `html: el.outerHTML.slice(0, 2048)` to componentList.push in `extractFromUrl.ts`
- New module: `src/tokens.ts` — grouping, dedup, JSON generation
- Render: Called from `renderAll()` after SVG generation
- Respects existing `skipVisuals` flag

## Files Changed

| File | Change |
|------|--------|
| `src/types.ts` | Add `html?: string` to `ComponentToken` |
| `src/extractFromUrl.ts` | Add `html: el.outerHTML.slice(0, 2048)` to component push |
| `src/tokens.ts` | **New** — token grouping, dedup, JSON generation |
| `src/render.ts` | Call token generation in `renderAll()` |
| `tests/tokens.test.mjs` | **New** — test token grouping and dedup logic |
