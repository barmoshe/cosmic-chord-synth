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

Built on top of M2. **Goal**: make the airplane play itself. Every flight-state knob (throttle, airspeed, altitude, pitch, roll, heading, RPM, gear, flaps, stall, overspeed) is wired into a small Tone.js graph through a `MappingProfile` so the sim becomes a generative instrument.

This is **not** the phase machine — that's M4. M3 ships a **fixed heartbeat pattern** + continuous textures so the mapping is fully demonstrable on its own.

### 6.1 Stance and constraints

- **Self-contained**. `src/synthsim/sound/` imports nothing from `src/components/biome-synth/`. We mirror biome-synth's *patterns* — function-built facade, dispose loop, `rampTo` smoothing, drums-dry routing — but re-implement them. The synthsim folder must remain extractable per `DESIGN.md` §11.
- **No new npm deps**. Tone.js is already in `package.json` from biome-synth.
- **AudioContext starts on user gesture**. Existing `Pre-flight →` button in `Landing.tsx` is the gesture. SynthSimApp awaits `sound.start()` before flipping `phase = "flying"`. No new UI.
- **No `setState` on the audio path**. Same discipline as `useDjAutoPlay`: mutable refs + Transport callbacks.

### 6.2 Files

```
src/synthsim/sound/
├── scales.ts                       8 modes + headingToScale() + scaleStepToMidi()
├── scales.test.ts                  octant partitioning + step wrapping
├── profiles.ts                     LinearCurve / BoolCurve types + DEFAULT_PROFILE
├── profiles.test.ts                shape + bounded ranges
├── mapping.ts                      pure linMap + applyTelemetry() — no Tone.js refs
├── mapping.test.ts                 each setter call asserted on a stub engine
├── audioEngine.ts                  createSoundEngine() factory: function-built facade
└── audioEngine.test.ts             graph construction + ramps + dispose (Tone mocked)

src/synthsim/hooks/
├── useSoundEngine.ts               useMemo + dispose-on-unmount; engine is created lazy
├── useSoundEngine.test.tsx         single-instance + dispose lifecycle
├── useTelemetrySound.ts            flight.subscribe → applyTelemetry per tick
└── useTelemetrySound.test.tsx      subscribe/unsubscribe + ready-gate
```

Modified:
- `src/synthsim/SynthSimApp.tsx` — owns `useSoundEngine`; async `handlePreflight` awaits `sound.start()` before flipping to `flying`; mounts `useTelemetrySound`.
- `src/synthsim/components/Landing.tsx` — `starting` prop disables the button + swaps label to `Starting engines…`.

### 6.3 Audio graph

```
lead   (PolySynth, sawtooth, maxPoly 3)
  → leadFilter (lowpass)
  → distortion   (wet 0 default — gated by stallWarning)
  → vibrato      (depth 0.08, frequency from yawRate)
  → chorus → delay → reverb ─┐
                              │
drone  (Synth, sine, slow)    │
  → droneFilter (cutoff from VS) → reverb ─┤
                                            │
sub    (Synth, sine)                        │
  → subVolume ────────────────────────────────┤
                                              │
kick   (MembraneSynth) ─┐                     │
hat    (MetalSynth)     ├ drumVolume ─────────┤  (drums dry — see audio-engine rule)
                        ┘                     │
                                              ▼
                                         masterPanner
                                              │
                                         bitcrusher (wet 0 default — gated by overspeed)
                                              │
                                         masterComp → limiter → masterVolume → Tone.getDestination()
```

**Param defaults** (mirror biome-synth conventions):
- Reverb: `Freeverb({ roomSize: 0.78, dampening: 3500, wet: 0.3 })`
- Delay: `FeedbackDelay({ delayTime: "8n.", feedback: 0.28, wet: 0 })`
- Chorus: `Chorus({ frequency: 0.6, delayTime: 3.5, depth: 0.4, wet: 0.12 }).start()`
- Compressor: `{ threshold: -18, ratio: 3, attack: 0.003, release: 0.1 }`
- Limiter: `-1 dB`
- BitCrusher: `{ bits: 4, wet: 0 }`
- Distortion: `{ distortion: 0.4, wet: 0 }`
- Vibrato: `{ frequency: 0, depth: 0.08 }` — frequency driven by yawRate; replaces an LFO so static-detune doesn't fight modulation.

