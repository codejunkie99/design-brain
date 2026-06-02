---
name: db-system-diff
description: Diff design systems across projects or over time
argument-hint: "<project-id> OR <project-a> <project-b>"
allowed-tools:
  - Bash
  - Read
---

# Design Brain System Diff

Compare design systems across time or between projects.

## Temporal Diff (single project)

```bash
design-brain-memory system-diff --project "$1"
```

## Cross-Project Diff

```bash
design-brain-memory system-diff --project-a "$1" --project-b "$2"
```

## Output

Writes diff report to `.design-brain/projects/<project>/system-diff.md` or `.design-brain/system-diff-<a>-vs-<b>.md` including:
- Added/removed/shared colors
- Typography and motion deltas
- Component system overlap

After running, summarize the largest system-level shifts.
