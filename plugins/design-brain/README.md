# Design Brain Plugin

Plugin + skill wrapper for `design-brain-memory`.

## Purpose

Capture design inspiration using Agent Browser CLI and maintain a relational markdown design wiki.

## Included

- `skills/design-brain/SKILL.md`
- `commands/db-*.md` (capture, search, export, compare, trends, scorecard, review, graph, context, taste, and more)
- `.claude-plugin/plugin.json`
- `CLAUDE.md`

## Package dependency

Install the CLI package in your environment:

```bash
npm install -g design-brain-memory
# or
npm install -g github:design-brain/design-brain
agent-browser install

# install skill for agents
design-brain-memory install-skill
```

Optional environment for bring-your-own LLM:

```bash
export DESIGN_BRAIN_LLM_BASE_URL=\"https://api.openai.com/v1\"
export DESIGN_BRAIN_LLM_API_KEY=\"<your-key>\"
export DESIGN_BRAIN_LLM_MODEL=\"gpt-4o-mini\"
```
