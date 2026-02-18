# Design Brain Knowledge System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform design-brain plugin into a full knowledge system with persistent memory, processing pipeline, hooks, and conversational setup.

**Architecture:** Three-space (self/notes/ops) inside .design-brain/, wiki-linked notes with frontmatter schema, 5-phase processing pipeline, 4 hooks, conversational setup.

**Tech Stack:** Claude Code plugin (markdown skills/commands/hooks), design-brain-memory CLI (Node.js/TypeScript)

---

## Milestone 1: Foundation

### Task 1: Create three-space directory scaffolding in init

**Files:**
- Modify: `src/commands.ts` (initBrain function)
- Modify: `src/render.ts` (renderAll creates dirs)

**Step 1: Update initBrain to create self/, notes/, ops/ directories**

In `src/commands.ts`, update `initBrain()` to create the knowledge system directories:

```typescript
export async function initBrain(rootDir: string): Promise<void> {
  await ensureBrainExists(rootDir);
  const db = await loadDatabase(rootDir);

  // Create knowledge system directories
  const root = brainRoot(rootDir);
  await fs.ensureDir(path.join(root, 'self'));
  await fs.ensureDir(path.join(root, 'notes', 'patterns'));
  await fs.ensureDir(path.join(root, 'notes', 'decisions'));
  await fs.ensureDir(path.join(root, 'notes', 'principles'));
  await fs.ensureDir(path.join(root, 'notes', 'mocs'));
  await fs.ensureDir(path.join(root, 'ops', 'queue'));
  await fs.ensureDir(path.join(root, 'ops', 'sessions'));

  await renderAll(rootDir, db);
}
```

**Step 2: Build and verify**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/commands.ts
git commit -m "feat: create knowledge system directories on init"
```

### Task 2: Create note schema templates

**Files:**
- Create: `plugins/design-brain/templates/pattern.md`
- Create: `plugins/design-brain/templates/decision.md`
- Create: `plugins/design-brain/templates/principle.md`

**Step 1: Create pattern template**

```markdown
---
type: pattern
title: "{{title}}"
sources: []
domains: []
tags: []
confidence: emerging
created: {{date}}
updated: {{date}}
---

## Pattern

{{description}}

## Evidence

<!-- Wiki links to inspirations that demonstrate this pattern -->

## Usage Guidance

