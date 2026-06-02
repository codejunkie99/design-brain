---
name: db-evolve
description: Backward pass — update older notes with evidence from newer captures
argument-hint: "[--project <id>]"
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Design Brain Evolve

Backward pass: review older notes and update them with evidence from newer captures and notes.

## Procedure

### 1. Identify recent notes

Find notes created or updated in the last session (or since the last evolve):

```bash
# Find recently modified notes
find .design-brain/notes -name "*.md" -newer .design-brain/ops/maintenance.md 2>/dev/null
```

Or read `ops/sessions/` for the most recent session log to find which notes were created.

If no session log exists, read all notes and sort by `created:` date in frontmatter.

### 2. For each recent note

Read the note's frontmatter to get its `sources`, `domains`, and `tags`.

### 3. Search for older related notes

Find older notes that share sources, domains, or tags:

```bash
grep -rl "<shared-tag>" .design-brain/notes/patterns/ .design-brain/notes/decisions/ .design-brain/notes/principles/ 2>/dev/null
```

### 4. Update older notes with new evidence

For each older note that relates to a recent note:

**a) Add to `## Related` section:**

```markdown
## Related

- [[new-note-slug]] — New evidence: <brief description of connection>
```

**b) If the new note strengthens the older note's claim, consider upgrading confidence:**

- `emerging` → `established` when 2+ independent sources confirm the pattern
- `established` → `canonical` when evidence spans 3+ sources across different projects

Use `Edit` to update the `confidence:` field in frontmatter and add a note about why.

**c) Update the `updated:` date in frontmatter to today.**

### 5. Check for superseded decisions

If a newer decision contradicts an older one:
- Update the older decision's `status:` from `active` to `superseded`
- Add a note in the body: `> Superseded by [[newer-decision]] on YYYY-MM-DD`

### 6. Log session changes

Write a session log to `ops/sessions/YYYY-MM-DD-HH-MM-evolve.md`:

```markdown
# Evolve Session — YYYY-MM-DD HH:MM

## Notes Updated

- [[note-slug]] — Added connection to [[new-note]], updated confidence to established
- [[other-note]] — Added Related link to [[new-note]]

## Confidence Changes

- [[pattern-name]]: emerging → established (2 independent sources)

## Superseded Decisions

- [[old-decision]] superseded by [[new-decision]]
```

### 7. Update queue status

If queue files exist in `ops/queue/`, update `evolve: pending` to `evolve: done`.

### 8. Report

Summarize:
- Number of older notes updated
- Confidence upgrades made
- Decisions superseded
- Suggest running `/db-verify` to check health

## Guidelines

- **Evidence required** — Only upgrade confidence with genuine new evidence
- **Preserve author intent** — Don't change the core message of existing notes
- **Minimal edits** — Add links and update metadata, don't rewrite note bodies
- **Log everything** — Session logs are the audit trail for knowledge evolution
