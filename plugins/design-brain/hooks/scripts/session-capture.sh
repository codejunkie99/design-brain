#!/usr/bin/env bash
# Design Brain session-capture hook
# Fires on Stop — counts what changed during this session

BRAIN=".design-brain"

if [ ! -d "$BRAIN" ]; then
  exit 0
fi

# Count recently modified files (within last 2 hours)
RECENT_NOTES=$(find "$BRAIN/notes" -name "*.md" -newer "$BRAIN/ops/maintenance.md" 2>/dev/null | wc -l | tr -d ' ')
RECENT_QUEUE=$(find "$BRAIN/ops/queue" -name "*.yaml" 2>/dev/null | wc -l | tr -d ' ')

if [ "$RECENT_NOTES" -eq 0 ] && [ "$RECENT_QUEUE" -eq 0 ]; then
  exit 0
fi

# Generate session filename
SESSION_FILE="$BRAIN/ops/sessions/$(date +%Y-%m-%d-%H-%M)-session.md"
mkdir -p "$BRAIN/ops/sessions"

# Build session log
{
  echo "# Session — $(date +%Y-%m-%d\ %H:%M)"
  echo ""
  echo "## Activity"
  echo ""

  if [ "$RECENT_NOTES" -gt 0 ]; then
    echo "### Notes Modified"
    echo ""
    find "$BRAIN/notes" -name "*.md" -newer "$BRAIN/ops/maintenance.md" 2>/dev/null | while read -r f; do
      echo "- $(basename "$f" .md)"
    done
    echo ""
  fi

  # Count new captures
  NEW_INSPOS=$(find "$BRAIN/projects" -name "*.md" -path "*/inspirations/*" -newer "$BRAIN/ops/maintenance.md" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$NEW_INSPOS" -gt 0 ]; then
    echo "### Captures"
    echo ""
    echo "- $NEW_INSPOS new inspirations captured"
    echo ""
  fi

  echo "## Summary"
  echo ""
  echo "- Notes touched: $RECENT_NOTES"
  echo "- Queue items: $RECENT_QUEUE"
} > "$SESSION_FILE"

echo "Session log written to $SESSION_FILE"