<!-- When and how to apply this pattern -->
```

**Step 2: Create decision template**

**Step 3: Create principle template**

**Step 4: Commit**

### Task 3: Generate self/identity.md and MOC hub during init

**Files:**
- Modify: `src/commands.ts`
- Create: `src/knowledge.ts` — knowledge system helpers

**Step 1: Create src/knowledge.ts**

Functions:
- `generateIdentity(domains: string[], preferences: Record<string, string>): string`
- `generateMocHub(projects: ProjectRecord[]): string`
- `generateDomainMoc(domain: string, notes: NoteReference[]): string`
- `ensureKnowledgeDirs(rootDir: string): Promise<void>`

**Step 2: Call from initBrain**

**Step 3: Build and test**

**Step 4: Commit**

### Task 4: Create /design-brain:setup conversational skill

**Files:**
- Create: `plugins/design-brain/skills/setup/SKILL.md`

**Step 1: Write the setup skill**

4-phase flow:
1. Detect — check for existing .design-brain/
2. Understand — ask 2-3 questions about design practice
3. Generate — create self/, notes/mocs/, templates
4. Validate — verify all pieces exist

**Step 2: Commit**

### Task 5: Update plugin.json and CLAUDE.md

**Files:**
- Modify: `plugins/design-brain/.claude-plugin/plugin.json`
- Modify: `plugins/design-brain/CLAUDE.md`

**Step 1: Bump plugin version, add knowledge system description**

**Step 2: Update CLAUDE.md routing rules for knowledge system**

**Step 3: Commit**

---

## Milestone 2: Processing Pipeline

### Task 6: Create /db-extract command

**Files:**
- Create: `plugins/design-brain/commands/db-extract.md`

**Step 1: Write the extract skill**

Reads latest capture from a project, generates pattern/decision/principle note drafts:
- Scan `projects/<id>/inspirations/*.md` for unextracted captures
- For each, analyze colors/components/typography/layout data
- Generate pattern notes with frontmatter and wiki links back to source
- Write to `notes/patterns/`, `notes/decisions/`
- Mark capture as extracted in `ops/queue/`

**Step 2: Commit**

### Task 7: Create /db-synthesize command

**Files:**
- Create: `plugins/design-brain/commands/db-synthesize.md`

**Step 1: Write the synthesize skill**

Finds connections across notes and updates MOCs:
- Read all notes in `notes/`
- Find notes with overlapping tags/domains/sources
- Add wiki links between related notes
- Update domain MOCs with new entries
- Update hub.md

**Step 2: Commit**

### Task 8: Create /db-evolve command

**Files:**
- Create: `plugins/design-brain/commands/db-evolve.md`

**Step 1: Write the evolve skill**

Backward pass — updates older notes with new context:
- For each recently created note, find older notes it relates to
- Update older notes with new wiki links and evidence
- Update `updated` timestamp in frontmatter
- Log changes to ops/sessions/

**Step 2: Commit**

### Task 9: Create /db-verify command

**Files:**
- Create: `plugins/design-brain/commands/db-verify.md`

**Step 1: Write the verify skill**

Schema compliance + link health:
- Check all notes have valid frontmatter (type, title, sources, domains, tags)
- Verify wiki links resolve to existing files
- Check MOC coverage (notes not linked from any MOC)
- Report broken links, missing fields, orphan notes

**Step 2: Commit**

### Task 10: Create /db-pipeline command

**Files:**
- Create: `plugins/design-brain/commands/db-pipeline.md`

**Step 1: Write the pipeline orchestrator**

Runs Extract → Synthesize → Evolve → Verify in sequence:
- Check ops/queue/ for pending items
- For each, run phases in order
- Each phase spawns a fresh subagent
- Update queue status after each phase
- Report summary at end

**Step 2: Commit**

### Task 11: Create queue system

**Files:**
- Create: `plugins/design-brain/commands/db-next.md`
- Modify: capture flow to create queue entries

**Step 1: Update db-capture to create queue entries**

After capture, write a queue file to `ops/queue/<inspo-id>.yaml`:
```yaml
source: inspo-stripe-83d215b7
project: test
status: pending
phases:
  extract: pending
  synthesize: pending
  evolve: pending
  verify: pending
created: 2026-02-18
```

**Step 2: Create /db-next command**

Reads queue, finds highest-priority unprocessed item, recommends next action.

**Step 3: Commit**

---

## Milestone 3: Automation

### Task 12: Create session-orient hook

**Files:**
- Create: `plugins/design-brain/hooks/scripts/session-orient.sh`
- Modify: `plugins/design-brain/hooks/hooks.json`

**Step 1: Write session-orient script**

On SessionStart:
- Load self/identity.md content
- Count pending queue items
- Surface maintenance signals from ops/maintenance.md
- Show recent session summary

**Step 2: Register in hooks.json**

**Step 3: Commit**

### Task 13: Create write-validate hook

**Files:**
- Create: `plugins/design-brain/hooks/scripts/write-validate.sh`
- Modify: `plugins/design-brain/hooks/hooks.json`

**Step 1: Write validation script**

On PostToolUse (Write) for files matching `notes/**/*.md`:
- Parse YAML frontmatter
- Check required fields: type, title, created, updated
- Check type is one of: pattern, decision, principle
- Warn if sources is empty
- Warn if domains is empty

**Step 2: Register in hooks.json**

**Step 3: Commit**

### Task 14: Create auto-commit hook

**Files:**
- Create: `plugins/design-brain/hooks/scripts/auto-commit.sh`
- Modify: `plugins/design-brain/hooks/hooks.json`

**Step 1: Write auto-commit script**

On PostToolUse (Write) async for files matching `.design-brain/**`:
- git add the changed file
- git commit with descriptive message

**Step 2: Register in hooks.json**

**Step 3: Commit**

### Task 15: Create session-capture hook

**Files:**
- Create: `plugins/design-brain/hooks/scripts/session-capture.sh`
- Modify: `plugins/design-brain/hooks/hooks.json`

**Step 1: Write session capture script**

On Stop:
- Generate session summary (captures made, notes created, connections found)
- Write to ops/sessions/YYYY-MM-DD-HH-MM.md
- Update ops/maintenance.md with any signals

**Step 2: Register in hooks.json**

**Step 3: Commit**

### Task 16: Create /db-stats and /db-export commands

**Files:**
- Create: `plugins/design-brain/commands/db-stats.md`
- Create: `plugins/design-brain/commands/db-export.md`

**Step 1: Write db-stats**

Report vault metrics: note count by type, connection count, MOC coverage, queue status, sessions.

**Step 2: Write db-export**

Wrapper around `design-brain-memory export --project <id> --format tailwind`.

**Step 3: Commit**

### Task 17: Final integration and validation

**Step 1: Update plugin.json with all new commands**

**Step 2: Update CLAUDE.md with full routing rules**

**Step 3: Update main skill SKILL.md with knowledge system workflow**

**Step 4: Test full flow: init → setup → capture → pipeline → stats**

**Step 5: Commit and push**
