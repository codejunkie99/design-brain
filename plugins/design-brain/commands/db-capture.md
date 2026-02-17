---
name: db-capture
description: Capture design inspiration into the relational design brain
argument-hint: "<project-id> <url-or-image-path> [--name ...] [--tags ...]"
allowed-tools:
  - Bash
  - Read
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

After capture, read `.design-brain/projects/$1/README.md` and summarize the new tokens/components/motion extracted.
