---
name: db-component-graph
description: Generate component relationship graph for a project
argument-hint: "<project-id>"
allowed-tools:
  - Bash
  - Read
---

# Design Brain Component Graph

Generate a component relationship graph from captured inspirations.

## Usage

```bash
design-brain-memory component-graph --project "$1"
```

## Output

Writes `.design-brain/projects/<project>/component-graph.md` with:
- Component co-occurrence pairs
- Parent/child relationships inferred from selectors
- Frequency and centrality indicators

After running, read the graph file and summarize the most central components.
