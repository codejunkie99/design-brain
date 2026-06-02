---
name: db-review
description: Generate design review checklist from captured design patterns
argument-hint: "<project-id> [scan-path]"
allowed-tools:
  - Bash
  - Read
---

# Design Brain Review

Generate a review checklist grounded in captured patterns and tokens.

## Usage

Project-only checklist:

```bash
design-brain-memory review --project "$1"
```

With codebase scan context:

```bash
design-brain-memory review --project "$1" --scan "$2"
```

## Output

Writes `.design-brain/projects/<project>/review-checklist.md` with:
- Pattern-based checklist items
- Priority and confidence guidance
- Optional adherence checks when `--scan` is provided

After running, present the top checklist items and any high-risk gaps.
