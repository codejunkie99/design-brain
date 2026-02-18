---
name: design-brain
description: Build and maintain a design knowledge system from website URLs and screenshots. Captures inspiration, extracts reusable patterns, synthesizes connections, and builds persistent design memory. Ripgrep-first — no external LLM required.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Design Brain Skill

This skill turns design inspirations into a persistent knowledge system that compounds over time. All search and retrieval is ripgrep-based by default.

## Use this skill when

- The user wants to capture design inspiration from websites/screenshots
- The user wants to extract reusable patterns from captured designs
- The user wants to find connections across design sources
- The user wants a project design wiki in markdown
- The user wants relational links between inspirations, patterns, and outcomes
- The user wants grep/ripgrep-friendly retrieval on design history

## Knowledge System

The design brain has five spaces:

| Space | Contents |
|-------|----------|
| **self/** | Agent identity, methodology, design philosophy |
| **notes/** | Patterns, decisions, principles, Maps of Content |
| **ops/** | Processing queue, session logs, maintenance |
| **projects/** | Raw captures: inspirations, outcomes, tokens, SVGs, Tailwind |
| **graph/** | Relation graph CSV files |

## Pipeline

```
Capture → Extract → Synthesize → Evolve → Verify
```

1. **Capture** (`/db-capture`) — Ingest inspiration from URL or screenshot, create queue entry
2. **Extract** (`/db-extract`) — Generate pattern/decision notes from capture data using ripgrep + file reads
3. **Synthesize** (`/db-synthesize`) — Find connections via shared tags/sources/domains, update MOCs
4. **Evolve** (`/db-evolve`) — Backward pass: update older notes with new evidence
5. **Verify** (`/db-verify`) — Check schema, link health, MOC coverage

Run all at once: `/db-pipeline`
Check what's pending: `/db-next`

## Commands

| Command | Purpose |
|---------|---------|
| `/db-capture` | Capture inspiration from URL or screenshot |
| `/db-extract` | Extract patterns and decisions from captures |
| `/db-synthesize` | Find connections, update MOCs |
| `/db-evolve` | Update older notes with new evidence |
| `/db-verify` | Check schema and link health |
| `/db-pipeline` | Run full pipeline (all 4 phases) |
| `/db-next` | Show next pending queue item |
| `/db-search` | Ripgrep search across the brain |
| `/db-stats` | Vault metrics and health report |
| `/db-export` | Export Tailwind config |

## Workflow

### First-Time Setup

```bash
design-brain-memory init --root <workspace>
```

Or use `/design-brain:setup` for conversational onboarding.

### Capture Inspiration

```bash
design-brain-memory ingest --project <project-id> --url <url> --name "<name>" --tags <tags>
```

Or from screenshot:
```bash
design-brain-memory ingest --project <project-id> --screenshot <path> --name "<name>" --tags <tags>
```

### Process Knowledge

Run the full pipeline after captures:
```
/db-pipeline
```

Or step by step:
```
/db-extract → /db-synthesize → /db-evolve → /db-verify
```

### Search (Ripgrep-First)

```bash
rg "button|card" .design-brain/notes/patterns/
rg "confidence: canonical" .design-brain/notes/
rg "#0055FF" .design-brain/
rg "has_inspiration" .design-brain/graph/relations.csv
```

Or use `/db-search <query>` for guided search.

### Export

```bash
design-brain-memory export --project <project-id> --format tailwind
```

### Reindex

```bash
design-brain-memory reindex --root <workspace>
```

## Output Contract

Stable markdown structure under `.design-brain/`:

```
.design-brain/
├── self/identity.md
├── self/methodology.md
├── notes/patterns/*.md
├── notes/decisions/*.md
├── notes/principles/*.md
├── notes/mocs/hub.md
├── notes/mocs/<domain>.md
├── ops/queue/*.yaml
├── ops/sessions/*.md
├── ops/maintenance.md
├── projects/<project>/inspirations/*.md
├── projects/<project>/outcomes/*.md
├── projects/<project>/tokens/*.md
├── projects/<project>/visuals/*.svg
├── projects/<project>/tokens/components/*.json
├── projects/<project>/tailwind.config.js
├── graph/entities.csv
└── graph/relations.csv
```

## Note Schema

All notes in `notes/` follow this frontmatter schema:

```yaml
---
type: pattern | decision | principle
title: "<title>"
sources: ["[[inspo-id]]"]
domains: [web, brand, mobile, design-systems]
tags: [relevant, tags]
confidence: emerging | established | canonical  # for patterns/principles
status: active | superseded | revisiting        # for decisions
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

## Hooks

| Event | Action |
|-------|--------|
| SessionStart | Load identity, queue count, maintenance signals |
| PostToolUse (Write) | Validate note frontmatter schema |
| Stop | Log session activity summary |

## Retrieval Examples

```bash
rg "has_inspiration|inspired_by" .design-brain/graph/relations.csv
rg "button|card|navigation" .design-brain/projects/<project>/tokens/components.md
rg "type: pattern" .design-brain/notes/patterns/
rg "confidence: canonical" .design-brain/notes/
rg "gradient|contrast" .design-brain/notes/mocs/color-systems.md
rg "sources:.*inspo-stripe" .design-brain/notes/
```
