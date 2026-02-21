---
name: db-name-tokens
description: Preview human-readable names for captured design tokens
argument-hint: "<project-id>"
allowed-tools:
  - Bash
  - Read
---

# Design Brain Name Tokens

Generate human-readable token names for review before export.

## Usage

```bash
design-brain-memory name-tokens --project "$1"
```

## Output

Prints mapping lines:

```text
<raw-token> -> <semantic-name>
```

After running, summarize naming conventions and flag any ambiguous names.
