---
name: db-pipeline
description: Run the full processing pipeline — Extract → Synthesize → Evolve → Verify
argument-hint: "[--project <id>]"
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Design Brain Pipeline

Orchestrate the full knowledge processing pipeline on pending captures.

## Pipeline Phases

```
Capture (already done) → Extract → Synthesize → Evolve → Verify
```

## Procedure

### 1. Check queue

```bash
ls .design-brain/ops/queue/*.yaml 2>/dev/null
```

If no queue files exist, check for unextracted captures by scanning inspirations against notes.

If nothing is pending, report "Pipeline complete — no pending work" and exit.

### 2. Run Extract phase

For each pending item, run the extract workflow:

1. Read the inspiration file from `projects/<project>/inspirations/<inspo-id>.md`
2. Analyze colors, typography, components, motion, layout data
3. Generate pattern and decision notes in `notes/patterns/` and `notes/decisions/`
4. Each note gets frontmatter with `sources: ["[[<inspo-id>]]"]`, `confidence: emerging`
5. Update queue file: `extract: done`

Follow the full `/db-extract` procedure.

### 3. Run Synthesize phase

After all extractions complete:

1. Read all notes in `notes/`
2. Find connections (shared sources, tags, domains)
3. Add `## Related` wiki links between connected notes
4. Update domain MOCs in `notes/mocs/`
5. Update hub.md with activity entry
6. Update queue files: `synthesize: done`

Follow the full `/db-synthesize` procedure.

### 4. Run Evolve phase

After synthesis:

1. For each new note, find older notes it relates to
2. Update older notes with new wiki links and evidence
3. Upgrade confidence where warranted (emerging → established with 2+ sources)
4. Mark superseded decisions
5. Write session log to `ops/sessions/`
6. Update queue files: `evolve: done`

Follow the full `/db-evolve` procedure.

### 5. Run Verify phase

After evolution:

1. Check schema compliance on all notes
2. Verify all wiki links resolve
3. Check MOC coverage
4. Update `ops/maintenance.md` with findings
5. Update queue files: `verify: done`

Follow the full `/db-verify` procedure.

### 6. Final report

```markdown
## Pipeline Complete

| Phase | Items Processed | Notes Created | Links Added |
|-------|----------------|---------------|-------------|
| Extract | N captures | M patterns, K decisions | - |
| Synthesize | - | - | L connections |
| Evolve | - | P notes updated | Q links added |
| Verify | N notes checked | - | R issues found |

### New Knowledge
- [list of created pattern/decision note titles with wiki links]

### Health
- Schema: N/M pass
- Broken links: N
- Orphan notes: N
```

## Guidelines

- **Process all pending items in one pass** — Don't stop between phases
- **Log each phase** — Write status updates to queue files as you go
- **Fail gracefully** — If one capture fails extraction, continue with the next
- **Session log** — Write one combined session log for the whole pipeline run
