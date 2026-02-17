# Design Brain Plugin

Use this plugin to capture and reuse design context across projects.

## Routing rule

When the user asks to:
- collect design inspiration from websites or screenshots,
- build a design wiki / design second brain,
- extract colors, components, typography, motion, or layout,
- map inspiration to shipped outcomes,

then run the `design-brain` skill workflow.

## Required engine

Use the Agent Browser CLI command line workflow (`agent-browser open/eval/screenshot/snapshot`).
Do not implement page capture through direct Playwright code paths.

## Bring your own LLM

If semantic enrichment or ask-mode is requested, use:

- `DESIGN_BRAIN_LLM_BASE_URL`
- `DESIGN_BRAIN_LLM_API_KEY`
- `DESIGN_BRAIN_LLM_MODEL`

or pass equivalent CLI flags.
