---
name: lint-fix
description: Run ESLint with auto-fix on the project
allowed-tools: Bash(npx eslint *)
---

Lint and auto-fix the codebase:

1. If `$ARGUMENTS` specifies files, run: `npx eslint --fix $ARGUMENTS`
2. Otherwise run on entire project: `npx eslint --fix .`
3. Report:
   - Number of files checked
   - Issues auto-fixed
   - Remaining issues that need manual attention (with file paths and line numbers)
