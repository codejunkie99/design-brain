---
name: db-next
description: Show the next pending item in the processing queue and recommend an action
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Design Brain Next

Show the next pending item in the knowledge processing queue.

## Procedure

### 1. Check queue

```bash
ls .design-brain/ops/queue/*.yaml 2>/dev/null
```

### 2. If queue files exist

Read each YAML file and find items with pending phases. Priority order:

1. Items with `extract: pending` (newest first)
2. Items with `synthesize: pending`
3. Items with `evolve: pending`
4. Items with `verify: pending`

### 3. If no queue files

Check for unextracted captures:

```bash
ls .design-brain/projects/*/inspirations/*.md 2>/dev/null
```

Cross-reference with notes that reference them:

```bash
grep -rl "sources:" .design-brain/notes/ 2>/dev/null
```

### 4. Report

```markdown
## Next Action

**Item:** <inspo-id> (<inspo-name>) from project <project-id>
**Next phase:** Extract | Synthesize | Evolve | Verify
**Captured:** YYYY-MM-DD

**Run:** `/db-extract --project <project-id>` (or `/db-pipeline` for full processing)
```

If nothing is pending:

```markdown
## Queue Empty

All captures have been fully processed.

- Total notes: N patterns, M decisions, K principles
- Last verified: YYYY-MM-DD
- Knowledge system health: [read from ops/maintenance.md]

**Next steps:**
- Capture new inspiration with `/db-capture`
- Review knowledge with `/db-search`
- Export tokens with `/db-export`
```
