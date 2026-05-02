# synthsim — Implementation plan

Companion to [`DESIGN.md`](./DESIGN.md). DESIGN explains *what* and *why*; this file is *exactly how*, with concrete file plans, type signatures, and milestone steps.

---

## 1. Revised stack decisions (post-research)

| Decision | What changed | Why |
|---|---|---|
| ❌ Drop `react-flight-indicators` | DESIGN listed it as v1 cockpit UI. Removed. | License is **GPL-3.0** (would force synthsim to be GPL-3.0). Last npm update ~6y ago → unverified React 18 support. |
| ❌ Drop `react-joystick-component` / `nipplejs` | Don't add a joystick dep. | We already have touch-input patterns in `src/components/biome-synth/hooks/useTouchInput.ts`. A 60-line yoke is smaller + portable + license-clean. |
| ✅ Build minimal own SVG instruments | New: `src/synthsim/cockpit/instruments/*` | Each instrument is < 100 LOC of SVG. Trivially MIT, trivially mobile-tunable, no theme drift. |
| ✅ Keep Tone.js | Already in repo. | Use `Tone.Transport.bpm.rampTo(value, duration)` for smooth tempo-from-airspeed. |
| ✅ Keep Three.js for world (M6 only) | Already in repo. | Sky / horizon plane only. No terrain tiles in v1. |
| ✅ Keep TS-native simplified flight model | DESIGN's primary engine choice. | No WASM build chain. Lift / drag / thrust / gravity vectors, RK4 or semi-implicit Euler. |
| 🔁 Stretch (v2): JSBSim WASM | Same as DESIGN. | Only if v1 fidelity feels coarse. |

**Net dependency delta vs. today**: zero new npm packages for v1.

---

## 2. Patterns to mirror from biome-synth

Each new synthsim file copies a pattern from the existing synth — same shape, scoped to flight-sim concepts. **Copy patterns, not files** (the new project must remain extractable).

| New file | Mirrors | Borrowed pattern |
|---|---|---|
| `src/synthsim/sound/audioEngine.ts` | `src/components/biome-synth/hooks/useAudioEngine.ts:43-80` | `buildGraph()` → returns disposable `InternalGraph`. Signal chain: synth → filter → effects → shared Freeverb → masterComp → masterLimiter → destination. Mobile-gated polyphony + chorus wet. |
| `src/synthsim/flightplan/phases.ts` | `src/components/biome-synth/shared/constants.ts:34-40` (`DJ_SECTIONS`) | Array of `{ name, bars, energy, drumPattern, mappingPatch }` records. Phase FSM advances via `Tone.Transport.scheduleRepeat`. |
| `src/synthsim/hooks/useFlightLoop.ts` | `useDjAutoPlay.ts` ref-based state | `flightStateRef` mutated every tick — never `useState` for audio-rate values. UI updates via a separate adapter (mirrors `DjUi`). |
| `src/synthsim/cockpit/Yoke.tsx` | `useTouchInput.ts:17-60` | `pointerdown`/`pointermove`/`pointerup` with a `pendingMoves` map flushed in RAF, plus voice-cleanup timer. |
| `src/synthsim/sound/mapping.ts` | `helpers.ts` (`m2f`, `clamp`, `lerp`) | Pure functions. `mapTelemetry(telemetry, profile) → SynthParams`. |

> **Important** (from `.claude/rules/audio-engine.md`): use `Tone.Transport` for all scheduling, shared Freeverb bus, dispose every Tone node on cleanup, start AudioContext on user gesture, `maxPolyphony ≤ 8`, FFT bins = 128.

---

## 3. Final folder layout (target)

```
src/synthsim/
├── DESIGN.md                       (exists)
├── IMPLEMENTATION.md               (this file)
├── SynthSimApp.tsx                 (exists — extend to mount Cockpit after Pre-flight tap)
├── styles.ts                       (exists)
│
├── components/                     (exists)
│   ├── LoadingScreen.tsx           (exists)
│   └── Landing.tsx                 (exists — rename CTA "Pre-flight →" to call onPreflight())
│
├── engine/                         ⬅ M1
│   ├── types.ts                    Telemetry, FlightState, ControlInputs
│   ├── airframe.ts                 C-152-class constants
│   ├── forces.ts                   lift/drag/thrust/gravity
│   ├── integrate.ts                semi-implicit Euler @ 60Hz
│   └── controls.ts                 input → control surfaces
│
├── hooks/                          ⬅ M1+
│   ├── useBootSequence.ts          (exists)
│   ├── useFlightLoop.ts            ⬅ M1
│   ├── useTouchControls.ts         ⬅ M2
│   ├── useTelemetrySound.ts        ⬅ M3
│   └── usePhase.ts                 ⬅ M4
│
├── cockpit/                        ⬅ M2
│   ├── Cockpit.tsx                 mobile portrait + landscape layouts
│   ├── Yoke.tsx                    touch joystick
│   ├── Throttle.tsx                vertical touch slider
│   ├── DebugTelemetryHUD.tsx       ⬅ M1 (kept beyond M1 as a dev panel)
│   └── instruments/
│       ├── AttitudeIndicator.tsx   SVG own-build
│       ├── Airspeed.tsx
│       ├── Altimeter.tsx
│       ├── Heading.tsx
│       └── Variometer.tsx
│
├── sound/                          ⬅ M3
│   ├── audioEngine.ts
│   ├── mapping.ts
│   ├── profiles.ts
│   └── phaseScheduler.ts           ⬅ M4
│
├── flightplan/                     ⬅ M4
│   ├── phases.ts
│   └── plan.ts
│
├── world/                          ⬅ M6 (optional)
│   ├── scene.ts
│   └── shaders.ts
│
└── hud/                            ⬅ M2
    ├── Hud.tsx                     phase / fuel / time bar
    └── StallBanner.tsx
```

