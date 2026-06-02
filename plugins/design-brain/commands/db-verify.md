---
name: db-verify
description: Check schema compliance, link health, and MOC coverage of the knowledge system
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Design Brain Verify

Audit the knowledge system for schema compliance, broken links, and orphan notes.

## Procedure

### 1. Check schema compliance

Read all notes in `notes/patterns/`, `notes/decisions/`, `notes/principles/`:

```bash
ls .design-brain/notes/patterns/*.md .design-brain/notes/decisions/*.md .design-brain/notes/principles/*.md 2>/dev/null
```

For each note, parse YAML frontmatter and verify:

| Field | Required | Valid values |
|-------|----------|-------------|
| `type` | Yes | `pattern`, `decision`, `principle` |
| `title` | Yes | Non-empty string |
| `sources` | Yes | Array (can be empty) |
| `domains` | Yes | Array of: `web`, `brand`, `mobile`, `design-systems` |
| `tags` | Yes | Array |
| `confidence` | For patterns/principles | `emerging`, `established`, `canonical` |
| `status` | For decisions | `active`, `superseded`, `revisiting` |
| `created` | Yes | YYYY-MM-DD format |
| `updated` | Yes | YYYY-MM-DD format |

Report any notes with missing or invalid fields.

### 2. Verify wiki links

Scan all notes for `[[link-target]]` patterns:

```bash
grep -oh "\[\[[^]]*\]\]" .design-brain/notes/**/*.md 2>/dev/null
```

For each wiki link:
- If it matches an inspiration ID, check it exists in `projects/*/inspirations/`
- If it matches a note slug, check it exists in `notes/`
- Report broken links (targets that don't exist)

### 3. Check MOC coverage

Read all domain MOCs in `notes/mocs/`. For each note in `notes/`, check if it appears in at least one MOC.

Report **orphan notes** — notes not linked from any MOC.

### 4. Check source coverage

For each inspiration in `projects/*/inspirations/`, check if at least one note in `notes/` references it in `sources:`.

Report **unextracted captures** — inspirations with no notes pointing to them.

### 5. Check bidirectional links

For each `## Related` section, verify that links are bidirectional:
- If note A links to note B, note B should link to note A
- Report one-directional links

### 6. Update maintenance file

Write findings to `.design-brain/ops/maintenance.md`:

```markdown
# Maintenance

System health signals and pending work.

## Last Verified

YYYY-MM-DD HH:MM

## Queue Status

- Pending extractions: N
- Pending synthesis: N

## Issues

- [SCHEMA] <note-path>: missing field <field>
- [BROKEN_LINK] <note-path>: [[target]] not found
- [ORPHAN] <note-path>: not linked from any MOC
- [UNEXTRACTED] <inspo-id>: no notes reference this capture
- [ONE_WAY_LINK] <note-a> → <note-b>: link not reciprocated

## Health Score

N/M notes pass schema check
N broken links found
N orphan notes found
N unextracted captures
```

### 7. Update queue status

If queue files exist in `ops/queue/`, update `verify: pending` to `verify: done`.

### 8. Report

Present a summary table:

```
Schema compliance: N/M notes pass
Broken links: N found
Orphan notes: N (not in any MOC)
Unextracted captures: N
One-way links: N
```

If all checks pass, report "Knowledge system healthy."
If issues found, list the top issues and suggest fixes.

## Guidelines

- **Read-only by default** — This command only reads and reports. Only `ops/maintenance.md` is written.
- **Actionable output** — Every issue should suggest a specific fix
- **Severity levels** — Schema violations > broken links > orphan notes > one-way links
