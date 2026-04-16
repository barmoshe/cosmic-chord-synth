---
name: build-check
description: Run TypeScript typecheck and production build to verify no errors
allowed-tools: Bash(npx tsc *) Bash(npm run build)
---

Verify the project builds cleanly:

1. Run TypeScript type checking: `npx tsc --noEmit`
2. If typecheck passes, run production build: `npm run build`
3. Report:
   - Any type errors (with file, line, and error message)
   - Build warnings or errors
   - Bundle size if available in build output
   - Overall status: PASS or FAIL
