---
name: db-moodboard
description: Generate visual moodboard from project captures
argument-hint: "<project-id>"
allowed-tools:
  - Bash
  - Read
---

# Design Brain Moodboard

Generate a visual moodboard from all captures in a project.

## Usage

```bash
design-brain-memory moodboard --project "$1"
```

## Output

Generates files in `.design-brain/projects/<project>/`:
- `moodboard.html` — Styled dark-theme dashboard with CSS grid, color swatches, font specimens, component badges, motion stats. Opens in browser or Cursor preview.
- `moodboard.svg` — Flat SVG version for embedding
- `moodboard.png` — PNG rendered via sharp (if available) for Claude Code image reading

## Sections

1. **Color Palette** — Top 10 colors as swatches with hex labels and frequency
2. **Typography** — Top 3 font stacks rendered as specimens
3. **Components** — Top 6 component kinds as badges with occurrence counts
4. **Motion** — Average duration, top easing curve, transition/animation counts
5. **Footer** — Source inspiration names and capture count

After generating, suggest opening the HTML file in a browser for best visual experience.
