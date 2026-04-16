---
name: test
description: Run the Vitest test suite and report results
allowed-tools: Bash(npx vitest *)
---

Run tests for the project:

1. If `$ARGUMENTS` specifies a file or pattern, run: `npx vitest run $ARGUMENTS`
2. Otherwise run the full suite: `npx vitest run`
3. Report:
   - Total tests passed/failed/skipped
   - Any failing test names and error messages
   - Suggest fixes for failures if the cause is obvious