### 6.4 SoundEngine facade

```ts
export interface SoundEngine {
  start(): Promise<boolean>;
  dispose(): void;
  isReady(): boolean;
  setMasterGainDb(db: number, rampS?: number): void;
  setMasterPan(p: number, rampS?: number): void;
  setLeadFilterCutoff(hz: number, rampS?: number): void;
  setDroneFilterCutoff(hz: number, rampS?: number): void;
  setReverbWet(w: number, rampS?: number): void;
  setDelayWet(w: number, rampS?: number): void;
  setVibratoRate(hz: number, rampS?: number): void;
  setSubAmplitudeDb(db: number, rampS?: number): void;
  setDistortionWet(w: number, rampS?: number): void;
  setBitcrusherWet(w: number, rampS?: number): void;
  setBpm(bpm: number, rampS?: number): void;
  setDrumGainDb(db: number, rampS?: number): void;
  setLeadOctaveOffset(n: number): void;
  setLeadScale(name: ScaleName): void;
}
```

Internally the factory holds a `nodes` ref (only populated after `start()`) plus a `playbackState` (current scale, octave, arp step) read by Transport callbacks. All ramping setters early-return if `nodes === null`, so it's safe to call them before `start()` resolves.

### 6.5 Heartbeat scheduler

Inside `audioEngine.start()`:

```ts
Tone.Transport.scheduleRepeat((t) => kick.triggerAttackRelease("C2", "16n", t), "4n");
Tone.Transport.scheduleRepeat((t) => hat.triggerAttackRelease("32n", t, 0.6), "8n", "8n");
Tone.Transport.scheduleRepeat((t) => {
  const midi = scaleStepToMidi(SCALES[state.scale], state.arpStep, ROOT_MIDI, state.octaveOffset);
  lead.triggerAttackRelease(Tone.Frequency(midi, "midi").toFrequency(), "16n", t);
  state.arpStep = (state.arpStep + 1) % SCALES[state.scale].steps.length;
}, "8n");

drone.triggerAttack(Tone.Frequency(48, "midi").toFrequency());
sub.triggerAttack(Tone.Frequency(36, "midi").toFrequency());
Tone.Transport.bpm.value = 90;
Tone.Transport.start();
```

The drum heartbeat is gain-gated. At idle on the ground (throttle < 0.1) `mapping.ts` ramps `drumVolume` to `-60 dB`, so the heartbeat is silent without scheduling tricks. The lead arp keeps running quietly (lead voice volume itself is at -10 dB by default).

### 6.6 Mapping (`mapping.ts`)

Pure helpers + `applyTelemetry()` — no Tone.js imports, no side effects on the engine outside the setter calls.

```ts
export const linMap = (v, inMin, inMax, outMin, outMax) => {
  const span = inMax - inMin;
  if (span === 0) return outMin;
  const t = (clamp(v, inMin, inMax) - inMin) / span;
  return outMin + t * (outMax - outMin);
};
```

`applyTelemetry(t, engine, profile)` walks every row of DESIGN.md §4 and calls the matching setter:

| Telemetry | Curve | Output | Ramp |
|---|---|---|---|
| `throttle` | linear | master gain `-60..-6 dB` | 50 ms |
| `throttle` (≥ 0.1) | linear | drum gain `-30..-6 dB` (else `-60`) | 80 ms |
| `airspeedKt` | linear | BPM `60..160` | 200 ms |
| `altitudeFt` | step / 5000 ft | leadOctaveOffset 0..n | discrete |
| `pitchDeg` | linear | leadFilter cutoff `200..8000 Hz` | 80 ms |
| `rollDeg` | linear | masterPan `-1..+1` | 80 ms |
| `yawRateDps` (abs) | linear | vibrato rate `0..8 Hz` | 100 ms |
| `verticalSpeedFpm` | linear | droneFilter cutoff `200..2000 Hz` | 200 ms |
| `rpm` (≥ 0.05) | linear | sub amplitude `-36..-12 dB` (else `-60`) | 80 ms |
| `headingDeg` | step (8 octants) | lead scale (8 modes) | discrete |
| `flaps` | linear | reverb wet `0.20..0.55` | 200 ms |
| `gearDown` | bool | delay wet `0..0.14` | 200 ms |
| `stallWarning` | bool | distortion wet `0..0.7` | 80 ms |
| `overspeed` | bool | bitcrusher wet `0..0.6` | 80 ms |

