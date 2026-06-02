---
name: db-ask
description: Ask a design question against the design brain
argument-hint: "<question> [project-id]"
allowed-tools:
  - Bash
  - Read
---

# Design Brain Ask

Run semantic question-answering over design brain context.

## Usage

All projects:

```bash
design-brain-memory ask --query "$1"
```

Project-scoped:

```bash
design-brain-memory ask --query "$1" --project "$2"
```

## Output

Prints an answer plus source matches.

After running, report the answer and list the top cited sources.
