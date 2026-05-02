# synthsim — Handoff

A flight simulator that's also a synthesizer. Every flight-state knob (throttle, airspeed, altitude, pitch, roll, heading, RPM, gear, flaps, stall, overspeed) drives a Tone.js audio graph through a configurable mapping. This folder is the whole project — `src/synthsim/` is meant to be liftable into its own repo with a one-screen extraction step.

Latest milestone: **M3 — telemetry-driven sound** (committed). M0–M2 already shipped (boot/landing, engine + telemetry, full SVG cockpit). M4 (phase machine) is planned (IMPLEMENTATION.md §7) but not built.

The cockpit also has a **full-screen artificial horizon background** (`cockpit/WorldBackground.tsx`) that tracks pitch + roll — without it, the cockpit was a black void around the SVG instruments and players couldn't tell which way was up. M3 also re-tuned the airframe so a phone player can take off with **just throttle** (no elevator input required) — see `engine/airframe.ts` for the current curves.

Last verified: M3 ships 168 passing tests and a clean `npm run build`.

## Run it here

```bash
npm install
npm run dev               # http://localhost:8080/synthsim
npm run dev -- --host     # exposes on LAN for phone testing
npm test                  # vitest, 168 passing
npm run build             # production check
```

URL flags:
- `?dev=1` — re-enables the corner `<DebugTelemetryHUD>` overlay during flight.

## File map

```
src/synthsim/
├── DESIGN.md                              architecture + telemetry→sound table
├── IMPLEMENTATION.md                      executed plan, milestone-by-milestone (M0..M6)
├── HANDOFF.md                             this file
├── SynthSimApp.tsx                        orchestrates: loader → preflight → flying
├── styles.ts                              palette tokens (no inline JSX styles elsewhere)
├── components/
│   ├── LoadingScreen.tsx                  splash + progress
│   └── Landing.tsx                        Pre-flight CTA, async-aware (M3)
├── hooks/
│   ├── useBootSequence.ts                 0→100 progress + ready
│   ├── useFlightLoop.ts                   60Hz physics loop, ref-based, subscribe()
│   ├── useFlightLoop.test.tsx
│   ├── useSoundEngine.ts                  factory + dispose-on-unmount
│   ├── useSoundEngine.test.tsx
│   ├── useTelemetrySound.ts               flight.subscribe → applyTelemetry per tick
│   └── useTelemetrySound.test.tsx
├── engine/                                physics — pure TS, deterministic
│   ├── airframe.ts                        C-152-class constants
│   ├── controls.ts                        ControlInputs make/clamp
│   ├── forces.ts                          axes, AoA, CL/CD, lift⊥airflow, drag, thrust
│   ├── integrate.ts                       semi-implicit Euler, ground constraints
│   ├── telemetry.ts                       state → kt/ft/fpm/deg snapshot
│   ├── types.ts                           Vec3, FlightState, Telemetry
│   └── *.test.ts                          forces (20) + integrate (8)
├── cockpit/
│   ├── Cockpit.tsx                        portrait stack + safe-area-inset wiring
│   ├── WorldBackground.tsx                full-screen sky+ground+horizon, tracks
│   │                                      pitch (translateY) + roll (rotate)
│   ├── TelemetryContext.tsx               50ms-polled provider + useTelemetry()
│   ├── TelemetryContext.test.tsx
│   ├── DebugTelemetryHUD.tsx              dev-only telemetry block (?dev=1)
│   ├── Yoke.tsx                           pointer-capture joystick + 2.2/s spring-back
│   ├── Throttle.tsx                       vertical touch slider, latched
│   └── instruments/
│       ├── instrumentChrome.ts            polar / arcPath / clamp / pad3
│       ├── AttitudeIndicator.tsx          horizon ball + bank pointer + aircraft symbol
│       ├── Airspeed.tsx                   0–200 kt dial w/ Vfe/Vno/caution arcs + Vne tick
│       ├── Altimeter.tsx                  digital scrolling tape
│       ├── Heading.tsx                    rotating compass card + lubber line
│       ├── Variometer.tsx                 ±2000 fpm dial
│       └── *.test.tsx
├── hud/
│   ├── Hud.tsx                            top bar: phase | sim-clock | fuel
│   ├── StallBanner.tsx                    pulsing STALL/OVERSPEED over the AI
│   └── *.test.tsx
└── sound/                                 (M3) telemetry-driven audio
    ├── audioEngine.ts                     factory: lazy buildGraph + Transport heartbeat
    ├── audioEngine.test.ts                Tone.js mocked via vi.hoisted registry
    ├── mapping.ts                         pure linMap + applyTelemetry (no Tone refs)
    ├── mapping.test.ts                    every row of DESIGN.md §4 asserted
    ├── profiles.ts                        LinearCurve / BoolCurve + DEFAULT_PROFILE
    ├── profiles.test.ts
    ├── scales.ts                          8 modes + headingToScale + scaleStepToMidi
    └── scales.test.ts
```

Tests are co-located. Total: 168.

## Milestone status

