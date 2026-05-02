# stnyth2 — Handoff

## What this is

A new sub-project temporarily living inside the `cosmic-chord-synth` repo. Right now it ships only:

- A tasteful **loading screen** (centered animated SVG mark + a 7-letter staggered label + a 120px progress line, ~1.6s ease-out).
- A minimal dark **landing page** (project name, tagline, single ghost CTA).

The goal of this scaffold is to act as an empty, portable shell that will be moved into its own repository soon. Nothing here depends on the synth app.

## Run it here

```bash
npm run dev
# then open http://localhost:8080/stnyth2
```

The route is registered alongside the existing `/` (synth landing) and `/play` (synth) routes — those are untouched.

## File map

```
src/stnyth2/
├── HANDOFF.md                 ← this file
├── Stnyth2App.tsx             ← orchestrates loader → landing handoff
├── styles.ts                  ← keyframes + palette tokens (CSS-in-JS)
├── components/
│   ├── LoadingScreen.tsx      ← splash: animated mark + label + progress line
│   └── Landing.tsx            ← minimal landing screen (title, tagline, CTA)
└── hooks/
    └── useBootSequence.ts     ← RAF-driven 0→100 progress + ready signal

src/pages/
└── Stnyth2.tsx                ← thin route wrapper for App.tsx
```

## Behavior

- `useBootSequence` runs a single `requestAnimationFrame` loop, easing 0 → 100 over **1600ms** (`easeOutCubic`).
- When `ready` flips true, `LoadingScreen` fades out over **350ms** while `Landing` fades in.
- After the fade, the loader unmounts entirely (no leftover DOM).
- Honors `prefers-reduced-motion`: skips the RAF loop and jumps straight to ready.

## Dependencies used

| Dep | Why |
|---|---|
| `react` | Components + hooks |
| `react-router-dom` | Only the route wrapper in `src/pages/Stnyth2.tsx` (not used inside `src/stnyth2/` itself) |
| `tailwindcss` | All layout/typography classes |
| `clsx` + `tailwind-merge` | The `cn()` helper from `@/lib/utils` (used in `LoadingScreen.tsx`) |

**Not used:** Tone.js, Three.js, shadcn/ui, react-query, any synth-app code. The `src/stnyth2/` folder is fully self-contained.

## How to extract to its own repo

1. **Copy the folder**
   ```bash
   cp -r src/stnyth2 <new-repo>/src/stnyth2
   ```
2. **Replace the import of `cn`** — the only `@/lib/utils` reference is in `src/stnyth2/components/LoadingScreen.tsx`. Either:
   - Recreate the same `cn()` helper in the new repo (`clsx` + `tailwind-merge`), or
   - Inline the className concatenation (it's just a `pointer-events-none`/`opacity-0` toggle).
3. **Wire it as the root of the new app:**
   ```tsx
   // new repo's src/main.tsx
   import { createRoot } from "react-dom/client";
   import Stnyth2App from "./stnyth2/Stnyth2App";
   import "./index.css";

   createRoot(document.getElementById("root")!).render(<Stnyth2App />);
   ```
   No router needed unless the new repo grows multiple pages.
4. **Minimal `package.json` deps:**
   ```json
   {
     "react": "^18",
     "react-dom": "^18",
     "clsx": "^2",
     "tailwind-merge": "^2",
     "tailwindcss": "^3"
   }
   ```
   Plus a Vite (or equivalent) toolchain.
5. **Tailwind config:** make sure the `content` glob includes `./src/**/*.{ts,tsx}`. No custom theme keys are required by stnyth2 — all classes used are stock Tailwind.

## What to remove from this repo after extraction

- `src/stnyth2/` (the whole folder)
- `src/pages/Stnyth2.tsx`
- The two added lines in `src/App.tsx`:
  - `import Stnyth2 from "./pages/Stnyth2.tsx";`
  - `<Route path="/stnyth2" element={<Stnyth2 />} />`

That's it — no other files in this repo reference stnyth2.

## Open follow-ups

- [ ] Decide actual product purpose / replace placeholder copy.
- [ ] Wire the `Enter →` CTA to its real destination.
- [ ] Add tests once there's behavior worth testing.
- [ ] Pick the new repo name + extract.
