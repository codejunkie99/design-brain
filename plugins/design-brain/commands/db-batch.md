---
name: db-batch
description: Batch capture from a file of URLs
argument-hint: "<project-id> <urls-file>"
allowed-tools:
  - Bash
  - Read
  - Write
---

# Design Brain Batch Capture

Ingest multiple URLs from a file in one pass.

## Usage

```bash
design-brain-memory batch --project "$1" --file "$2"
```

Add `--no-visuals` for faster batch processing (skips SVG generation).

## Input File Format

Tab-separated, one URL per line. Name and tags are optional:

```
https://stripe.com	Stripe Homepage	payments,fintech
https://linear.app	Linear App	productivity,saas
https://vercel.com
```

Lines starting with `#` are treated as comments. Empty lines are skipped.

## Workflow

1. If no URL file exists yet, help the user create one
2. Run the batch command
3. Report results: succeeded/total count, list any failures
4. Suggest running `/db-pipeline` to process the new captures
