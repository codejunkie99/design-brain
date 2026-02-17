---
name: design-brain
description: Build and maintain a relational markdown design memory from website URLs and screenshots using Agent Browser CLI and the design-brain-memory package.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Design Brain Skill

This skill turns inspirations into a reusable design context that can be carried across projects.

## Use this skill when

- The user wants to capture design inspiration from websites/screenshots.
- The user wants a project design wiki in markdown.
- The user wants relational links between inspirations and outcomes.
- The user wants grep/ripgrep-friendly retrieval on design history.

## Workflow

1. Initialize a design brain in the target workspace:

```bash
design-brain-memory init --root <workspace>
```

2. Ingest every inspiration source:

```bash
design-brain-memory ingest --project <project-id> --url <url> --name "<name>" --inspiration "<what it inspired>" --tags <tags>
```

or

```bash
design-brain-memory ingest --project <project-id> --screenshot <path> --name "<name>" --tags <tags>
```

3. Record what the team built from those inspirations:

```bash
design-brain-memory outcome --project <project-id> --title "<outcome title>" --description "<what was built>" --inspired-by <inspiration-id>
```

4. Query the design brain:

```bash
design-brain-memory search --query "<keywords>" --project <project-id>
```

```bash
design-brain-memory ask --query "<question>" --project <project-id> --llm-base-url <base-url> --llm-api-key <api-key> --llm-model <model>
```

5. Regenerate indexes when needed:

```bash
design-brain-memory reindex --root <workspace>
```

## Output contract

The skill keeps a stable markdown structure under `.design-brain/`:

- `projects/<project>/inspirations/*.md`
- `projects/<project>/outcomes/*.md`
- `projects/<project>/tokens/*.md`
- `graph/entities.csv`
- `graph/relations.csv`

With advanced lineage metadata:

- inspiration `fingerprint`
- `version` + `supersedes` chain
- `diffFromPrevious`

This makes retrieval deterministic with `rg`.

## Retrieval examples

```bash
rg "has_inspiration|inspired_by" .design-brain/graph/relations.csv
rg "button|card|navigation" .design-brain/projects/<project>/tokens/components.md
rg "#" .design-brain/projects/<project>/tokens/colors.md
```
