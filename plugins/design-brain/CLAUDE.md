# Design Brain Plugin

Use this plugin to capture, synthesize, and reuse design knowledge across projects.

## Design Philosophy

**Ripgrep-first.** All search, analysis, and retrieval uses ripgrep and file reads by default. The knowledge system is designed to be grep-friendly — markdown files with YAML frontmatter, wiki links, and flat directory structure. No external LLM required.

LLM enrichment is optional — add `DESIGN_BRAIN_LLM_*` env vars for semantic ask-mode and richer capture summaries, but the core system works without it.

## Routing Rules

### Knowledge System Setup
When the user asks to:
- set up design brain, initialize knowledge system, get started with design brain

→ Run the `setup` skill (`/design-brain:setup`)

### Capture & Ingest
When the user asks to:
- collect design inspiration from websites or screenshots
- build a design wiki / design second brain
- extract colors, components, typography, motion, or layout
- capture a website or screenshot

→ Run `/db-capture`

### Knowledge Processing
When the user asks to:
- extract patterns from captures → `/db-extract`
- find connections between designs → `/db-synthesize`
- update old notes with new context → `/db-evolve`
- check knowledge system health → `/db-verify`
- run the full processing pipeline → `/db-pipeline`
- what's next, what needs processing → `/db-next`

### Queue Navigation
When the user asks to:
- what's pending, show queue, what needs work
- what should I process next

→ Run `/db-next`

### Search & Query
When the user asks to:
- search design brain, find patterns, look up components
- query design knowledge

→ Run `/db-search`

When the user asks to:
- ask a semantic design question
- summarize what the design brain says about a topic

→ Run `/db-ask`

### Stats & Health
When the user asks to:
- show stats, how big is my brain, vault metrics

→ Run `/db-stats`

### Export
When the user asks to:
- export Tailwind config, Style Dictionary, generate CSS, export design tokens

→ Run `/db-export`

### Component Graph
When the user asks to:
- map component relationships, component topology
- see which components co-occur most

→ Run `/db-component-graph`

### Review
When the user asks to:
- generate design review checklist
- create review criteria from captures

→ Run `/db-review`

### Token Naming
When the user asks to:
- generate semantic token names
- preview readable token naming

→ Run `/db-name-tokens`

### System Diff
When the user asks to:
- diff design systems between projects
- compare system changes over time

→ Run `/db-system-diff`

### Context Generation
When the user asks to:
- create AI context for this design system
- generate context markdown for Claude/Cursor

→ Run `/db-context`

### Wiki
When the user asks to:
- generate project wiki pages
- rebuild markdown wiki from captures

→ Run `/db-wiki`

### Graph
When the user asks to:
- generate interactive graph visualization
- explore token/project relationships visually

→ Run `/db-graph`

### Writing Style
When the user asks to:
- analyze UI copy style
- extract writing tone and CTA patterns

→ Run `/db-writing-style`

### Taste Profile
When the user asks to:
- build a taste profile from multiple URLs
- infer stylistic preferences from inspirations

→ Run `/db-taste`

### Compare
When the user asks to:
- compare two captures, diff two inspirations, version diff
- what changed between captures

→ Run `/db-compare`

### Batch Capture
When the user asks to:
- batch capture, ingest multiple URLs, capture from file

→ Run `/db-batch`

### Moodboard
When the user asks to:
- generate moodboard, visual summary, palette overview

→ Run `/db-moodboard`

### Trends
When the user asks to:
- detect trends, what's trending, show patterns over time

→ Run `/db-trends`

### Scorecard
When the user asks to:
- audit codebase, design system scorecard, check adherence
- compare code against design tokens

→ Run `/db-scorecard`

## Required Engine

Use the Agent Browser CLI command line workflow (`agent-browser open/eval/screenshot/snapshot`).
Do not implement page capture through direct Playwright code paths.

## Package Dependency

Requires `design-brain-memory` npm package (v0.8.2+):
```bash
npm install -g design-brain-memory
```

## Knowledge System Structure

The plugin maintains a knowledge graph at `.design-brain/`:

| Space | Purpose |
|-------|---------|
| `self/` | Agent identity, methodology, design philosophy |
| `notes/` | Knowledge graph: patterns, decisions, principles, MOCs |
| `ops/` | Queue state, session logs, maintenance signals |
| `projects/` | Raw captures: inspirations, outcomes, tokens, SVGs |
| `graph/` | Relation graph CSV files |

## Retrieval (Ripgrep-First)

Default search uses ripgrep on the `.design-brain/` directory:

```bash
# Find patterns by keyword
rg "button|card|navigation" .design-brain/notes/patterns/

# Find notes by confidence
rg "confidence: canonical" .design-brain/notes/

# Find all uses of a color
rg "#0055FF" .design-brain/

# Find relations
rg "has_inspiration|inspired_by" .design-brain/graph/relations.csv

# Find notes linked to a capture
rg "inspo-stripe" .design-brain/notes/
```

## Hooks

| Event | Hook | Purpose |
|-------|------|---------|
| SessionStart | session-orient | Load identity, show queue status, surface maintenance |
| PostToolUse (Write) | write-validate | Validate note frontmatter schema |
| Stop | session-capture | Log session activity to ops/sessions/ |

## Optional: LLM Enrichment

For semantic enrichment during capture or ask-mode:

- `DESIGN_BRAIN_LLM_BASE_URL`
- `DESIGN_BRAIN_LLM_API_KEY`
- `DESIGN_BRAIN_LLM_MODEL`

Or pass equivalent CLI flags. **Not required for core functionality.**
