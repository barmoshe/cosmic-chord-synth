#!/bin/bash
# PreToolUse hook: block destructive or sensitive Bash commands
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Block destructive patterns
if echo "$COMMAND" | grep -qE '(rm\s+-rf\s+[/~]|sudo\s|chmod\s+777|>\s*/dev/|mkfs|dd\s+if=)'; then
  echo "BLOCKED: Destructive command detected: $COMMAND" >&2
  exit 2
fi

# Block edits to lock files via shell
if echo "$COMMAND" | grep -qE '(>\s*(package-lock|bun\.lock|yarn\.lock))'; then
  echo "BLOCKED: Direct modification of lock files" >&2
  exit 2
fi

exit 0
