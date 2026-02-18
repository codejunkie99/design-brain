#!/usr/bin/env bash
# Design Brain session orientation hook
# Fires on SessionStart — loads identity context and queue status

BRAIN=".design-brain"

if [ ! -d "$BRAIN" ]; then
  echo "No design brain found in this workspace. Run /design-brain:setup to initialize."
  exit 0
fi

echo "=== Design Brain Session Context ==="
echo ""

# Identity summary
if [ -f "$BRAIN/self/identity.md" ]; then
  # Extract focus line
  FOCUS=$(grep -A1 "## Focus" "$BRAIN/self/identity.md" 2>/dev/null | tail -1)
  if [ -n "$FOCUS" ]; then
    echo "Focus: $FOCUS"
  fi
fi

# Count notes
PATTERNS=$(ls "$BRAIN/notes/patterns/"*.md 2>/dev/null | wc -l | tr -d ' ')
DECISIONS=$(ls "$BRAIN/notes/decisions/"*.md 2>/dev/null | wc -l | tr -d ' ')
PRINCIPLES=$(ls "$BRAIN/notes/principles/"*.md 2>/dev/null | wc -l | tr -d ' ')
echo "Knowledge: ${PATTERNS} patterns, ${DECISIONS} decisions, ${PRINCIPLES} principles"

# Count projects and inspirations
PROJECTS=$(ls -d "$BRAIN/projects/"*/ 2>/dev/null | wc -l | tr -d ' ')
INSPOS=$(ls "$BRAIN/projects/"*/inspirations/*.md 2>/dev/null | wc -l | tr -d ' ')
echo "Captures: ${INSPOS} inspirations across ${PROJECTS} projects"

# Queue status
PENDING=$(grep -rl "status: pending" "$BRAIN/ops/queue/" 2>/dev/null | wc -l | tr -d ' ')
if [ "$PENDING" -gt 0 ]; then
  echo ""
  echo "** ${PENDING} pending queue items — run /db-pipeline or /db-next **"
fi

# Maintenance signals
if [ -f "$BRAIN/ops/maintenance.md" ]; then
  ISSUES=$(grep -c "^\- \[" "$BRAIN/ops/maintenance.md" 2>/dev/null || echo "0")
  if [ "$ISSUES" -gt 0 ]; then
    echo "Maintenance: ${ISSUES} signals in ops/maintenance.md"
  fi
fi

# Last session
LAST_SESSION=$(ls -t "$BRAIN/ops/sessions/"*.md 2>/dev/null | head -1)
if [ -n "$LAST_SESSION" ]; then
  LAST_DATE=$(basename "$LAST_SESSION" .md | cut -d- -f1-3)
  echo "Last session: $LAST_DATE"
fi

echo ""
echo "=== End Design Brain Context ==="
