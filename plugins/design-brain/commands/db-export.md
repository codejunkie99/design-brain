---
name: db-export
description: Export design tokens as Tailwind, Style Dictionary, or CSS-in-JS format
argument-hint: "<project-id> [--format tailwind|style-dictionary|css-in-js]"
allowed-tools:
  - Bash
  - Read
---

# Design Brain Export

Export captured design tokens to usable formats.

## Tailwind Config (default)

```bash
design-brain-memory export --project "$1" --format tailwind
```

Generates `tailwind.config.js` with colors, typography, and font sizes.

## Style Dictionary

```bash
design-brain-memory export --project "$1" --format style-dictionary
```

Generates `tokens.json` in Amazon Style Dictionary format with:
- Color tokens (from CSS variables and color tokens)
- Font family and size tokens
- Motion tokens (durations and easing curves)

## CSS-in-JS Theme

```bash
design-brain-memory export --project "$1" --format css-in-js
```

Generates `theme.ts` with semantic colors, typography scale, and motion tokens ready for CSS-in-JS usage.

After export, read the generated file and summarize the token counts per category.
