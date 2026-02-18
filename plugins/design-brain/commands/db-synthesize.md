---
name: db-synthesize
description: Find connections across design notes and update Maps of Content
argument-hint: "[--project <id>]"
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Design Brain Synthesize

Find connections across notes, add wiki links between related notes, and update Maps of Content.

## Procedure

### 1. Read all notes

Scan the knowledge graph:

```bash
ls .design-brain/notes/patterns/*.md 2>/dev/null
ls .design-brain/notes/decisions/*.md 2>/dev/null
ls .design-brain/notes/principles/*.md 2>/dev/null
```

Read each note file and parse its YAML frontmatter (type, title, sources, domains, tags, confidence/status).

### 2. Build connection index

For each pair of notes, check for relationships:

- **Shared sources** — Two notes referencing the same `[[inspo-id]]` are related
- **Shared domains** — Notes in the same domain (e.g., both tagged `web`)
- **Shared tags** — Notes with overlapping tags
- **Complementary types** — A pattern and a decision about the same topic

Score connections: shared source = strong, shared domain + shared tag = moderate, shared tag only = weak.

### 3. Add wiki links to notes

For each note with strong or moderate connections, add a `## Related` section at the bottom (or update it if it exists):

```markdown
## Related

- [[related-note-slug]] — Shared source from [[inspo-id]], both address color contrast
- [[another-note]] — Both tagged `typography`, complementary approaches
```

Use `Edit` tool to add the Related section. Never duplicate links already present.

### 4. Update domain MOCs

For each domain MOC at `.design-brain/notes/mocs/<domain>.md`:

Read the current MOC. Under `## Patterns`, `## Decisions`, and `## Principles`, add wiki links to any notes that have that domain in their `domains:` frontmatter.

Format:

```markdown
## Patterns

- [[pattern-slug]] — Pattern title (confidence: emerging) — from [[inspo-id]]
```

Remove the placeholder `- No notes yet` / `- No decisions yet` / `- No principles yet` when adding real entries.

### 5. Update hub.md

At `.design-brain/notes/mocs/hub.md`, update the `## Recent Activity` section:

```markdown
## Recent Activity

- YYYY-MM-DD: Synthesized N connections across M notes
- Previous entry...
```

Keep only the last 10 activity entries.

### 6. Check for principle promotion

If a pattern has 3+ independent sources (different inspirations), suggest promoting it to a principle:

```markdown
**Promotion candidate:** [[pattern-name]] has evidence from 3+ sources.
Consider creating a principle note with `/db-extract` or manually at
.design-brain/notes/principles/<principle-slug>.md
```

### 7. Update queue status

If queue files exist in `ops/queue/`, update `synthesize: pending` to `synthesize: done`.

### 8. Report

Summarize:
- Number of connections found
- Number of wiki links added
- MOCs updated
- Principle promotion candidates
- Suggest running `/db-evolve` to update older notes

## Guidelines

- **Don't force connections** — Only link notes with genuine relationships
- **Bidirectional links** — If A links to B, B should link to A
- **MOC entries should be sorted** — By confidence level (canonical > established > emerging)
- **Preserve existing content** — Only add, never remove existing links or text
