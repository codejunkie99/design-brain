---
name: db-writing-style
description: Analyze writing style patterns in captured content
argument-hint: "<project-id>"
allowed-tools:
  - Bash
  - Read
---

# Design Brain Writing Style

Analyze tone and writing patterns from captured UI copy.

## Usage

```bash
design-brain-memory writing-style --project "$1"
```

## Output

Writes `.design-brain/projects/<project>/writing-style.md` with:
- Heading patterns
- CTA patterns
- Tone markers
- Hierarchy observations

After running, summarize dominant style traits and reusable copy patterns.
