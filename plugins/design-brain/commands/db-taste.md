---
name: db-taste
description: Build a taste profile from multiple inspiration URLs
argument-hint: "<project-id> <url1> [url2 ...]"
allowed-tools:
  - Bash
  - Read
---

# Design Brain Taste

Build a taste profile from a set of inspiration URLs/domains.

## Usage

```bash
design-brain-memory taste "${@:2}" --project "$1"
```

If you have more URLs, include them all after the project id.

## Output

Prints a synthesized taste profile including:
- Preferred color and typography tendencies
- Recurring component/layout motifs
- Interaction and motion style preferences

After running, summarize distinctive preferences and concrete guardrails for implementation.
