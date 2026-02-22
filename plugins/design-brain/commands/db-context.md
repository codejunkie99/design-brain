---
name: db-context
description: Generate AI-ready context file from design brain data
argument-hint: "[project-id]"
allowed-tools:
  - Bash
  - Read
---

# Design Brain Context

Generate context markdown for AI coding tools.

## Usage

Unified context across all projects:

```bash
design-brain-memory context
```

Project-scoped context:

```bash
design-brain-memory context --project "$1"
```

## Output

Writes `.design-brain/context/design-context.md` (or project-specific equivalent).

After running, summarize key sections and recommend where to place it (for example `.claude/`).