---

## 4. M1 — engine + telemetry stub (detailed)

**Goal**: tilting a touch joystick produces realistic attitude/airspeed numbers in a debug overlay on `/synthsim`. Mobile portrait works.

### 4.1 Types — `src/synthsim/engine/types.ts`

```ts
export interface Vec3 { x: number; y: number; z: number; }

export interface ControlInputs {
  throttle: number;   // 0..1
  elevator: number;   // -1..+1   (pitch)   nose-up positive
  aileron: number;    // -1..+1   (roll)    bank-right positive
  rudder: number;     // -1..+1   (yaw)
  flaps: number;      // 0..4 (notches)
  gearDown: boolean;
}

export interface FlightState {
  position: Vec3;        // m, world frame
  velocity: Vec3;        // m/s, world frame
  attitude: { pitch: number; roll: number; yaw: number }; // rad
  angVel:   { pitch: number; roll: number; yaw: number }; // rad/s
  rpm: number;           // 0..1 normalized engine output
  fuel: number;          // 0..1
  onGround: boolean;
}

export interface Telemetry {
  // Cockpit-friendly units, derived once per tick from FlightState.
  airspeedKt: number;       // knots
  altitudeFt: number;       // feet AGL (== MSL in v1, no terrain)
  verticalSpeedFpm: number; // feet per minute
  pitchDeg: number;
  rollDeg: number;
  headingDeg: number;       // 0..360
  yawRateDps: number;       // deg/sec
  throttle: number;         // pass-through 0..1
  rpm: number;              // pass-through 0..1
  flaps: number;            // pass-through 0..4
  gearDown: boolean;
  stallWarning: boolean;
  overspeed: boolean;
  onGround: boolean;
}
```

### 4.2 Airframe — `src/synthsim/engine/airframe.ts`

Constants for a Cessna-152-class light single. Tuned for "feels right on a phone", not certification fidelity.

```ts
export const AIRFRAME = {
  mass: 757,            // kg
  wingArea: 14.9,       // m^2
  wingSpan: 10.2,       // m
  CL_alpha: 5.5,        // lift slope (per radian)
  CL0: 0.25,            // zero-AoA lift
  CL_max: 1.6,
  CD0: 0.027,           // parasite drag
  k: 0.054,             // induced drag factor (1 / (pi * AR * e))
  thrustMax: 4500,      // N at sea level, full throttle
  fuelBurnKgs: 0.0028,  // kg/s @ full throttle
  pitchAuthority: 1.6,  // rad/s^2 per unit elevator
  rollAuthority: 4.0,
  yawAuthority: 0.8,
  pitchDamp: 1.4,
  rollDamp: 2.0,
  yawDamp: 1.2,
  flapsLiftBoost: 0.18, // CL added per notch
  flapsDragBoost: 0.012,
  vStall: 24,           // m/s ~ 47 kt clean
  vNe: 87,              // m/s ~ 169 kt VNE
} as const;
```

### 4.3 Forces — `src/synthsim/engine/forces.ts`

Pure functions. No state.

```ts
import { AIRFRAME } from "./airframe";
import type { FlightState, ControlInputs, Vec3 } from "./types";

const RHO_SL = 1.225; // kg/m^3 sea-level air density

export function airspeed(state: FlightState): number {
  const v = state.velocity;
  return Math.hypot(v.x, v.y, v.z);
}

export function angleOfAttack(state: FlightState): number {
  // Approximation: AoA = pitch - flightPathAngle
  const v = state.velocity;
  const speed = airspeed(state);
  if (speed < 0.1) return 0;
  const fpa = Math.asin(v.y / speed);
  return state.attitude.pitch - fpa;
}

export function liftCoefficient(aoa: number, flaps: number): number {
  const cl = AIRFRAME.CL0 + AIRFRAME.CL_alpha * aoa + flaps * AIRFRAME.flapsLiftBoost;
  return Math.max(-AIRFRAME.CL_max, Math.min(AIRFRAME.CL_max, cl));
}

export function dragCoefficient(cl: number, flaps: number, gearDown: boolean): number {
  return AIRFRAME.CD0 + AIRFRAME.k * cl * cl
       + flaps * AIRFRAME.flapsDragBoost
       + (gearDown ? 0.012 : 0);
}

export function computeForces(state: FlightState, ctrl: ControlInputs): {
  thrust: Vec3;
  lift: Vec3;
  drag: Vec3;
  gravity: Vec3;
} {
  // ...returns world-frame force vectors derived from attitude + controls.
  // See airframe constants. ~30 LOC.
}
```

