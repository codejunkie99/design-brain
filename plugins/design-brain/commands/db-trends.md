---
name: db-trends
description: Detect design trends across captures
argument-hint: "[--project <project-id>]"
allowed-tools:
  - Bash
  - Read
---

# Design Brain Trends

Detect recurring patterns across captures and generate trend notes.

## Usage

```bash
# All projects
design-brain-memory trends

# Filter to one project
design-brain-memory trends --project "$1"
```

## What It Tracks

- **Color trends** — Colors appearing in 3+ captures
- **Typography trends** — Font families recurring across captures
- **Component trends** — Component kinds with rising frequency
- **Motion trends** — Easing curves appearing consistently

## Signal Types

- **rising** — Increasing frequency in recent captures
- **stable** — Consistent across time
- **declining** — Decreasing in recent captures

## Output

- Trend notes in `.design-brain/notes/trends/` with YAML frontmatter
- Trends MOC at `.design-brain/notes/mocs/trends.md`

After running, summarize the detected trends and highlight any rising signals.