`scales.ts` provides the eight modes — `[minorPentatonic, dorian, mixolydian, lydian, ionian, aeolian, phrygian, locrian]` — and `headingToScale(deg)` partitions the compass into 45° octants.

### 6.7 Telemetry pump

```ts
// useTelemetrySound.ts
useEffect(() => {
  if (!active) return;
  return flight.subscribe((t) => {
    if (!engine.isReady()) return;
    applyTelemetry(t, engine, profile);
  });
}, [flight, engine, active, profile]);
```

Subscribes via the existing `flight.subscribe` — same source the cockpit uses. Audio runs at 60 Hz physics rate (one tick per `useFlightLoop` step), so continuous params hit `rampTo` ~60 times/sec; the 50–200 ms ramps absorb the discretization without zipper noise.

### 6.8 Audio-start gesture

```tsx
const handlePreflight = async () => {
  setStarting(true);
  try {
    await sound.start();         // Tone.start() then buildGraph()
  } finally {
    setStarting(false);
    setPhase("flying");
  }
};
```

`Tone.start()` is invoked synchronously inside the click handler stack (the click is the user gesture; `await` lets the AudioContext promise resolve). iOS Safari's autoplay policy is satisfied. If the start rejects we still flip to `flying` — the cockpit is still flyable, just silent — and the engine logs to console.

### 6.9 Tests (168 total, +71 over M2)

| File | What it covers |
|---|---|
| `scales.test.ts` | 14 tests: 8 scales structurally valid, octant partitioning, step wrapping (positive + negative) |
| `profiles.test.ts` | 7 tests: linear curves consistent, ramp times bounded 0–500 ms, gain dB sane, BPM bounded, pan in -1..+1, bool outputs in 0..1 |
| `mapping.test.ts` | 19 tests: `linMap` boundaries + clamp + zero-span; every row of the §4 table asserted on a stub engine |
| `audioEngine.test.ts` | 17 tests: lazy init, full graph construction, three Transport scheduleRepeats, drone+sub triggered, every setter ramps the right param at the right time, dispose calls dispose on every node + clears events |
| `useSoundEngine.test.tsx` | 2 tests: stable instance across rerenders, dispose on unmount |
| `useTelemetrySound.test.tsx` | 5 tests: inactive doesn't subscribe, active subscribes + applies, ready-gate skips when not ready, unsubscribe on unmount + on active flip |

Tone.js is mocked in jsdom using the `vi.hoisted()` registry pattern from `useAudioEngine.test.ts:8-80`, extended with `Panner`, `Distortion`, `BitCrusher`, `Vibrato`, and a `Transport` stub (`bpm.rampTo`, `scheduleRepeat`, `start`/`stop`/`clear`).

### 6.10 Verification

`npm run dev`, navigate to `/synthsim`:

1. **Loader → Pre-flight → tap CTA** → button briefly says "Starting engines…", cockpit appears.
2. **Audible faint drone/sub** even at idle on the ground (no drums; throttle 0).
3. **Throttle to 100%**: master gain rises smoothly (no zipper); drum heartbeat fades in once throttle ≥ 0.1.
4. **Yoke up** (pitch climbing): lead filter clearly opens up.
5. **Bank right**: stereo image pans right.
6. **Climb past ~5000 ft sim**: lead arp jumps an octave.
7. **Sustained banking through 360°**: scale mode rotates through 8 modes; each octant feels different.
8. **Pull elevator into stall**: distortion ramps in (clipped tone, "stick shaker"); STALL banner pulses.
9. **Dive past Vne**: bitcrusher ramps in; OVERSPEED banner appears.
10. **iPhone Safari** (real device or emulation): audio starts on tap; no glitches; CPU stays under 30 % (DESIGN.md §3 budget).
11. `npm test` all green (168). `npm run build` clean. No new deps.
12. **Extraction smoke**: `grep -rn "biome-synth" src/synthsim` returns nothing — synthsim is import-clean.