### 4.4 Integrate — `src/synthsim/engine/integrate.ts`

Semi-implicit Euler, fixed dt = 1/60. Mobile drops to 1/30.

```ts
import { isMobileFlag } from "./airframe"; // separate or inlined

const FIXED_DT = isMobileFlag ? 1 / 30 : 1 / 60;

export function step(state: FlightState, ctrl: ControlInputs, dt = FIXED_DT): FlightState {
  // 1. Compute angular accelerations from control inputs minus damping
  // 2. Integrate angVel, then attitude
  // 3. Compute forces (lift, drag, thrust, gravity) in world frame
  // 4. Integrate velocity, then position
  // 5. Ground clamp: if position.y <= 0, set velocity.y = max(0, ...) and onGround = true
  // 6. Update rpm: simple lag-filter toward ctrl.throttle
  // 7. Burn fuel proportionally
  // Returns a new FlightState (do not mutate input).
}
```

### 4.5 Controls — `src/synthsim/engine/controls.ts`

```ts
export function makeControls(): ControlInputs { /* defaults: throttle 0, gearDown true */ }
export function clampControls(c: ControlInputs): ControlInputs { /* clamp ranges */ }
```

### 4.6 Hook — `src/synthsim/hooks/useFlightLoop.ts`

Mirrors the ref-based pattern from `useDjAutoPlay`. **Do not** push `FlightState` through `useState` — it updates 30/60Hz.

```ts
import { useEffect, useRef } from "react";
import { step } from "@/synthsim/engine/integrate";
import { makeControls } from "@/synthsim/engine/controls";
import type { ControlInputs, FlightState, Telemetry } from "@/synthsim/engine/types";
import { stateToTelemetry } from "@/synthsim/engine/telemetry";

export interface FlightLoopHandle {
  stateRef: React.MutableRefObject<FlightState>;
  controlsRef: React.MutableRefObject<ControlInputs>;
  telemetryRef: React.MutableRefObject<Telemetry>;
  subscribe: (fn: (t: Telemetry) => void) => () => void;
}

export function useFlightLoop(running: boolean): FlightLoopHandle {
  // Maintain stateRef, controlsRef, telemetryRef.
  // RAF loop: accumulator -> step(state, controls, FIXED_DT) until caught up.
  // After each step: derive telemetry and call subscribers.
  // Cleanup cancels RAF.
}
```

### 4.7 Touch yoke — `src/synthsim/cockpit/Yoke.tsx`

A square pad with a draggable thumb. One-finger drag = pitch + roll. Pinch (two-finger) = rudder. Tap-and-hold deadzone = trim.

Output via callback prop:

```ts
interface YokeProps {
  onChange: (axes: { x: number; y: number; rudder: number }) => void;
  size?: number;
}
```

Implementation notes:
- Pointer Events API (mobile + desktop unified).
- `touch-action: none` on the wrapper div.
- Output `x, y` in `-1..+1`. Spring back to center on `pointerup`.
- Haptic on first touch (`navigator.vibrate(8)` if available).
- ~80 LOC including spring-back.

### 4.8 Throttle — `src/synthsim/cockpit/Throttle.tsx`

Vertical slider. `onChange: (throttle: 0..1) => void`. Latches (no spring back). ~40 LOC.

### 4.9 Debug HUD — `src/synthsim/cockpit/DebugTelemetryHUD.tsx`

Top-left fixed overlay. Reads `telemetryRef` via a 10Hz interval (debug-only — fine to use `setInterval` here, no audio). Renders a monospace block:

```
ASI  47 kt
ALT  120 ft
V/S  +320 fpm
PIT  +4.2°
ROL  -1.1°
HDG  287°
THR  35%
RPM  68%
FLP  0
GR   ▼
```

Styling: `font-mono text-[10px]` over a translucent dark backdrop, safe-area-inset aware.

### 4.10 SynthSimApp wiring

Add a `phase` state machine: `"booting" → "preflight" → "flying"`.

- `booting` → `LoadingScreen` (already done)
- `preflight` → `Landing` (already done; "Pre-flight →" CTA calls `setPhase("flying")`)
- `flying` → `<Cockpit />` (M2) or for M1 just `<DebugTelemetryHUD />` + `<Yoke />` + `<Throttle />`

```tsx
const SynthSimApp = () => {
  const { progress, ready } = useBootSequence();
  const [phase, setPhase] = useState<"booting" | "preflight" | "flying">("booting");

  useEffect(() => { if (ready) setPhase((p) => p === "booting" ? "preflight" : p); }, [ready]);

  const flying = phase === "flying";
  const flight = useFlightLoop(flying);

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#0a0a0f]">
      {phase === "booting" && <LoadingScreen progress={progress} fadingOut={false} />}
      {phase === "preflight" && <Landing visible onPreflight={() => setPhase("flying")} />}
      {flying && (
        <>
          <DebugTelemetryHUD telemetryRef={flight.telemetryRef} />
          <Yoke onChange={({ x, y, rudder }) => {
            flight.controlsRef.current.aileron = x;
            flight.controlsRef.current.elevator = -y;  // screen-down = nose-up
            flight.controlsRef.current.rudder = rudder;
          }} />
          <Throttle onChange={(t) => { flight.controlsRef.current.throttle = t; }} />
        </>
      )}
    </div>
  );
};
```

