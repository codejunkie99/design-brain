# design-brain-memory

A persistent design knowledge system that captures inspiration from websites and screenshots, extracts reusable patterns, and builds a grep-friendly markdown knowledge graph.

Built on [Agent Browser CLI](https://github.com/vercel-labs/agent-browser) for headless capture. No external LLM required — bring your own optionally for semantic enrichment.

## Features

- **Capture** — Extract colors, typography, components, motion, layout, and CSS variables from any URL or screenshot
- **Knowledge system** — Three-space architecture (self / notes / ops) with pattern, decision, and principle notes
- **Processing pipeline** — Extract → Synthesize → Evolve → Verify with queue tracking
- **Tailwind export** — Generate `tailwind.config.js` from captured design tokens with auto-named colors from CSS variables
- **Visual catalog** — SVG palette, component, typography, and layout visualizations per capture
- **Component isolation** — Grouped JSON tokens by component kind (button, card, navigation, etc.)
- **Version lineage** — Fingerprint-based versioning with diffs between captures
- **Responsive coverage** — Capture at multiple viewports in a single pass
- **Interaction states** — Hover, focus, and active state extraction from runtime CSS
- **Journey capture** — Click-through exploration with per-step snapshots
- **Ripgrep-friendly** — Flat markdown files with YAML frontmatter, wiki links, and CSV relation graph

## Install

```bash
npm install -g design-brain-memory
agent-browser install
```

## Quick Start

```bash
# Initialize the knowledge system
design-brain-memory init --root .

# Capture a website
design-brain-memory ingest \
  --project my-project \
  --url https://stripe.com \
  --name "Stripe Homepage" \
  --tags fintech,payments

# Search with ripgrep
rg "button|card" .design-brain/notes/patterns/
rg "#533AFD" .design-brain/

# Or use the built-in search
design-brain-memory search --query "button hierarchy"

# Export Tailwind config
design-brain-memory export --project my-project --format tailwind
```

## Commands

| Command | Description |
|---------|-------------|
| `init` | Create `.design-brain/` with knowledge system directories |
| `ingest` | Capture inspiration from a URL or screenshot |
| `outcome` | Record a design outcome linked to inspirations |
| `search` | Keyword search across the brain |
| `ask` | Semantic search (requires LLM config) |
| `install-skill` | Install the Design Brain coding-agent skill |
| `reindex` | Regenerate markdown, visuals, and relation graph from `database.json` |
| `export` | Export tokens (`tailwind`, `style-dictionary`, or `css-in-js`) |
| `compare` | Compare two captures or version diff |
| `batch` | Batch capture from a URL list file |
| `moodboard` | Generate HTML + PNG visual moodboard |
| `trends` | Detect design trends across captures |
| `scorecard` | Audit codebase against captured design tokens |
| `component-graph` | Generate component relationship graph for a project |
| `review` | Generate design review checklist from captures and optional code scan |
| `name-tokens` | Preview human-readable token names |
| `wiki` | Generate wiki pages with project and shared context |
| `graph` | Generate interactive knowledge graph HTML |
| `context` | Generate AI-consumable context file (Claude/Cursor) |
| `writing-style` | Analyze writing style patterns from captures |
| `system-diff` | Diff design systems across projects or over time |
| `taste` | Build a taste profile from multiple URLs/domains |

### Ingest

```bash
design-brain-memory ingest \
  --project checkout-redesign \
  --project-name "Checkout Redesign" \
  --url https://stripe.com \
  --name "Stripe checkout inspiration" \
  --tags payments,checkout,cta \
  --journey-steps 4 \
  --viewport desktop=1440x1200 tablet=1024x1366 mobile=390x844
```

From a screenshot:

```bash
design-brain-memory ingest \
  --project checkout-redesign \
  --screenshot ./screens/inspo-hero.png \
  --name "Hero screenshot" \
  --tags hero,landing
```

### Record Outcome

```bash
design-brain-memory outcome \
  --project checkout-redesign \
  --title "v1 shipped" \
  --description "Card-based checkout with clear primary CTA" \
  --inspired-by inspo-stripe-checkout-1234abcd \
  --tags shipped,frontend
```

## Knowledge System

The brain organizes knowledge across five spaces:

```
.design-brain/
├── self/                          # Agent identity and methodology
│   ├── identity.md
│   └── methodology.md
├── notes/                         # Knowledge graph
│   ├── patterns/*.md              # Reusable design patterns
│   ├── decisions/*.md             # Design decisions with rationale
│   ├── principles/*.md            # Cross-project principles
│   └── mocs/                      # Maps of Content
│       ├── hub.md
│       ├── color-systems.md
│       ├── typography.md
│       ├── components.md
│       ├── layout.md
│       ├── motion.md
│       └── brand.md
├── ops/                           # Operations
│   ├── queue/*.yaml               # Processing pipeline queue
│   ├── sessions/*.md              # Session activity logs
│   └── maintenance.md             # Health signals
├── projects/                      # Raw captures
│   └── <project>/
│       ├── README.md
│       ├── inspirations/*.md
│       ├── outcomes/*.md
│       ├── tokens/                # Aggregated design tokens
│       ├── visuals/*.svg          # SVG visual catalog
│       └── tailwind.config.js     # Generated Tailwind config
└── graph/                         # Relation graph
    ├── entities.csv
    └── relations.csv
```

### Note Schema

All notes use YAML frontmatter:

```yaml
---
type: pattern | decision | principle
title: "Descriptive title"
sources: ["[[inspo-id]]"]
domains: [web, brand, mobile, design-systems]
tags: [relevant, tags]
confidence: emerging | established | canonical
created: 2026-02-18
updated: 2026-02-18
---
```

### Processing Pipeline

```
Capture → Extract → Synthesize → Evolve → Verify
```

1. **Capture** — Ingest inspiration, create queue entry
2. **Extract** — Generate pattern and decision notes from capture data
3. **Synthesize** — Find connections, add wiki links, update MOCs
4. **Evolve** — Update older notes with new evidence, upgrade confidence
5. **Verify** — Check schema compliance, link health, MOC coverage

## Retrieval

Designed for ripgrep:

```bash
# Find patterns by keyword
rg "button|card|navigation" .design-brain/notes/patterns/

# Find canonical patterns
rg "confidence: canonical" .design-brain/notes/

# Search by color hex
rg "#533AFD" .design-brain/

# Query the relation graph
rg "has_inspiration|inspired_by" .design-brain/graph/relations.csv

# Find notes linked to a specific capture
rg "inspo-stripe" .design-brain/notes/
```

## Claude Code Plugin

design-brain ships as a Claude Code plugin with slash commands and hooks:
Current plugin command coverage includes:

| Command | Description |
|---------|-------------|
| `/db-capture` | Capture inspiration from URL or screenshot |
| `/db-extract` | Extract patterns and decisions from captures |
| `/db-synthesize` | Find connections, update MOCs |
| `/db-evolve` | Backward pass — update older notes |
| `/db-verify` | Schema and link health check |
| `/db-pipeline` | Run all pipeline phases |
| `/db-next` | Show next pending queue item |
| `/db-search` | Ripgrep search across the brain |
| `/db-ask` | Ask semantic design questions with cited sources |
| `/db-stats` | Vault metrics and health report |
| `/db-export` | Export tokens (Tailwind, Style Dictionary, CSS-in-JS) |
| `/db-compare` | Compare two captures or version diff |
| `/db-batch` | Batch capture from URL list file |
| `/db-moodboard` | Generate visual moodboard |
| `/db-trends` | Detect design trends across captures |
| `/db-scorecard` | Audit codebase against captured tokens |
| `/db-component-graph` | Generate component relationship graph |
| `/db-review` | Generate design review checklist |
| `/db-name-tokens` | Preview semantic token names |
| `/db-system-diff` | Diff systems over time or across projects |
| `/db-context` | Generate AI-ready context markdown |
| `/db-wiki` | Generate project + shared wiki pages |
| `/db-graph` | Generate interactive graph visualization |
| `/db-writing-style` | Analyze UI writing style patterns |
| `/db-taste` | Build a taste profile from multiple inspirations |

### Hooks

| Event | Action |
|-------|--------|
| SessionStart | Load identity context, queue status, maintenance signals |
| PostToolUse (Write) | Validate note frontmatter schema |
| Stop | Log session activity summary |

## Optional: LLM Enrichment

For semantic search and richer capture summaries, configure any OpenAI-compatible endpoint:

```bash
export DESIGN_BRAIN_LLM_BASE_URL="https://api.openai.com/v1"
export DESIGN_BRAIN_LLM_API_KEY="<your-key>"
export DESIGN_BRAIN_LLM_MODEL="gpt-4o-mini"
```

Or pass per command: `--llm-base-url <url> --llm-api-key <key> --llm-model <model>`

Not required for core functionality.

## Packaging & Publish

```bash
npm login --auth-type=web
npm run release:check
npm publish --access public
```

`release:check` runs a clean build, tests, and `npm pack --dry-run` to verify publish contents.

## Requirements

- Node.js 20+
- [Agent Browser CLI](https://github.com/vercel-labs/agent-browser) (`agent-browser install`)

## License

MIT
