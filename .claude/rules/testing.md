---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "src/**/*.spec.ts"
  - "src/**/*.spec.tsx"
  - "src/test/**/*"
---

# Testing Rules

- Framework: Vitest with jsdom environment (configured in `vitest.config.ts`)
- Test files co-located with source or in `src/test/`
- Use `@testing-library/react` for component tests, `@testing-library/jest-dom` for matchers
- Mock `Tone.js` and `Three.js` in tests — they require browser APIs not available in jsdom
- Run single test files during development: `npx vitest run src/path/to/file.test.ts`
- Run full suite before committing: `npm run test`
- Prefer `userEvent` over `fireEvent` for realistic interaction simulation
- Test behavior, not implementation — don't assert on internal state
- Setup file at `src/test/setup.ts` runs before all tests