### 6.11 Out of scope (deferred)

- Phase-driven drum patterns (silence/tick/build/fourFloor/pulse/filtered/tight/impact). M3 ships **one** fixed heartbeat — phases land in M4.
- Per-phase energy curves and section transitions (M4).
- ATC/radio FX, granular turbulence layer, TCAS dissonance — listed as v2 in DESIGN.md §4.
- Cockpit-as-modular-synth (DESIGN.md §5): instruments don't double as synth knobs yet — that's M5+.
- Live profile editor UI ("re-patch live"). DEFAULT_PROFILE is hard-coded in M3.

### 6.12 Rollout (executed in one commit)

1. `scales.ts` + test
2. `profiles.ts` + test
3. `mapping.ts` + test (depends on profiles + scales + the SoundEngine type)
4. `audioEngine.ts` + test (Tone mocked)
5. `useSoundEngine.ts` + test
6. `useTelemetrySound.ts` + test
7. `Landing.tsx` `starting` prop
8. `SynthSimApp.tsx` async pre-flight handler + hook wire-up
9. `npm test` + `npm run build`
10. Commit on `claude/plane-website-setup-7znAm`, rebase onto `origin/main` if it has moved, fast-forward `main`, push both

---

## 7. M4 — phase machine + flight plan

Built on top of M3. **Goal**: replace the M3 fixed kick+hat heartbeat with a phase-driven section machine. The simulator becomes a generative composer — phases advance on flight events (taxi → takeoff → climb → cruise → descent → approach → landing → shutdown), each with its own drum pattern + mapping-profile patch.

### 7.1 Stance and constraints

- **Self-contained**, same as M3. `src/synthsim/flightplan/` imports nothing from `src/components/biome-synth/`. We mirror the `DJ_SECTIONS` *pattern* but re-implement.
- **Auto-only**. No manual phase override in M4 (locked decision). Telemetry-driven transitions only.
- **No phase progress widget**. M4 reuses the existing Hud `phase` label — the existing `phase` prop on `<Hud>` becomes dynamic. No new instruments.
- **No new audio voices**. Snare not added in M4 — "impact" pattern is a velocity-boosted kick + reverb-wet bump. Kick + hat only, same as M3.
- **No new npm deps**. Tone, Vitest, Tailwind only.
- **Phase patches override mapping output**. A phase patch beats the M3 telemetry mapping (e.g., PREFLIGHT silences the master gain even if throttle is up). Patches apply *after* `applyTelemetry` each tick.
- **Refs over setState** on the audio path. Same discipline as M3 — phase state lives in a React state for the Hud, but the audio loop reads via a ref to avoid reconciler latency.

### 7.2 Files

```
src/synthsim/flightplan/
├── phases.ts                 PHASES record + TRANSITIONS predicate table
├── phases.test.ts            shape + every predicate exercised
├── drumPatterns.ts           16-step kick/hat grids per pattern key
├── drumPatterns.test.ts      grid invariants + named-pattern shape
├── phaseProfiles.ts          per-phase MappingProfile patch + merge fn
└── phaseProfiles.test.ts     merge respects overrides, base preserved

src/synthsim/hooks/
├── usePhase.ts               state machine: subscribe → predicate → dwell → advance
└── usePhase.test.tsx         starting state, advance triggers, dwell, no flicker
```

Modified:
- `src/synthsim/sound/audioEngine.ts` — replace the fixed M3 heartbeat (`scheduleRepeat 4n` + `8n,8n`) with a single 16-step pattern scheduler reading a `currentPatternRef`. Add `setDrumPattern(key)` + `setLeadEnergy(0..1)` to the facade. `setBpm` already exists.
- `src/synthsim/hooks/useTelemetrySound.ts` — accept `profile` from caller (already does) — caller now passes the *patched* profile.
- `src/synthsim/SynthSimApp.tsx` — wire `usePhase`, pass current phase string to `<Cockpit phase=…>`, derive the patched profile from current phase, hand to `useTelemetrySound`. Drum-pattern key flows to engine via a `useEffect`.
- `src/synthsim/cockpit/Cockpit.tsx` — already accepts `phase` prop; just ensure it's wired (already is).

