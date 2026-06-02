---
name: design-brain
description: Build and query a relational markdown design memory using design-brain-memory and Agent Browser CLI.
version: 1.0.0
---

# Design Brain

Capture inspiration from websites/screenshots and turn it into a searchable design memory.

## Install

```bash
design-brain-memory install-skill
```

or

```bash
npx -y skills add design-brain/design-brain
```

## Workflow

1. Initialize:

```bash
design-brain-memory init --root <workspace>
```

2. Ingest inspiration:

```bash
design-brain-memory ingest --project <id> --url <url> --name "<name>" --tags <tags>
```

or

```bash
design-brain-memory ingest --project <id> --screenshot <path> --name "<name>" --tags <tags>
```

3. Record outcome:

```bash
design-brain-memory outcome --project <id> --title "<title>" --description "<what was built>" --inspired-by <inspiration-id>
```

4. Query:

```bash
design-brain-memory search --query "<keywords>"
```

```bash
design-brain-memory ask --query "<question>" --llm-base-url <url> --llm-api-key <key> --llm-model <model>
```
