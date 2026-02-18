---
name: db-export
description: Export design tokens as Tailwind config or other formats
argument-hint: "<project-id> [--format tailwind]"
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

This generates a `tailwind.config.js` at `.design-brain/projects/<project>/tailwind.config.js` with:
- Colors extracted from CSS variables and color tokens (auto-named from var names)
- Typography (font families and sizes)

After export, read the generated file and summarize:
- Number of color tokens
- Number of font families
- Number of font sizes

Suggest: "Copy to your project root or import from this path in your Tailwind config."
