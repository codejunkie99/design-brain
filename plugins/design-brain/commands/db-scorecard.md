---
name: db-scorecard
description: Audit local codebase against captured design tokens
argument-hint: "<project-id> <scan-path>"
allowed-tools:
  - Bash
  - Read
---

# Design Brain Scorecard

Scan a local codebase and compare against the brain's captured design tokens.

## Usage

```bash
design-brain-memory scorecard --project "$1" --scan "$2"
```

## What It Scans

Files: `*.css`, `*.scss`, `*.less`, `*.html`, `*.tsx`, `*.jsx`, `*.vue`, `*.svelte`

Skips: `node_modules/`, `.git/`, `dist/`

## Checks

| Category | Method |
|----------|--------|
| Color adherence | Parse hex/rgb in CSS, compare against captured palette |
| Typography adherence | Parse font-family/size, compare against captured tokens |
| Component coverage | Count captured component kinds |
| Motion consistency | Parse transition durations, compare against captured values |

## Output

Writes scorecard to `.design-brain/projects/<project>/scorecard.md` with:
- Percentage scores per category
- On-system vs off-system counts
- Lists of off-palette colors, off-system typography, and inconsistent motion

After running, read the scorecard and present the key findings with actionable recommendations.
