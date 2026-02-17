# design-brain-memory

A relational markdown design brain that uses **Agent Browser CLI** for capture and supports **bring-your-own LLM** via base URL + API key.

## What it does

- Capture inspirations from URLs and screenshots.
- Extract colors, typography, components, motion, layout, CSS variables.
- Add responsive coverage via multiple viewports.
- Capture interaction state signals (`hover`, `focus`, `active`) from runtime + CSS rules.
- Capture journey steps by click-through exploration.
- Build version lineage (`fingerprint`, `version`, `supersedes`, diffs).
- Store everything in `.design-brain/` (markdown + graph CSV).
- Query with `search` (keyword) and `ask` (semantic; optional LLM).

## Install

```bash
npm install -g design-brain-memory
agent-browser install
```

Install directly from GitHub:

```bash
npm install -g github:design-brain/design-brain
```

## Install as a skill

```bash
design-brain-memory install-skill
```

or

```bash
npx -y skills add design-brain/design-brain
```

`ingest` will also suggest this once in interactive terminals.

## Bring your own LLM

Set once:

```bash
export DESIGN_BRAIN_LLM_BASE_URL="https://api.openai.com/v1"
export DESIGN_BRAIN_LLM_API_KEY="<your-api-key>"
export DESIGN_BRAIN_LLM_MODEL="gpt-4o-mini"
```

Or pass per command:

```bash
--llm-base-url <url> --llm-api-key <key> --llm-model <model>
```

Any OpenAI-compatible endpoint works.

## Commands

### Initialize

```bash
design-brain-memory init --root /path/to/workspace
```

### Ingest URL inspiration

```bash
design-brain-memory ingest \
  --project checkout-redesign \
  --project-name "Checkout Redesign" \
  --url https://stripe.com \
  --name "Stripe checkout inspiration" \
  --inspiration "Button hierarchy + neutral surfaces" \
  --journey-steps 4 \
  --viewport desktop=1440x1200 tablet=1024x1366 mobile=390x844 \
  --tags payments,checkout,cta
```

### Ingest screenshot inspiration

```bash
design-brain-memory ingest \
  --project checkout-redesign \
  --screenshot ./screens/inspo-hero.png \
  --name "Hero screenshot" \
  --tags hero,landing
```

### Record outcome

```bash
design-brain-memory outcome \
  --project checkout-redesign \
  --title "v1 shipped" \
  --description "Shipped card-based checkout with clear primary CTA" \
  --inspired-by inspo-stripe-checkout-1234abcd \
  --artifact-url https://app.example.com/checkout \
  --tags shipped,frontend
```

### Search

```bash
design-brain-memory search --query "button hierarchy" --project checkout-redesign
```

### Ask

```bash
design-brain-memory ask --query "What CTA patterns repeated across inspirations?" --project checkout-redesign
```

### Reindex

```bash
design-brain-memory reindex
```

### Prompt control

Use `-y` / `--yes` to skip interactive prompts in local scripts and CI.

## Output structure

```
.design-brain/
├── README.md
├── database.json
├── graph/
│   ├── entities.csv
│   └── relations.csv
├── assets/
│   └── <project-id>/*.png
└── projects/
    └── <project-id>/
        ├── README.md
        ├── index.md
        ├── inspirations/*.md
        ├── outcomes/*.md
        └── tokens/
            ├── colors.md
            ├── typography.md
            ├── components.md
            ├── motion.md
            └── layout.md
```

## Retrieval examples

```bash
rg "supersedes|inspired_by" .design-brain/graph/relations.csv
rg "Interaction States|Responsive Coverage" .design-brain/projects
rg "fingerprint" .design-brain/projects/*/inspirations/*.md
```

## Notes

- Browser usage follows Agent Browser CLI patterns from the upstream README (`open`, `set viewport`, `snapshot`, `click`, `hover`, `focus`, `eval`, `screenshot`, `back`, `close`).
- If `agent-browser` is not globally installed, the CLI falls back to `npx agent-browser`.
