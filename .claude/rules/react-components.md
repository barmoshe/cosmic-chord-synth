---
paths:
  - "src/components/**/*.tsx"
  - "src/components/**/*.ts"
---

# React Component Rules

- Functional components only with TypeScript — no class components
- One component per file; filename matches component name (PascalCase)
- Props interface defined above component: `interface FooProps { ... }`
- Event handlers prefixed with `handle`: `handleClick`, `handleChange`
- Extract reusable logic into custom hooks (`use*.ts`) in `biome-synth/hooks/` or `hooks/`
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- shadcn/ui components live in `components/ui/` — import from `@/components/ui/*`
- Avoid inline styles; use Tailwind utilities exclusively
- Memoize expensive computations with `useMemo`, callbacks with `useCallback`
- Cleanup all subscriptions, timers, and listeners in `useEffect` return