### 7.3 Phase records — `phases.ts`

Drop the `bars` field from the original sketch — phases advance on **flight conditions**, not on time. We keep a `minDwellSec` (anti-flicker floor) and a `drumPatternKey`.

```ts
export type PhaseName =
  | "PREFLIGHT" | "TAXI" | "TAKEOFF" | "CLIMB" | "CRUISE"
  | "DESCENT" | "APPROACH" | "LANDING" | "SHUTDOWN";

export interface PhaseRecord {
  name: PhaseName;
  energy: number;          // 0..1, reserved for M5 use; M4 reads it for fuel ring etc.
  drumPatternKey: DrumPatternKey;
  minDwellSec: number;     // anti-flicker floor before this phase can exit
}

export const PHASES: Record<PhaseName, PhaseRecord> = {
  PREFLIGHT: { name: "PREFLIGHT", energy: 0.05, drumPatternKey: "silence",   minDwellSec: 0  },
  TAXI:      { name: "TAXI",      energy: 0.15, drumPatternKey: "tick",      minDwellSec: 2  },
  TAKEOFF:   { name: "TAKEOFF",   energy: 0.85, drumPatternKey: "build",     minDwellSec: 4  },
  CLIMB:     { name: "CLIMB",     energy: 0.7,  drumPatternKey: "fourFloor", minDwellSec: 6  },
  CRUISE:    { name: "CRUISE",    energy: 0.6,  drumPatternKey: "pulse",     minDwellSec: 8  },
  DESCENT:   { name: "DESCENT",   energy: 0.65, drumPatternKey: "filtered",  minDwellSec: 6  },
  APPROACH:  { name: "APPROACH",  energy: 0.8,  drumPatternKey: "tight",     minDwellSec: 4  },
  LANDING:   { name: "LANDING",   energy: 0.95, drumPatternKey: "impact",    minDwellSec: 2  },
  SHUTDOWN:  { name: "SHUTDOWN",  energy: 0.05, drumPatternKey: "silence",   minDwellSec: 4  },
};

export interface Transition {
  from: PhaseName;
  to: PhaseName;
  predicate: (t: Telemetry) => boolean;
  sustainSec: number;      // predicate must be continuously true for this long
}

export const TRANSITIONS: Transition[] = [
  { from: "PREFLIGHT", to: "TAXI",
    predicate: (t) => t.throttle > 0.05 || t.rpm > 0.05, sustainSec: 0.5 },
  { from: "TAXI", to: "TAKEOFF",
    predicate: (t) => t.throttle > 0.7 && t.onGround,    sustainSec: 2 },
  { from: "TAKEOFF", to: "CLIMB",
    predicate: (t) => !t.onGround && t.airspeedKt > 50,   sustainSec: 0 },
  { from: "CLIMB", to: "CRUISE",
    predicate: (t) => Math.abs(t.verticalSpeedFpm) < 200, sustainSec: 4 },
  { from: "CRUISE", to: "DESCENT",
    predicate: (t) => t.throttle < 0.4 && t.verticalSpeedFpm < -200, sustainSec: 3 },
  { from: "DESCENT", to: "APPROACH",
    predicate: (t) => t.altitudeFt < 2000,                sustainSec: 0 },
  { from: "APPROACH", to: "LANDING",
    predicate: (t) => t.altitudeFt < 100 || t.onGround,   sustainSec: 0 },
  { from: "LANDING", to: "SHUTDOWN",
    predicate: (t) => t.airspeedKt < 5 && t.onGround,     sustainSec: 3 },
];
```

The `usePhase` hook walks `TRANSITIONS` filtered by `from === currentPhase` each tick.

### 7.4 Drum patterns — `drumPatterns.ts`

Each pattern is a 16-step grid (one bar of 16ths) of velocity values 0..1.

