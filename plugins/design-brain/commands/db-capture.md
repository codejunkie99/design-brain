---
name: db-capture
description: Capture design inspiration into the relational design brain
argument-hint: "<project-id> <url-or-image-path> [--name ...] [--tags ...]"
allowed-tools:
  - Bash
  - Read
  - Write
---

# Design Brain Capture

Capture one inspiration source into the design brain.

## URL source

```bash
design-brain-memory ingest --project "$1" --url "$2"
```

## Screenshot source

```bash
design-brain-memory ingest --project "$1" --screenshot "$2"
```

## After capture

1. Read `.design-brain/projects/$1/README.md` and summarize the new tokens/components/motion extracted.

2. Find the new inspiration ID from the output (format: `inspo-<name>-<hash>`).

3. Create a queue entry at `.design-brain/ops/queue/<inspo-id>.yaml`:

```yaml
source: <inspo-id>
project: <project-id>
status: pending
phases:
  extract: pending
  synthesize: pending
  evolve: pending
  verify: pending
created: <today YYYY-MM-DD>
```

4. Report: "Capture complete. Run `/db-pipeline` to extract patterns, or `/db-next` to see queue."
