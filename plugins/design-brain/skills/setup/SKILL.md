---
name: setup
description: Conversational onboarding that generates a personalized design knowledge system. Asks about your design practice, then creates identity, methodology, MOCs, and processing pipeline.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

# Design Brain Setup

Generate a personalized design knowledge system through conversation.

## When to use

- First time setting up design-brain in a workspace
- Re-initializing after changing design focus
- Adding to a workspace that already has `.design-brain/` from CLI captures

## 4-Phase Flow

### Phase 1: Detect

Check the current state of the workspace:

```bash
ls -la .design-brain/ 2>/dev/null
```

Determine:
- Does `.design-brain/` exist?
- Are there existing projects/captures?
- Are knowledge system files (self/, notes/, ops/) already present?

Report findings to the user:
- "Found existing design brain with N projects and M inspirations" or
- "No design brain found, starting fresh"

### Phase 2: Understand

Ask 2-3 questions about the user's design practice. Use AskUserQuestion with multiple choice.

**Question 1: Design domains**
"What design domains do you work in?"
Options (multiSelect: true):
- Web product design (SaaS, dashboards, landing pages)
- Brand & visual identity (logos, guidelines, color systems)
- Mobile & native apps
- Design systems engineering (tokens, components, Figma-to-code)

**Question 2: Primary focus**
"What's your main goal with design-brain?"
Options:
- Competitive analysis (study what others build)
- Design system development (extract patterns into reusable systems)
- Inspiration library (collect and organize reference material)
- Cross-project knowledge (track decisions and principles across projects)

**Question 3 (optional, based on Q2):**
If design system development or cross-project knowledge:
"What tools and frameworks do you primarily use?"
Options (multiSelect: true):
- Tailwind CSS
- Figma
- Storybook
- Custom design system

### Phase 3: Generate

Based on answers, run the following commands:

1. Initialize the brain if not present:
```bash
design-brain-memory init --root .
```

2. Generate identity file at `.design-brain/self/identity.md`:
- Include selected domains
- Include focus description
- Include tools if provided

3. Generate methodology at `.design-brain/self/methodology.md`

4. Generate MOC hub at `.design-brain/notes/mocs/hub.md`

5. Generate domain MOCs for each selected domain at `.design-brain/notes/mocs/<domain>.md`

6. Generate maintenance file at `.design-brain/ops/maintenance.md`

7. If existing captures exist, update MOC hub with project links

**Important:** Use the `generateIdentity`, `generateMethodology`, `generateMocHub`, `generateDomainMoc`, and `generateMaintenance` functions from the `design-brain-memory` package. These are available via:

```bash
design-brain-memory reindex --root .
```

This will auto-generate all knowledge system files with sensible defaults. After reindex, update the identity file with the user's specific answers.

### Phase 4: Validate

Verify all pieces exist:

```bash
ls .design-brain/self/identity.md
ls .design-brain/self/methodology.md
ls .design-brain/notes/mocs/hub.md
ls .design-brain/notes/mocs/color-systems.md
ls .design-brain/notes/mocs/typography.md
ls .design-brain/notes/mocs/components.md
ls .design-brain/notes/mocs/layout.md
ls .design-brain/notes/mocs/motion.md
ls .design-brain/notes/mocs/brand.md
ls .design-brain/ops/maintenance.md
ls .design-brain/notes/patterns/
ls .design-brain/notes/decisions/
ls .design-brain/notes/principles/
ls .design-brain/ops/queue/
ls .design-brain/ops/sessions/
```

Report results:
- "Knowledge system ready! Created N files across self/, notes/, ops/"
- List the key files created
- Suggest next steps: "Run `/db-capture` to ingest your first inspiration, then `/db-extract` to generate pattern notes"

## Output

After setup completes, the workspace should have:

```
.design-brain/
├── self/
│   ├── identity.md          # Personalized to user's answers
│   └── methodology.md       # Standard pipeline description
├── notes/
│   ├── patterns/            # Empty, ready for extraction
│   ├── decisions/           # Empty, ready for decisions
│   ├── principles/          # Empty, ready for principles
│   └── mocs/
│       ├── hub.md           # Links to all domain MOCs and projects
│       ├── color-systems.md
│       ├── typography.md
│       ├── components.md
│       ├── layout.md
│       ├── motion.md
│       └── brand.md
├── ops/
│   ├── queue/               # Empty, ready for pipeline tasks
│   ├── sessions/            # Empty, ready for session logs
│   └── maintenance.md       # Initial health status
├── projects/                # Existing or empty
├── graph/                   # Existing or empty
└── database.json            # Existing or fresh
```