```ts
export type DrumPatternKey =
  | "silence" | "tick" | "build" | "fourFloor"
  | "pulse" | "filtered" | "tight" | "impact";

export interface DrumPattern {
  key: DrumPatternKey;
  kick: number[];          // length 16
  hat:  number[];          // length 16
}

const z = () => Array(16).fill(0);
const at = (positions: number[], vel = 1): number[] => {
  const arr = z();
  for (const p of positions) arr[p] = vel;
  return arr;
};

export const DRUM_PATTERNS: Record<DrumPatternKey, DrumPattern> = {
  silence:   { key: "silence",   kick: z(),                                hat: z() },
  tick:      { key: "tick",      kick: z(),                                hat: at([2,6,10,14], 0.4) },
  build:     { key: "build",     kick: at([0,4,8,12], 0.7),                hat: at([2,6,10,14], 0.6) },
  fourFloor: { key: "fourFloor", kick: at([0,4,8,12]),                     hat: at([2,6,10,14], 0.7) },
  pulse:     { key: "pulse",     kick: at([0,8], 0.85),                    hat: at([4,12], 0.5) },
  filtered:  { key: "filtered",  kick: at([0,4,8,12], 0.6),                hat: at([2,6,10,14], 0.8) },
  tight:     { key: "tight",     kick: at([0,4,8,12]),                     hat: at([0,2,4,6,8,10,12,14], 0.6) },
  impact:    { key: "impact",    kick: at([0], 1.0),                       hat: at([8], 0.4) },
};
```

The pattern scheduler reads `velocity = pattern.kick[step]` and only fires `triggerAttackRelease` when `> 0`.

### 7.5 Phase profile patches — `phaseProfiles.ts`

Per-phase partial mapping-profile overrides. Applied as a deep merge over `DEFAULT_PROFILE`.

```ts
export type PhaseProfilePatch = Partial<{
  masterGainCeilingDb: number;     // hard cap on master gain output regardless of throttle
  drumGainCeilingDb: number;       // hard cap on drum gain output
  reverbWetBoost: number;          // added to reverb wet output (clamped to 1)
  delayWetForce: number;           // forced delay wet (overrides gear-based bool)
  leadFilterCeilingHz: number;     // cap lead filter cutoff (closes brightness in DESCENT)
}>;

export const PHASE_PATCHES: Record<PhaseName, PhaseProfilePatch> = {
  PREFLIGHT: { masterGainCeilingDb: -36, drumGainCeilingDb: -60, reverbWetBoost: 0.05 },
  TAXI:      { masterGainCeilingDb: -20, drumGainCeilingDb: -30 },
  TAKEOFF:   { reverbWetBoost: 0.05 },
  CLIMB:     { reverbWetBoost: 0.15 },
  CRUISE:    { reverbWetBoost: 0.25 },
  DESCENT:   { reverbWetBoost: 0.20, leadFilterCeilingHz: 4000 },
  APPROACH:  { reverbWetBoost: 0.05, delayWetForce: 0.18 },
  LANDING:   { masterGainCeilingDb: -10, reverbWetBoost: 0 },
  SHUTDOWN:  { masterGainCeilingDb: -36, drumGainCeilingDb: -60, reverbWetBoost: 0.4 },
};
```

A pure helper `applyPhasePatch(engine, patch)` runs *after* `applyTelemetry` each tick, calling the relevant setters with patch values (using a 200 ms ramp). The patch always wins because it's the last writer.

### 7.6 Auto-advance — `usePhase.ts`

```ts
export interface PhaseHandle {
  phase: PhaseName;
  patch: PhaseProfilePatch;
  pattern: DrumPattern;
}

export function usePhase(flight: FlightLoopHandle, active: boolean): PhaseHandle {
  const [phase, setPhase] = useState<PhaseName>("PREFLIGHT");
  const dwell = useRef({
    enteredMs: performance.now(),
    candidates: new Map<PhaseName, number>(), // candidate target → first-seen ms
  });

  useEffect(() => {
    if (!active) return;
    return flight.subscribe((t) => {
      const now = performance.now();
      const since = now - dwell.current.enteredMs;
      const phaseRec = PHASES[phase];
      if (since < phaseRec.minDwellSec * 1000) return;

      const candidates = TRANSITIONS.filter((tr) => tr.from === phase);
      for (const tr of candidates) {
        if (tr.predicate(t)) {
          const seen = dwell.current.candidates.get(tr.to) ?? now;
          if (!dwell.current.candidates.has(tr.to))
            dwell.current.candidates.set(tr.to, now);
          if (now - seen >= tr.sustainSec * 1000) {
            dwell.current.enteredMs = now;
            dwell.current.candidates.clear();
            setPhase(tr.to);
            return;
          }
        } else {
          dwell.current.candidates.delete(tr.to);
        }
      }
    });
  }, [flight, active, phase]);

  return useMemo(() => ({
    phase,
    patch: PHASE_PATCHES[phase],
    pattern: DRUM_PATTERNS[PHASES[phase].drumPatternKey],
  }), [phase]);
}
```

