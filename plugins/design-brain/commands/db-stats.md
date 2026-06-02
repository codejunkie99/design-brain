---
name: db-stats
description: Report design brain vault metrics — note counts, connections, queue status, health
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Design Brain Stats

Report vault metrics and knowledge system health.

## Procedure

### 1. Count notes by type

```bash
ls .design-brain/notes/patterns/*.md 2>/dev/null | wc -l
ls .design-brain/notes/decisions/*.md 2>/dev/null | wc -l
ls .design-brain/notes/principles/*.md 2>/dev/null | wc -l
```

### 2. Count captures

```bash
ls .design-brain/projects/*/inspirations/*.md 2>/dev/null | wc -l
ls .design-brain/projects/*/outcomes/*.md 2>/dev/null | wc -l
```

### 3. Count connections

```bash
grep -roh "\[\[[^]]*\]\]" .design-brain/notes/ 2>/dev/null | wc -l
```

### 4. Queue status

```bash
ls .design-brain/ops/queue/*.yaml 2>/dev/null | wc -l
grep -rl "extract: pending" .design-brain/ops/queue/ 2>/dev/null | wc -l
```

### 5. MOC coverage

Count notes listed in MOCs vs total notes.

### 6. Session history

```bash
ls .design-brain/ops/sessions/*.md 2>/dev/null | wc -l
ls -t .design-brain/ops/sessions/*.md 2>/dev/null | head -3
```

### 7. Present report

```markdown
## Design Brain Stats

| Metric | Count |
|--------|-------|
| Patterns | N |
| Decisions | N |
| Principles | N |
| Inspirations | N |
| Outcomes | N |
| Wiki links | N |
| Queue pending | N |
| Sessions logged | N |

### Confidence Distribution
- Canonical: N
- Established: N
- Emerging: N

### Projects
- Project A: N inspirations, M outcomes
- Project B: ...

### Health
[Read and include last verify results from ops/maintenance.md]
```

## Guidelines

- **Read-only** — This command only reads, never writes
- **Fast** — Use bash counting rather than reading every file
