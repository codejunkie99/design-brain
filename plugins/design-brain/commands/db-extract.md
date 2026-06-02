---
name: db-extract
description: Extract pattern and decision notes from captured design inspirations
argument-hint: "[--project <id>]"
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Design Brain Extract

Extract reusable pattern and decision notes from captured design inspirations.

## Procedure

### 1. Find unextracted captures

Check the queue for pending extractions:

```bash
ls .design-brain/ops/queue/*.yaml 2>/dev/null
```

If no queue files exist, scan all inspirations and check which ones already have notes:

```bash
ls .design-brain/projects/*/inspirations/*.md
```

Cross-reference with existing notes:

```bash
grep -rl "sources:" .design-brain/notes/patterns/ .design-brain/notes/decisions/ 2>/dev/null
```

A capture is "unextracted" if no note in `notes/` lists it in `sources:`.

### 2. For each unextracted capture

Read the inspiration markdown file to analyze its design data:

```
.design-brain/projects/<project>/inspirations/<inspo-id>.md
```

### 3. Generate pattern notes

For each significant design observation, create a pattern note at:

```
.design-brain/notes/patterns/<pattern-slug>.md
```

Use this frontmatter schema:

```yaml
---
type: pattern
title: "<descriptive title>"
sources: ["[[<inspo-id>]]"]
domains: [<relevant domains from: web, brand, mobile, design-systems>]
tags: [<relevant tags>]
confidence: emerging
created: <today YYYY-MM-DD>
updated: <today YYYY-MM-DD>
---
```

**What to extract as patterns:**

- **Color patterns**: Dominant palette strategy (monochrome, complementary, analogous), contrast approach, dark/light theme usage. Look at the Colors table and CSS Variables.
- **Typography patterns**: Font pairing strategy, scale/hierarchy, weight usage. Look at the Typography table.
- **Component patterns**: Recurring component types (cards, buttons, navigation), layout patterns within components. Look at the Components table.
- **Motion patterns**: Transition strategy (duration ranges, easing curves), animation patterns. Look at the Motion table, Keyframes section.
- **Layout patterns**: Grid approach, spacing rhythm, responsive strategy. Look at the Layout table.

Each pattern note body should include:
- `## Pattern` — What was observed
- `## Evidence` — Wiki links to source inspirations with specific data points
- `## Usage Guidance` — When and how to apply this pattern

### 4. Generate decision notes

For notable design choices that represent deliberate decisions:

```
.design-brain/notes/decisions/<decision-slug>.md
```

```yaml
---
type: decision
title: "<what was decided>"
sources: ["[[<inspo-id>]]"]
domains: [<relevant domains>]
tags: [<relevant tags>]
status: active
created: <today YYYY-MM-DD>
updated: <today YYYY-MM-DD>
---
```

Decision note body should include:
- `## Decision` — What choice was made
- `## Rationale` — Why this approach (inferred from the design data)
- `## Alternatives` — What other approaches could work
- `## Evidence` — Wiki links to source data

### 5. Update queue status

If queue files exist, update the phase status:

Read the queue YAML, change `extract: pending` to `extract: done`, and write it back.

### 6. Report

Summarize what was extracted:
- Number of patterns created
- Number of decisions created
- Wiki links to the new notes
- Suggest running `/db-synthesize` to find connections

## Guidelines

- **One concept per note** — Don't pack multiple patterns into one note
- **Specific over vague** — "High-contrast button hover using 200ms ease-out" not "Button styling"
- **Evidence-backed** — Every claim links to source data
- **3-7 notes per capture** is typical — more for rich captures, fewer for simple ones
- **Never overwrite existing notes** — If a pattern file already exists, skip it or append new sources