### 4.11 Mobile-first layout (M1 only)

For M1 the cockpit is just three overlays:
- Debug HUD: top-left, `safe-area-inset-top` padded
- Yoke: bottom-left, ~40% screen width, square
- Throttle: bottom-right, ~10% screen width, ~50% screen height vertical strip

`safe-area-inset-bottom` accounted for. `touch-action: none` on Yoke + Throttle wrappers.

### 4.12 Verification (M1 done when…)

Run `npm run dev`, open Chrome DevTools mobile emulation (iPhone 14 Pro), navigate `/synthsim`:

1. Loader → Pre-flight → tap "Pre-flight →" → cockpit overlays appear.
2. Drag the Yoke up: pitch number rises, altitude starts climbing once airspeed > stall, vertical speed positive.
3. Push throttle to 100%: airspeed climbs from 0 to ~110 kt over ~30s, ground roll ends, plane "rotates" once airspeed > vStall.
4. Bank left/right: roll number tracks; if uncoordinated, heading drifts.
5. At 0 throttle on ground: stays stopped, no NaNs in HUD.
6. Stall behaviour: at low airspeed and high pitch, `STALL` boolean flips true.
7. Numbers never go to NaN/Infinity. HUD updates smoothly at 10Hz.
8. **No new npm deps installed.** `package.json` unchanged.
9. `npm run build` clean. `npm test` 14/14 pass.

---

## 5. M2 — primary cockpit (mobile portrait)

Built on top of M1. **Goal**: replace `DebugTelemetryHUD` with a real, hand-rolled SVG cockpit that's flyable with one thumb on a phone.

### 5.1 Stance and constraints

- All instruments are **own-built SVG** (no `react-flight-indicators`, no third-party SVG asset packs). MIT-clean, no GPL contagion. Each instrument is small (50–150 LOC) and renders at 20 Hz, which is plenty for an instrument panel — the AI horizon will look smooth because pitch/roll are physically smooth on the engine side (60 Hz integration with stability terms).
- **Single shared subscription**: a `<TelemetryProvider>` polls `flight.telemetryRef` once at 50 ms and broadcasts via React context. Every instrument is a thin consumer. Avoids 7 timers spinning in parallel.
- **Telemetry is read-only here.** Yoke/Throttle still write to `flight.controlsRef`. No instrument writes back.
- **Mobile portrait first**, landscape gets a wider layout but reuses the same instrument components — no special cases.
- Keep `DebugTelemetryHUD` available behind a query-string toggle (`/synthsim?dev=1`) for development.

### 5.2 Files

```
src/synthsim/
├── cockpit/
│   ├── Cockpit.tsx                       layout: portrait stack / landscape grid
│   ├── TelemetryContext.tsx              context + provider + useTelemetry()
│   └── instruments/
│       ├── instrumentChrome.ts           shared SVG helpers (tickMark, dialCircle, deg→rad)
│       ├── AttitudeIndicator.tsx         horizon ball + bank pointer + aircraft symbol
│       ├── Airspeed.tsx                  round dial 0–200 kt, color arcs
│       ├── Altimeter.tsx                 digital scrolling tape
│       ├── Heading.tsx                   rotating compass card
│       └── Variometer.tsx                ±2000 fpm dial
├── hud/
│   ├── Hud.tsx                           top bar (phase + fuel + sim-clock)
│   └── StallBanner.tsx                   flashing red banner over the AI
└── (modify) SynthSimApp.tsx              mount <Cockpit /> instead of debug overlays
```

### 5.3 Subscription pattern — `TelemetryContext.tsx`

```tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { FlightLoopHandle } from "../hooks/useFlightLoop";
import type { Telemetry } from "../engine/types";

const Ctx = createContext<Telemetry | null>(null);

interface ProviderProps {
  flight: FlightLoopHandle;
  intervalMs?: number;
  children: React.ReactNode;
}

export const TelemetryProvider = ({ flight, intervalMs = 50, children }: ProviderProps) => {
  const [t, setT] = useState<Telemetry>(flight.telemetryRef.current);
  useEffect(() => {
    const id = window.setInterval(() => {
      setT({ ...flight.telemetryRef.current });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [flight, intervalMs]);
  return <Ctx.Provider value={t}>{children}</Ctx.Provider>;
};

export const useTelemetry = (): Telemetry => {
  const t = useContext(Ctx);
  if (!t) throw new Error("useTelemetry must be used inside <TelemetryProvider>");
  return t;
};
```

