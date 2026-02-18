---
name: db-search
description: Search the design brain using ripgrep — patterns, colors, components, inspirations
argument-hint: "<query> [--project <id>]"
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
---

# Design Brain Search

Search the knowledge system using ripgrep. No LLM required.

## Default: Ripgrep Search

Search across the entire brain:

```bash
rg "<query>" .design-brain/ --type md
```

### Targeted searches

**Patterns only:**
```bash
rg "<query>" .design-brain/notes/patterns/
```

**Decisions only:**
```bash
rg "<query>" .design-brain/notes/decisions/
```

**Specific project:**
```bash
rg "<query>" .design-brain/projects/<project-id>/
```

**Colors by hex:**
```bash
rg "<hex>" .design-brain/
```

**Components by kind:**
```bash
rg "<kind>" .design-brain/projects/*/tokens/components.md
```

**Relations graph:**
```bash
rg "<entity>" .design-brain/graph/relations.csv
```

**Notes by confidence:**
```bash
rg "confidence: canonical" .design-brain/notes/
```

**Notes by domain:**
```bash
rg "domains:.*web" .design-brain/notes/
```

## CLI keyword search

For ranked results with snippets:

```bash
design-brain-memory search --query "<query>"
```

## Optional: LLM semantic search

Only if `DESIGN_BRAIN_LLM_*` env vars are set:

```bash
design-brain-memory ask --query "<query>" --llm-base-url "$DESIGN_BRAIN_LLM_BASE_URL" --llm-api-key "$DESIGN_BRAIN_LLM_API_KEY" --llm-model "$DESIGN_BRAIN_LLM_MODEL"
```

## After search

Present results grouped by type (patterns, decisions, captures) with file paths and key snippets.