| | Milestone | Status | Notes |
|---|---|---|---|
| M0 | boot shell (loader + landing) | ✅ | shipped |
| M1 | engine + telemetry stub | ✅ | semi-implicit Euler, static stability, ground pitch ceiling |
| M2 | primary cockpit (portrait) | ✅ | five SVG instruments + HUD + StallBanner + ?dev=1 gate |
| M3 | telemetry-driven sound (v1) | ✅ | continuous textures + fixed heartbeat, async pre-flight gesture |
| M3.1 | mobile-feel pass | ✅ | full-screen WorldBackground, gentler Yoke spring-back, larger touch targets, tuned airframe so throttle-only takes off |
| M4 | phase machine + flight plan | next | DJ_SECTIONS-style FSM keyed by flight events. **Plan written**, see IMPLEMENTATION.md §7 |
| M5 | autopilot = DJ mode | — | tap-AP generates a 4-min composition |
| M6 | world view (Three.js) | — | optional polish; the plane is currently invisible |

See `IMPLEMENTATION.md` for the executed shape of each shipped milestone (M0–M3) and the sketch of the rest.

## Architecture in one diagram

```
                ┌─────────────────────────────────────────────┐
                │ useFlightLoop (RAF, 60Hz fixed-step)        │
                │   stateRef, controlsRef, telemetryRef,      │
                │   subscribe(fn)                             │
                └──┬─────────────────────────────────────┬────┘
                   │ subscribe (60Hz)                    │ ref reads
                   │                                     │ (50ms poll)
       ┌───────────▼──────────┐               ┌──────────▼──────────┐
       │ useTelemetrySound    │               │ TelemetryProvider   │
       │  applyTelemetry()    │               │  → useTelemetry()   │
       │  → setters w/ rampTo │               │  → instruments,     │
       └───────────┬──────────┘               │     HUD, banners    │
                   │                           └─────────────────────┘
       ┌───────────▼──────────┐
       │ SoundEngine (Tone)   │
       │   lead/drone/sub +   │
       │   kick/hat heartbeat │
       │   master FX bus      │
       └──────────────────────┘
```

The flight loop is the single source of truth. Cockpit reads it through context, sound reads it through `subscribe()`. There is no other coupling between cockpit and sound.

## Self-containment promise

`src/synthsim/` imports nothing from `src/components/biome-synth/`. Patterns (function-built audio facade, dispose loops, `rampTo` smoothing, drums-dry routing, ref-based audio state) are mirrored, not imported. To verify: `grep -rn "biome-synth" src/synthsim` should return nothing.

## Dependencies (already in package.json)

- `react`, `react-dom`, `react-router-dom`
- `tone` — audio engine
- `tailwindcss` + the in-repo `@/lib/utils` `cn()` helper
- `vitest` + `@testing-library/react` + `@testing-library/jest-dom` for tests

No new deps were added in M1–M3. If you extract this folder, the only non-trivial dep to carry is **Tone.js**.

## How to extract to its own repo

1. `cp -r src/synthsim <new-repo>/src/synthsim`
2. In the new repo:
   - `package.json`: add `react`, `react-dom`, `tone`, `tailwindcss`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, plus a Vite (or equivalent) toolchain.
   - Create a root `App.tsx` that mounts `<SynthSimApp />` directly — synthsim doesn't need `react-router-dom` if it's the only page.
   - Copy `tailwind.config.ts` (only the content paths matter) and the `@/` alias from `tsconfig.json` + `vite.config.ts`.
   - `src/lib/utils.ts` — recreate `cn()` (it's a 3-line helper around `clsx` + `tailwind-merge`).
   - `src/test/setup.ts` — copy from `src/test/setup.ts` for the jest-dom matcher import.
3. After copying, run `npm install`, `npm test`, `npm run build` to verify the extraction.
4. Remove from the old repo: `src/synthsim/`, `src/pages/Play.tsx` (or whatever currently routes to synthsim), and the corresponding `App.tsx` route.

## Conventions in force

See `.claude/rules/`:
- `react-components.md` — functional only, props interface above component, no inline styles, cleanup in `useEffect` returns.
- `audio-engine.md` — `Tone.Transport` for scheduling, shared reverb, drums dry, dispose every node, AudioContext on user gesture, polyphony ≤ 8.
- `testing.md` — Vitest + jsdom; mock Tone.js because jsdom can't open AudioContext; tests co-located with source.

## Open follow-ups (post-M3)

- **M4 plan is written** (IMPLEMENTATION.md §7). Replaces the M3 fixed heartbeat with phase-driven drum patterns + section transitions, keyed by flight events. Files specified, drum patterns specified, ~30 new tests planned. Ready to execute.
- M4: Kollsman-correct altimeter (currently absolute; flight plan/weather will carry the setting).
- M5: tap-to-engage autopilot that flies + composes for 4 minutes.
- M6 (optional): real Three.js world view — clouds, terrain, runway. The current `WorldBackground.tsx` is a CSS-only stop-gap so the cockpit isn't a black void.
- Phugoid damping: with elevator held, the plane can pitch-overshoot into a stall. Game-feel is fine for short pulls; future work is auto-trim or stronger speed-stability damping.
