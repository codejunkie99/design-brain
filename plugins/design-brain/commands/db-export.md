---
name: db-export
description: Export design tokens as Tailwind config or Style Dictionary format
argument-hint: "<project-id> [--format tailwind|style-dictionary]"
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

After export, read the generated file and summarize the token counts per category.