The `dwell.candidates` map handles overlapping predicates and per-transition `sustainSec` — without re-rendering. The hook resubscribes when `phase` changes (acceptable cost — handful of times per flight).

### 7.7 audioEngine changes

Replace this M3 block:

```ts
// REMOVE
Tone.Transport.scheduleRepeat((t) => kick.triggerAttackRelease("C2", "16n", t), "4n");
Tone.Transport.scheduleRepeat((t) => hat.triggerAttackRelease("32n", t, 0.6), "8n", "8n");
```

With a single 16-step scheduler reading `currentPatternRef` + a `stepRef`:

```ts
// inside createSoundEngine
let currentPattern: DrumPattern = DRUM_PATTERNS.silence;
let step = 0;

eventIds.push(
  Tone.Transport.scheduleRepeat((time) => {
    if (!nodes) return;
    const k = currentPattern.kick[step];
    const h = currentPattern.hat[step];
    if (k > 0) nodes.kick.triggerAttackRelease("C2", "16n", time, k);
    if (h > 0) nodes.hat.triggerAttackRelease("32n", time, h);
    step = (step + 1) % 16;
  }, "16n"),
);

// New facade method:
setDrumPattern: (pattern: DrumPattern) => { currentPattern = pattern; },
```

The lead arp scheduleRepeat from M3 is unchanged. The pattern only affects drums.

### 7.8 SynthSimApp wire-up

```tsx
const { engine: sound } = useSoundEngine();
const flight = useFlightLoop(flying);
const phase = usePhase(flight, flying);

// Drum pattern follows phase
useEffect(() => {
  if (!flying || !sound.isReady()) return;
  sound.setDrumPattern(phase.pattern);
}, [phase, flying, sound]);

// Mapping pump runs every tick; phase patch is applied last
useTelemetrySound(flight, sound, flying, DEFAULT_PROFILE, phase.patch);
//                                       ^^^^^^^^^^^^^^^  ^^^^^^^^^^^^
//   M4: pump signature gains the patch arg, applies it after applyTelemetry.

<Cockpit flight={flight} phase={phase.phase} />
```

`useTelemetrySound` gains a 5th arg `patch?: PhaseProfilePatch`. The new signature still defaults `profile = DEFAULT_PROFILE` so M3 callers (none external) remain compatible.

### 7.9 Tests (~30 new, total ~198)

| File | What it covers |
|---|---|
| `phases.test.ts` | PHASES has 9 entries; each pattern key is a valid `DrumPatternKey`; TRANSITIONS form a connected chain PREFLIGHT → SHUTDOWN; every predicate fires on a synthetic telemetry sample (and is false on the negation) |
| `drumPatterns.test.ts` | every pattern has `kick.length === 16 && hat.length === 16`; all velocities ∈ [0..1]; `silence` is all zeros; `fourFloor` has kicks at 0,4,8,12; `impact` has a single kick at 0 |
| `phaseProfiles.test.ts` | every phase has a patch entry; patch keys are within the typed union; `applyPhasePatch` calls expected setters with expected ceiling/boost values |
| `usePhase.test.tsx` | starts at PREFLIGHT; PREFLIGHT → TAXI on throttle bump (after sustain); doesn't advance before `minDwellSec`; doesn't flicker (predicate going on/off resets dwell candidates); on phase change, re-subscribes; unsubscribes on unmount + on `active=false` |
| `audioEngine.test.ts` (extension) | `setDrumPattern` swaps the pattern referenced by the 16-step scheduler; `step` advances modulo 16; pattern 0 (silence) fires no triggers |
| `useTelemetrySound.test.tsx` (extension) | when patch is supplied, applyTelemetry runs first, then patch setters; ramp time used for patch is 0.2s |