If the AI horizon ever feels jittery at 50 ms (it shouldn't, the engine is smooth), the AI is the only candidate for an imperative ref-driven escape hatch via `flight.subscribe`. Don't optimize prematurely.

### 5.4 Shared SVG helpers — `instrumentChrome.ts`

Pure functions, no React. Tests live alongside.

```ts
export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;
export const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg - 90) * D2R;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};
export const arcPath = (cx: number, cy: number, r: number, fromDeg: number, toDeg: number) => {
  const a = polar(cx, cy, r, fromDeg);
  const b = polar(cx, cy, r, toDeg);
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
};
export const clamp = (v: number, lo: number, hi: number) => v < lo ? lo : v > hi ? hi : v;
```

### 5.5 Instrument specs

#### AttitudeIndicator (~150 LOC)

- Square SVG, viewBox `-100 -100 200 200`. Outer black bezel circle.
- A `<clipPath>` (a circle r=88) clips a rotating+translating group that contains:
  - Sky rectangle (top half) — `fill: #4a7fb0`
  - Ground rectangle (bottom half) — `fill: #6e4a2a`
  - Horizon line — `stroke: #fff stroke-width: 2`
  - Pitch ladder: every 5° from -30° to +30°, short white tick at ±5°, longer at ±10°/±20°/±30° with a label.
- **Transform on the inner group**:
  - `translate(0, ${pitchDeg * PITCH_PIXELS_PER_DEG})` (e.g. 5 px/deg)
  - `rotate(${-rollDeg})`
- Outside the clip:
  - Aircraft symbol: yellow `<path>` "wings + center dot" — fixed at center.
  - Bank pointer: triangle at the top, fixed; bank scale arc with tick marks at ±10/±20/±30/±60° rotates with `-rollDeg`.
- **Smooth-mode escape hatch**: optional prop `subscribe?: FlightLoopHandle["subscribe"]` — when supplied, AI bypasses context and writes the inner group's `transform` via `gRef.current.setAttribute(...)` from inside the subscriber. Use only if 50 ms feels jittery.

#### Airspeed (~80 LOC)

- Square SVG, viewBox `-100 -100 200 200`. Black bezel.
- Tick ring: every 10 kt from 0 to 200, label every 20 kt.
- Color arcs (drawn with `arcPath`, stroke-width 8 inside the tick ring):
  - White 35–85 kt (Vfe band — flap operating range)
  - Green 47–127 kt (Vno — normal operating)
  - Yellow 127–160 kt (caution)
  - Red line at 160 kt (Vne)
- Needle: a `<path>` (long thin pointer), rotated by `(airspeedKt / 200) * 270 - 135` deg.
- Text readout at bottom inside the dial: `{Math.round(airspeedKt)} kt`.

#### Altimeter — digital tape (~80 LOC)

Why tape over three-needle: phone-readable, no ambiguity at 1000 ft boundary.

- Vertical SVG strip, viewBox `0 0 100 200`. Black background.
- Centered tape:
  - For `i` in `[-5..+5]`: tick at `y = 100 + i * 20`, label `(altRounded + i*100)` ft.
  - Tape `transform: translate(0, ${(alt % 100) * 0.2})` so it scrolls smoothly between hundreds.
  - Tape clipped to the strip.
- Center reticle: white horizontal line + boxed digital number `{Math.round(alt)}` ft on the right side.

#### Heading (~80 LOC)

- Square SVG, viewBox `-100 -100 200 200`. Black bezel.
- Outer compass card: 12-hour-clock layout — letters N (0°), E (90°), S (180°), W (270°), `3`/`6`/`12`/`15`/`21`/`24`/`30`/`33` in between.
- Card group rotated by `-headingDeg` (heading 90° → E rotates to top).
- Lubber line at 12 o'clock outside the card: yellow triangle pointer.
- Text readout inside the card showing heading in 3-digit form: `${pad3(Math.round(headingDeg))}`.

#### Variometer (~50 LOC)

- Square SVG. Black bezel.
- Tick ring: 0 at 9 o'clock (left), `+1000`, `+2000` going clockwise to top, `-1000`, `-2000` going counter-clockwise to bottom. Linear 0–2000 fpm.
- Single needle rotated by `(verticalSpeedFpm / 2000) * 90` deg — pointing up at 9 o'clock for level, swinging clockwise for climb.
- Clamp visual deflection at ±90° (saturate, don't wrap).

### 5.6 HUD + StallBanner

- `Hud.tsx` (top bar, ~40 LOC):
  ```
  ┌────────────────────────────────────────────┐
  │ PRE-FLIGHT       T+00:00     FUEL ▮▮▮▮▮▯▯▯ │
  └────────────────────────────────────────────┘
  ```
  - Sim-clock counter: `useState` + `setInterval(1000)` while `flying`.
  - Fuel: 8 segments, on/off based on `fuel * 8`.
  - Phase string: `"PRE-FLIGHT"` for now (the real phase FSM lands in M4).
  - Safe-area inset top, mono small-caps.

- `StallBanner.tsx` (~30 LOC):
  - Renders only when `telemetry.stallWarning || telemetry.overspeed`.
  - Centered banner overlaying the AI: `STALL` red, `OVERSPEED` orange, both flash at 4 Hz via `animate-pulse` Tailwind utility (already enabled by `tailwindcss-animate`).
  - Pointer-events-none.

### 5.7 Cockpit layout — `Cockpit.tsx`

```tsx
const Cockpit = ({ flight }: { flight: FlightLoopHandle }) => (
  <TelemetryProvider flight={flight}>
    <div className="fixed inset-0 flex flex-col">
      <Hud />
      <div className="relative flex-1 flex flex-col">
        <div className="relative flex justify-center pt-2">
          <AttitudeIndicator />
          <StallBanner />
        </div>
        <div className="grid grid-cols-4 gap-1 px-2 mt-2">
          <Airspeed />
          <Altimeter />
          <Heading />
          <Variometer />
        </div>
        <div className="flex-1" />
      </div>

      <div
        className="absolute left-0 bottom-0"
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <Yoke onChange={...} size={170} />
      </div>
      <div
        className="absolute right-0 bottom-0"
        style={{
          paddingRight: "max(1rem, env(safe-area-inset-right))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <Throttle onChange={...} height={210} width={52} />
      </div>
    </div>
  </TelemetryProvider>
);
```

Sizes (portrait):
- AI: `min(60vw, 320px)` square
- Small dials: 25% width each, square (`aspect-ratio: 1 / 1`)
- HUD: ~6 vh tall

Landscape (≥ 768px wide): the same components in a 6-pack-ish grid; the existing `<Cockpit>` switches via a small `useIsLandscape()` hook (matchMedia + `(orientation: landscape) and (min-width: 768px)`). For M2 the landscape path can be a stretch — portrait must work; landscape can wait until M3 if we run out of room.

### 5.8 SynthSimApp wiring change

Replace the M1 debug overlays:

```diff
- <DebugTelemetryHUD telemetryRef={flight.telemetryRef} />
- <Yoke ... /> + <Throttle ... />
+ <Cockpit flight={flight} />
+ {/* Yoke + Throttle now live inside Cockpit */}
```

`?dev=1` in URL re-enables `<DebugTelemetryHUD />` as a corner overlay for development.

### 5.9 Tests

Per `.claude/rules/testing.md` — Vitest + jsdom, mock no Tone/Three (M2 doesn't touch them).

| Test file | What it covers |
|---|---|
| `cockpit/instruments/instrumentChrome.test.ts` | `polar` + `arcPath` math: known-angle outputs, full-circle wrap, `clamp` |
| `cockpit/instruments/AttitudeIndicator.test.tsx` | Renders the inner group with `transform` containing `rotate(-rollDeg)` and `translate(... pitchDeg ...)`. Use `getByTestId('ai-inner')`. |
| `cockpit/instruments/Airspeed.test.tsx` | Needle rotation = expected angle for a few input speeds. Color arcs are present (count `<path>` elements with stroke colors). |
| `cockpit/instruments/Altimeter.test.tsx` | Digital readout matches input altitude rounded to nearest foot. |
| `cockpit/instruments/Heading.test.tsx` | Compass card rotation = `-headingDeg`. Lubber line rendered. |
| `cockpit/instruments/Variometer.test.tsx` | Needle rotation clamps at ±90°. |
| `cockpit/TelemetryContext.test.tsx` | Provider polls and updates context value when `telemetryRef` mutates externally. Throws when `useTelemetry` used outside provider. |
| `hud/Hud.test.tsx` | Sim-clock advances; fuel segments scale with `fuel`. |
| `hud/StallBanner.test.tsx` | Renders when `stallWarning`; absent otherwise; renders `OVERSPEED` when `overspeed`. |

Total: ~25 new tests. Mock `setInterval` via `vi.useFakeTimers()` for `Hud` and `TelemetryContext`.

### 5.10 Verification

`npm run dev`, navigate to `/synthsim`:

1. Loader → Pre-flight → tap CTA → cockpit appears, no debug HUD.
2. **Static check**: AI shows artificial horizon centered, ASI needle at 0, ALT reads 0, HSI shows N at top, V/S needle level.
3. **Throttle to 100%**: ASI needle rises smoothly, RPM-driven engine "feel" — needle isn't jittery.
4. **Yoke up**: AI horizon descends (sky fills), ASI keeps climbing, ALT tape scrolls upward when airborne.
5. **Yoke right**: AI rolls right, HSI compass card rotates left (absolute heading drifts right).
6. **At low speed + nose up**: STALL banner pulses over the AI; engine telemetry agrees.
7. **iPhone 14 Pro Safari emulation**: no element overflows, instruments stay readable, dynamic-island doesn't overlap HUD.
8. **`?dev=1`**: `DebugTelemetryHUD` appears in a corner; numbers agree with the visual instruments to within 1 unit.
9. `npm run lint` (when fixed) / `npm run build` clean. `npm test` all green (47 + ~25 = ~72 tests).

### 5.11 Out of scope (defer)

- Landscape 6-pack layout — defer if portrait squeezes time.
- Real altimeter Kollsman setting (29.92 inHg) — defer to flight plan / weather (M4).
- Heading bug, ALT bug, AP-target overlays on instruments — that's M5.
- Wired-up engine RPM gauge / fuel gauges — telemetry exists, but UI defers (low value vs cost on phone).
- Sound — that's M3.

### 5.12 Rollout

Single batch (one commit):
1. `instrumentChrome.ts` + test
2. `TelemetryContext.tsx` + test
3. Five instruments + their tests
4. `Hud` + `StallBanner` + their tests
5. `Cockpit.tsx`
6. `SynthSimApp.tsx` swap
7. `?dev=1` query-string gate around `DebugTelemetryHUD`
8. `npm test` + `npm run build`
9. Mobile smoke check (Safari iPhone emulation)
10. Commit + push

### Done when
On a real iPhone in Safari, you can fly a complete VFR pattern (takeoff → climb → 1000ft → 270° turn → descent → land) using only touch yoke + throttle. No layout breaks at notch/dynamic-island devices. All instruments agree with the engine telemetry to within rounding.

---

## 6. M3 — telemetry-driven sound (v1 mapping)

### Files
- `src/synthsim/sound/audioEngine.ts` — Tone.js graph (~150 LOC, mirrors `useAudioEngine.ts` shape but smaller voice list)
- `src/synthsim/sound/mapping.ts` — pure mapping fns
- `src/synthsim/sound/profiles.ts` — `DEFAULT_PROFILE` mapping curves (the table from `DESIGN.md` §4)
- `src/synthsim/hooks/useTelemetrySound.ts` — subscribes to flight loop, applies mapping every tick

### Audio graph (smaller than biome-synth)
```
lead (PolySynth, sawtooth)  ─► leadFilter ─┐
sub  (Synth, sine)          ─► gainSub  ───┤
drone (Synth, sine, slow)   ─► droneFilter ┤
                                           ├─► chorus ─► delay ─► reverb ─► comp ─► limiter ─► destination
kick  (MembraneSynth)       ───────────────┘ (drums dry, like biome-synth)
hat   (MetalSynth)          ─────────────────► comp (dry path)
```

### Mapping fn (skeleton)
```ts
export function applyTelemetry(t: Telemetry, eng: SoundEngine, profile: MappingProfile) {
  // gain
  eng.setMasterGainDb(linMap(t.throttle, 0, 1, -60, -6));
  // bpm
  Tone.Transport.bpm.rampTo(linMap(t.airspeedKt, 30, 200, 60, 160), 0.2);
  // octave
  eng.setLeadOctaveOffset(Math.floor(t.altitudeFt / 5000));
  // filter
  eng.setLeadFilterCutoff(linMap(t.pitchDeg, -20, 20, 200, 8000));
  // pan
  eng.setMasterPan(linMap(t.rollDeg, -45, 45, -1, 1));
  // verb wet from flaps, delay bypass from gear, etc.
  // distortion on stallWarning, bit-crush on overspeed.
}
```

`Tone.Transport.bpm.rampTo(value, duration)` is confirmed safe ([Tone.js Transport docs](https://tonejs.github.io/docs/14.7.39/Transport)).

### Done when
- Tap-to-start gesture lifts AudioContext on iOS Safari.
- Throttle audibly affects gain, airspeed audibly shifts BPM, altitude shifts pitch in steps.
- No audible glitches/zipper noise (use `rampTo` with 0.05–0.2s smoothing on every continuous param).
- CPU stays under 30% on iPhone 12.

---

## 7. M4 — phase machine + flight plan

### Files
- `src/synthsim/flightplan/phases.ts` — array of phase records (mirrors `DJ_SECTIONS` shape)
- `src/synthsim/flightplan/plan.ts` — emits a default route + weather knobs
- `src/synthsim/sound/phaseScheduler.ts` — Transport-driven section advancement
- `src/synthsim/hooks/usePhase.ts` — exposes current/next phase + progress

### Phase records (sketch)
```ts
export const PHASES = [
  { name: "PREFLIGHT", bars: 4,  energy: 0.05, drum: "silence",  patch: { reverb: 0.2, gain: -40 } },
  { name: "TAXI",      bars: 4,  energy: 0.15, drum: "tick",     patch: { reverb: 0.25 } },
  { name: "TAKEOFF",   bars: 8,  energy: 0.85, drum: "build",    patch: { reverb: 0.3 } },
  { name: "CLIMB",     bars: 16, energy: 0.7,  drum: "fourFloor",patch: { reverb: 0.45 } },
  { name: "CRUISE",    bars: 32, energy: 0.6,  drum: "pulse",    patch: { reverb: 0.55 } },
  { name: "DESCENT",   bars: 16, energy: 0.65, drum: "filtered", patch: { reverb: 0.5 } },
  { name: "APPROACH",  bars: 12, energy: 0.8,  drum: "tight",    patch: { reverb: 0.35 } },
  { name: "LANDING",   bars: 6,  energy: 0.95, drum: "impact",   patch: { reverb: 0.25 } },
  { name: "SHUTDOWN",  bars: 4,  energy: 0.05, drum: "silence",  patch: { reverb: 0.7 } },
] as const;
```

### Auto-advance triggers
- `TAXI → TAKEOFF`: throttle > 0.7 on ground for 2s
- `TAKEOFF → CLIMB`: airspeed > vStall + onGround === false
- `CLIMB → CRUISE`: |verticalSpeedFpm| < 200 sustained 4s
- `CRUISE → DESCENT`: throttle < 0.4 sustained 3s
- `DESCENT → APPROACH`: altitudeFt < 2000
- `APPROACH → LANDING`: altitudeFt < 100 + onGround imminent
- `LANDING → SHUTDOWN`: airspeed < 5 kt sustained 3s
- `SHUTDOWN`: throttle === 0 + RPM < 0.05

### Done when
A completed preflight → shutdown demo plays a coherent arc, and section transitions feel synced to the actual flight events.

---

## 8. M5 — autopilot = DJ mode

`AutopilotPanel.tsx` toggles `apActive`. While active:
- Reuse `useDjAutoPlay`-style ref-based section state (copy the *pattern* into `src/synthsim/sound/phaseScheduler.ts`, not import).
- Engine: compute control inputs from AP mode (HDG, ALT, APP) every tick → flight loop.
- Sound: AP modes patch the mapping profile (HDG = mode swap, ALT = octave bump, APP = builds tension).

### Done when
One tap on AP and the simulator generates a 4-minute composition that flies itself preflight → shutdown.

---

## 9. M6 — world view (optional)

`Three.js` scene in `src/synthsim/world/scene.ts`:
- Sky gradient (vertex-colored sphere or shader)
- Horizon plane with simple ground texture
- Camera attitude bound to `flightStateRef.attitude`
- `requestAnimationFrame` loop in `useThreeScene` style (mirrors `useThreeScene.ts` pattern)
- Mobile: pixel ratio capped at `Math.min(window.devicePixelRatio, 1.5)`, no post

### Done when
Glance view feels coherent with audio + instruments. Disabled on mobile by default; a toggle in cockpit enables it.

---

## 10. Testing strategy

Per `.claude/rules/testing.md`:
- Vitest + jsdom. `@testing-library/react` for components.
- Mock Tone.js + Three.js (browser APIs unavailable in jsdom).
- Co-locate `*.test.ts(x)` next to source.

### M1 tests to write (alongside the engine)
- `engine/forces.test.ts`: lift symmetric in roll, drag positive, AoA at level cruise gives expected CL, stall flag flips at AoA > critical.
- `engine/integrate.test.ts`: 30s of full throttle from rest takes off (altitude > 0, airspeed > vStall). With zero throttle in air, plane decelerates and descends. No NaN/Infinity over 5 minutes simulated.
- `hooks/useFlightLoop.test.tsx`: subscribes receive monotonically advancing telemetry; cleanup cancels RAF.

### M3 tests
- `sound/mapping.test.ts`: pure-fn tests over the table. Out-of-range telemetry clamps cleanly.

### M4 tests
- `flightplan/phases.test.ts`: triggers fire on the right telemetry conditions.

---

## 11. Rollout order (recommended)

1. **M1** in one PR-sized commit batch — engine, types, useFlightLoop, Yoke, Throttle, DebugTelemetryHUD, SynthSimApp wiring, M1 tests.
2. **M2** in the next batch — instruments + Cockpit layout + Hud + StallBanner. No new audio.
3. **M3** — sound graph + mapping + telemetry hookup.
4. **M4** — phases + auto-advance.
5. **M5** — AP / DJ mode (largest creative R&D step).
6. **M6** — world view (skippable for v1 ship).

Each batch ends with `npm run build` clean, tests green, and a manual smoke test on a real phone.

---

## 12. Risks + mitigations

| Risk | Mitigation |
|---|---|
| iOS Safari audio gesture blocks | Existing pattern: `Tone.start()` only after first tap. The Pre-flight CTA is the gesture. |
| Mobile RAF jank under load | Cap engine sub-step at 1/30 on mobile, decouple integration step from render frame, never block tick on synth allocations. |
| Touch yoke + throttle z-index conflicts | One canvas-less full-viewport relative div, instruments are absolutely-positioned children; `pointer-events: none` on visual layers. |
| Tone.js zipper noise on continuous params | Always use `rampTo` with 50–200ms smoothing. Skip per-frame writes; bucket changes at 30Hz. |
| Flight model unstable at extreme inputs | Clamp control inputs, clamp velocity to `vNe * 1.2`, hard floor on altitude=0. |
| GPL-3.0 contamination | Confirmed: no new GPL-3.0 deps. All instruments hand-rolled SVG (MIT-clean). |
| Project bloats main repo | `src/synthsim/` stays self-contained; no imports from `biome-synth/`. Extraction stays a 3-step `cp -r` per `DESIGN.md` §11. |

---

## Sources

- [Tone.js Transport docs](https://tonejs.github.io/docs/14.7.39/Transport) — `bpm.rampTo`
- [react-flight-indicators GitHub](https://github.com/skyhop/react-flight-indicators) — license check
- [Jakob Maier — Building a Flight Simulator with JS and Three.js](https://www.jakobmaier.at/posts/flight-simulator-in-javascript/) — simplified flight model reference
- [JSBSim](https://github.com/JSBSim-Team/jsbsim) — fidelity reference (stretch goal)
- [Three.js forum: Simplified Flight Model](https://discourse.threejs.org/t/simplified-flight-model/15058) — community reference

---

**Status**: ready to begin M1 on approval.
