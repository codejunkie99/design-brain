---
name: db-search
description: Search the design brain graph for components, colors, motion, and inspirations
argument-hint: "<query> [--project <id>]"
allowed-tools:
  - Bash
  - Read
---

# Design Brain Search

```bash
design-brain-memory search --query "$1"
```

For semantic answers with your own LLM:

```bash
design-brain-memory ask --query "$1" --llm-base-url "$DESIGN_BRAIN_LLM_BASE_URL" --llm-api-key "$DESIGN_BRAIN_LLM_API_KEY" --llm-model "$DESIGN_BRAIN_LLM_MODEL"
```