Tone.js + Transport remain mocked via the same `vi.hoisted` registry from M3 (`audioEngine.test.ts:1-80`). Add `transport.scheduleRepeat` capture so tests can step the 16-step scheduler manually.

### 7.10 Verification

`npm run dev`, navigate to `/synthsim`:

1. **Pre-flight tap → cockpit appears**, Hud shows `PREFLIGHT`. Audio is faint drone/sub only — drums silent, lead silent.
2. **Bump the throttle (any movement)**: phase auto-advances to `TAXI` after ~0.5 s sustained. Hud shows `TAXI`. The "tick" pattern starts (hat-only on offbeats). Reverb is dry.
3. **Throttle to 100 % on the runway**: ~2 s later phase becomes `TAKEOFF`. Drums build, kick pattern thickens.
4. **Liftoff at ~50 kt**: phase becomes `CLIMB` immediately (sustainSec=0). Four-on-the-floor kick. Reverb opens noticeably (CLIMB patch boosts wet by 0.15).
5. **Level off (VS settles to ~0)**: 4 s later phase advances to `CRUISE`. Pulse pattern (kick on 1, hat on 2). The wash is at its widest — this is the chill section.
6. **Throttle back + nose down**: 3 s later phase becomes `DESCENT`. Filtered pattern; lead filter clamps brightness via the patch ceiling.
7. **Below 2000 ft**: phase becomes `APPROACH`. Tight pattern, delay wet forced up — gear-extension echo regardless of gear flag.
8. **Wheels down + below 100 ft / on ground**: phase becomes `LANDING`. Single-hit "impact" kick on 1 of every bar, master gain ceiling at -10 dB punches through.
9. **Roll out (airspeed below 5 kt + on ground for 3 s)**: phase becomes `SHUTDOWN`. Drums drop to silence; reverb tail blooms (patch reverbWetBoost 0.4); plane is silent within ~10 s.
10. **No audible flicker** — going briefly into a stall in CLIMB doesn't kick us back to TAKEOFF; brief altitude bumps in CRUISE don't toggle DESCENT.
11. `npm test` all green (~198). `npm run build` clean.
12. **iPhone 14 Pro emulation**: phase label updates legibly, drums stay tight, no zipper noise on patch transitions (200 ms ramp absorbs them).

### 7.11 Out of scope (deferred)

- Manual phase override — no skip button, no keyboard shortcut.
- Phase progress widget (current → next + dwell bar). The Hud label is enough for M4.
- Per-phase scale or octave bias (heading still drives mode; altitude still drives octave).
- Phase-specific lead arp patterns (silence in PREFLIGHT/SHUTDOWN, denser in CRUISE). M4 keeps the M3 8-note arp constant; phase only varies drums + profile patch.
- Snare voice — patterns use kick + hat only.
- Weather / wind / turbulence layer ("flight plan" knobs in DESIGN.md). M4 is just the phase machine — flight plan sketch is M5+.
- Autopilot + DJ-mode generative composition. That's M5.

### 7.12 Rollout (executed in one commit)

1. `flightplan/drumPatterns.ts` + test (9 tests)
2. `flightplan/phaseProfiles.ts` + test (11 tests, with `applyPhasePatch` helper)
3. `flightplan/phases.ts` + test (16 tests across PHASES + TRANSITIONS + predicates)
4. `audioEngine.ts` — replaced 4n+8n heartbeat with single 16n step scheduler reading `state.pattern`; added `setDrumPattern(pattern)` to facade; test mock now captures Transport.scheduleRepeat callbacks so step-by-step bar simulation is possible
5. `hooks/usePhase.ts` + test (9 tests)
6. `hooks/useTelemetrySound.ts` — added 5th `patch?` arg; pulls profile output values into a context, then runs `applyPhasePatch` after `applyTelemetry`. Test extended (+1 test)
7. `SynthSimApp.tsx` — `useSoundEngine` + `useFlightLoop` + `usePhase` + `useTelemetrySound`. Drum pattern flows to engine via a `useEffect`. `phaseHandle.phase` passed to `<Cockpit>` so the Hud label is dynamic
8. `npm test` (220 passing, +52 over M3) + `npm run build` clean
9. Commit on feature branch, fast-forward main, push both

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
