# Tailwind Config Export from Design Brain

**Date:** 2026-02-18
**Approach:** Static Tailwind Config Generator (Approach 1)
**Status:** Approved

## Summary

Generate a `tailwind.config.js` from captured design data. Extracts colors (from CSS variables + ColorToken[]) and typography (fontFamily + fontSize) into a Tailwind theme extension. Auto-names colors from CSS variable names where possible, falls back to numbered keys.

## Data Extraction

### Colors
1. Parse `cssVariables` for color-related keys (containing `color`, `bg`, `border`, `text`, `fill`, `stroke`)
2. Derive Tailwind key from CSS var name: `--hds-color-accent-default-icon-solid` → `accent-default`
3. Merge in `ColorToken[]` hex values not already covered, named `color-1`, `color-2`, etc. (sorted by count)
4. Deduplicate by hex value, prefer named keys over numbered

### Typography
- Unique `fontFamily` values → `theme.fontFamily`
- Unique `fontSize` values → `theme.fontSize` (key = pixel value without unit)

## Output

File: `.design-brain/projects/<id>/tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: { ... },
      fontFamily: { ... },
      fontSize: { ... },
    },
  },
};
```

## Integration

- Generated in `renderAll()` after component tokens, respects `skipVisuals` flag
- New CLI command: `design-brain-memory export --project <id> --format tailwind --root <dir>`
- Project README gets a link to `./tailwind.config.js`

## Files Changed

| File | Change |
|------|--------|
| `src/tailwind.ts` | **New** — Tailwind config generation logic |
| `src/render.ts` | Call Tailwind generator in `renderAll()`, add README link |
| `src/cli.ts` | Add `export` command |
| `src/commands.ts` | Add `exportDesignSystem()` function |
| `tests/tailwind.test.mjs` | **New** — test Tailwind config output |
