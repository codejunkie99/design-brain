---
name: db-compare
description: Compare two captures or two versions of the same URL
argument-hint: "<inspo-id-a> <inspo-id-b> OR --inspo <inspo-id>"
allowed-tools:
  - Bash
  - Read
---

# Design Brain Compare

Compare two design captures side-by-side, or compare two versions of the same URL.

## Cross-Capture Mode

Compare any two inspirations:

```bash
design-brain-memory compare --a "$1" --b "$2"
```

## Version Diff Mode

Compare an inspiration against its previous version (via `supersedes` field):

```bash
design-brain-memory compare --inspo "$1"
```

## Output

Writes a comparison report to `.design-brain/projects/<project>/comparisons/<a>-vs-<b>.md` with:
- Color diff table (+added / -removed / =shared)
- Typography diff table
- Component kinds diff
- Motion summary
- Overall summary line

After running, read the output file and present a summary highlighting the key differences.
