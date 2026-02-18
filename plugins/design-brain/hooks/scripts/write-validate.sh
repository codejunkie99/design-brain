#!/usr/bin/env bash
# Design Brain write-validate hook
# Fires on PostToolUse (Write) for notes/**/*.md
# Validates YAML frontmatter has required fields

FILE_PATH="$TOOL_USE_INPUT_FILE_PATH"

# Only validate files in .design-brain/notes/
case "$FILE_PATH" in
  *.design-brain/notes/*.md) ;;
  *) exit 0 ;;
esac

if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Read frontmatter (between --- markers)
FRONTMATTER=$(sed -n '/^---$/,/^---$/p' "$FILE_PATH" | sed '1d;$d')

if [ -z "$FRONTMATTER" ]; then
  echo "WARNING: Note missing YAML frontmatter: $FILE_PATH"
  echo "Required fields: type, title, sources, domains, tags, created, updated"
  exit 0
fi

WARNINGS=""

# Check required fields
for FIELD in type title sources domains tags created updated; do
  if ! echo "$FRONTMATTER" | grep -q "^${FIELD}:"; then
    WARNINGS="${WARNINGS}Missing field: ${FIELD}\n"
  fi
done

# Check type value
TYPE=$(echo "$FRONTMATTER" | grep "^type:" | sed 's/^type: *//')
case "$TYPE" in
  pattern|decision|principle) ;;
  *) WARNINGS="${WARNINGS}Invalid type: '${TYPE}' (must be pattern, decision, or principle)\n" ;;
esac

# Check confidence for patterns/principles
if [ "$TYPE" = "pattern" ] || [ "$TYPE" = "principle" ]; then
  if ! echo "$FRONTMATTER" | grep -q "^confidence:"; then
    WARNINGS="${WARNINGS}Missing confidence field (required for ${TYPE})\n"
  fi
fi

# Check status for decisions
if [ "$TYPE" = "decision" ]; then
  if ! echo "$FRONTMATTER" | grep -q "^status:"; then
    WARNINGS="${WARNINGS}Missing status field (required for decisions)\n"
  fi
fi

# Check for empty sources (warn, don't block)
SOURCES=$(echo "$FRONTMATTER" | grep "^sources:" | sed 's/^sources: *//')
if [ "$SOURCES" = "[]" ]; then
  WARNINGS="${WARNINGS}Hint: sources is empty — link to inspiration with [[inspo-id]]\n"
fi

if [ -n "$WARNINGS" ]; then
  echo "Design Brain note validation for $(basename "$FILE_PATH"):"
  printf "$WARNINGS"
fi
