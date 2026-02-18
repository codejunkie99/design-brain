# Design Brain Knowledge System — Full Design

**Date:** 2026-02-18
**Status:** Approved
**Inspiration:** Ars Contexta plugin architecture

## Summary

Transform design-brain from a capture tool into a full knowledge system. Add persistent agent memory, a processing pipeline that turns raw captures into synthesized design knowledge, wiki-linked notes, MOCs, hooks for quality enforcement, session management, and a conversational setup flow.

## Three-Space Architecture

All new directories live inside `.design-brain/` alongside existing `projects/`, `graph/`, `assets/`.

```
.design-brain/
├── self/                    # Agent persistent mind
│   ├── identity.md          # Design methodology, preferences, vocabulary
│   ├── principles.md        # Cross-project design principles (grows)
│   └── methodology.md       # How this agent approaches design work
├── notes/                   # Knowledge graph (the core)
│   ├── patterns/            # Reusable design patterns extracted from captures
│   ├── decisions/           # Design decisions with rationale
│   ├── principles/          # Evidence-backed design principles
│   └── mocs/                # Maps of Content
│       ├── hub.md           # Top-level navigation
│       ├── color-systems.md
│       ├── typography.md
│       ├── components.md
│       ├── layout.md
│       ├── motion.md
│       └── brand.md
├── ops/                     # Operational coordination
│   ├── queue/               # Processing queue state
│   ├── sessions/            # Session capture logs
│   └── maintenance.md       # System health signals
├── projects/                # EXISTING — unchanged
├── graph/                   # EXISTING — unchanged
├── assets/                  # EXISTING — unchanged
└── database.json            # EXISTING — unchanged
```

## Note Types

Four atomic note types, all in `notes/`:

### Pattern Note (`notes/patterns/*.md`)
Reusable design patterns extracted from captures.
```yaml
---
type: pattern
title: Gradient CTA on Dark Background
sources: ["[[inspo-stripe-83d215b7]]"]
domains: [web, brand]
tags: [cta, gradient, contrast]
confidence: emerging | established | canonical
created: 2026-02-18
updated: 2026-02-18
---
```

### Decision Note (`notes/decisions/*.md`)
Design decisions with rationale, linked to inspirations that informed them.
```yaml
---
type: decision
title: Use 4px border-radius for all interactive elements
sources: ["[[inspo-stripe-83d215b7]]", "[[inspo-linear-abc123]]"]
domains: [design-systems]
tags: [border-radius, consistency]
status: active | superseded | revisiting
created: 2026-02-18
updated: 2026-02-18
---
```

### Principle Note (`notes/principles/*.md`)
Cross-project design principles backed by evidence from captures.
```yaml
---
type: principle
title: Progressive disclosure reduces cognitive load
evidence: ["[[pattern-bento-grid]]", "[[pattern-accordion-nav]]"]
domains: [web, mobile]
tags: [ux, cognitive-load]
confidence: emerging | established | canonical
created: 2026-02-18
updated: 2026-02-18
---
```

### Critique Note (`notes/critiques/*.md`)
Evaluations of captured designs (included in schema but pipeline phase skipped per user preference).

## Processing Pipeline (5 Phases)

| Phase | Command | What Happens |
|-------|---------|-------------|
| **Capture** | `/db-capture` (existing) | Raw capture → screenshots, tokens, SVGs |
| **Extract** | `/db-extract` | Read capture data, generate pattern/decision/principle note drafts |
| **Synthesize** | `/db-synthesize` | Find connections across notes, update MOCs, add wiki links |
| **Evolve** | `/db-evolve` | Backward pass — update older notes with new context |
| **Verify** | `/db-verify` | Schema compliance, link health, MOC coverage |

### Pipeline Orchestration
`/db-pipeline` runs all phases in sequence. Each phase runs in a fresh subagent context for optimal attention.

### Queue System (`ops/queue/`)
Each capture creates a task file in `ops/queue/` tracking which phases have run:
```yaml
---
source: inspo-stripe-83d215b7
project: test
status: pending | extracting | synthesizing | evolving | verifying | done
created: 2026-02-18
---
```

## Hooks

| Hook | Event | Purpose |
|------|-------|---------|
| **Session Orient** | `SessionStart` | Load `self/identity.md`, surface pending queue items, show maintenance signals |
| **Write Validate** | `PostToolUse` (Write) | Enforce frontmatter schema on notes written to `notes/` |
| **Auto Commit** | `PostToolUse` (Write, async) | Git auto-commit `.design-brain/` changes |
| **Session Capture** | `Stop` | Save session summary to `ops/sessions/` |

## Conversational Setup (`/design-brain:setup`)

4-phase flow:

1. **Detect** — find existing `.design-brain/`, inventory what's captured
2. **Understand** — 2-3 questions about design practice (domains, focus areas, team)
3. **Generate** — create `self/`, `notes/mocs/`, note templates, hook configs, processing skills
4. **Validate** — check all pieces exist, run smoke test

## Commands

| Command | Status | Purpose |
|---------|--------|---------|
| `/db-capture` | Existing | Capture inspiration |
| `/db-search` | Existing | Search the brain |
| `/db-extract` | New | Extract patterns/decisions from captures |
| `/db-synthesize` | New | Find connections, update MOCs |
| `/db-evolve` | New | Backward pass — update old notes |
| `/db-verify` | New | Schema + link health check |
| `/db-pipeline` | New | Full Extract → Synthesize → Evolve → Verify |
| `/db-export` | New | Export Tailwind config |
| `/db-stats` | New | Vault metrics |
| `/db-next` | New | What to work on next |
| `/design-brain:setup` | New | Conversational onboarding |

## Self Space (`self/`)

### identity.md
Generated during setup. Contains:
- Design domains the user works in
- Preferred design vocabulary
- Tools and frameworks used
- Team context
- Design philosophy / methodology

### principles.md
Grows over time. Cross-project principles extracted during Synthesize phase.
Wiki-linked to evidence notes.

### methodology.md
How the agent approaches design work. Updated as the system learns.

## MOC Structure (`notes/mocs/`)

### hub.md
Top-level navigation linking to all domain MOCs and recent activity.

### Domain MOCs
One per design domain (color-systems, typography, components, layout, motion, brand).
Each links to relevant pattern/decision/principle notes.

Auto-updated during Synthesize phase.

## Files Changed (Plugin)

| File | Change |
|------|--------|
| `.claude-plugin/plugin.json` | Bump version, add new commands |
| `CLAUDE.md` | Add knowledge system routing rules |
| `hooks/hooks.json` | Replace with 4-hook system |
| `hooks/scripts/session-orient.sh` | New |
| `hooks/scripts/write-validate.sh` | New |
| `hooks/scripts/auto-commit.sh` | New |
| `hooks/scripts/session-capture.sh` | New |
| `skills/design-brain/SKILL.md` | Update with knowledge system workflow |
| `skills/setup/SKILL.md` | New — conversational setup |
| `commands/db-extract.md` | New |
| `commands/db-synthesize.md` | New |
| `commands/db-evolve.md` | New |
| `commands/db-verify.md` | New |
| `commands/db-pipeline.md` | New |
| `commands/db-export.md` | New |
| `commands/db-stats.md` | New |
| `commands/db-next.md` | New |

## Design Domains Supported

The system supports all four domains from inception:
- Web product design
- Brand & visual identity
- Multi-platform (mobile, print)
- Design systems engineering

Domain vocabulary and MOC structure adapt based on setup conversation.
