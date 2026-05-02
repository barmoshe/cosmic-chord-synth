# synthsim — Design

> A flight-simulator that *is* a synthesizer. You don't fly *with* music — flying **is** the music. Throttle is gain, altitude is pitch, attitude is the filter, and the flight plan is the song form.

---

## 1. Concept

`synthsim` reskins an advanced plane simulation system as a sound-synthesis instrument. It runs **mobile-first** in the browser and uses three layered metaphors at once:

1. **Telemetry → synth params (real-time DSP)** — every flight variable continuously modulates a Web Audio parameter.
2. **Cockpit-as-modular-synth** — every cockpit instrument is also a synth module the user can directly manipulate.
3. **Flight = composition arc** — a flight plan (preflight → taxi → takeoff → climb → cruise → descent → approach → landing) drives a generative composition's structure.

The synth is the simulation. There is no "music mode" toggle.

---

## 2. Research summary (what's embeddable)

| System | What it is | Embeddable? | Verdict |
|---|---|---|---|
| **[JSBSim](https://github.com/JSBSim-Team/jsbsim)** | C++ open-source flight dynamics model. 6-DOF, XML-configurable airframes. Used by FlightGear/Outerra. LGPL/GPL. | Native = no. WASM via Emscripten = yes, but the [JSBSim.js port](https://github.com/csbrandt/JSBSim.js) is ~10y stale and CLI-only. | **Stretch goal**: rebuild JSBSim → WASM with a thin JS API for high-fidelity airframes. Not for v1. |
| **[FlyByWire A32NX/A380X](https://github.com/flybywiresim/aircraft)** | Open-source Airbus aircraft for MSFS. Excellent fly-by-wire law modeling, FMS, EFB, ECAM. GPLv3. | No — tightly coupled to MSFS SDK. | **Concept source only**. Mine for cockpit/system-page UI patterns and FBW logic structure. |
| **[FlightGear](https://www.flightgear.org/)** | Desktop sim wrapping JSBSim. | No (desktop). | Reference only. |
| **Three.js + simplified flight model** ([Jakob Maier's writeup](https://www.jakobmaier.at/posts/flight-simulator-in-javascript/), [dimartarmizi/web-flight-simulator](https://github.com/dimartarmizi/web-flight-simulator), [kristoffer-dyrkorn/flightsimulator](https://github.com/kristoffer-dyrkorn/flightsimulator)) | Lift/drag/thrust/gravity vector model, Three.js scene. | Yes. Already proven in browser. | **Primary v1 engine** — write our own, take patterns from these. |
| **[react-flight-indicators](https://github.com/skyhop/react-flight-indicators)** | React fork of jQuery-Flight-Indicators. SVG instruments (attitude, heading, airspeed, altimeter, variometer). MIT. | Yes — drop-in React component. | **Primary cockpit UI library**. |
| **[SIREN](https://github.com/Kizjkre/siren)** | Web Audio sonification framework: data column → synth param mapping. | Yes, but heavyweight. | **Conceptual reference only** — we build a lightweight mapping layer in `sound/`. |
| **[Tone.js](https://tonejs.github.io/)** | Web Audio framework. Already in this repo. | Yes — already present. | **Primary audio engine.** Reuse the patterns from `src/components/biome-synth/`. |

### Decision

- **v1 engine**: lightweight TypeScript-native flight dynamics (~6-DOF: pitch/roll/yaw + 3-axis position + airspeed). Inspired by JSBSim's vector-force model but written fresh in `src/synthsim/engine/`. No WASM dependency.
- **v1 cockpit**: `react-flight-indicators` for primary 6-pack instruments, with custom React modules for synth-specific gauges (filter scope, FFT meter, mod wheel).
- **v1 audio**: Tone.js (already in repo).
- **v1 world**: Three.js (already in repo) — minimal sky/horizon/terrain. Heavy world-rendering is out of scope.
- **Stretch (v2)**: swap engine for fresh JSBSim WASM build; add CesiumJS terrain.

---

## 3. Mobile-first constraints

The user's primary form factor is a phone. Every choice below is filtered through this.

| Constraint | Implication |
|---|---|
| Limited screen real estate | Cockpit is **vertical-stacked**: HUD on top, single primary instrument in the middle, throttle/touch zones on the bottom. Landscape unlocks the full 6-pack. |
| No precise mouse | All instruments are **touch-tunable** (drag to rotate knobs, swipe to set heading). No hover-only affordances. |
| iOS audio gesture | `Tone.start()` only fires on the first user tap (existing pattern from `useAudioEngine.ts`). |
| Battery / thermals | Cap render to 30 FPS on mobile, FFT bins at 128, single Three.js scene with no post-processing. Reuse `isMobile` from `shared/constants.ts`. |
| Touch + audio latency | Use `Tone.Transport` for all musical timing; never `setTimeout`. |
| Notched displays | Respect `safe-area-inset-*` for HUD and bottom throttle. |
| Variable network | App must boot fully offline after first load. No CDN fonts, no remote terrain tiles. |

---

## 4. Telemetry → sound mapping

The flight model emits a `Telemetry` snapshot every frame. The sound layer subscribes and maps each field to a Web Audio parameter via a configurable curve. **All curves are exposed in the cockpit so the player can re-patch live.**

| Telemetry | Range | Synth target | Notes |
|---|---|---|---|
| `throttle` | 0..1 | Master gain + lead voice intensity | Below 0.05 → silence (idle on ground). |
| `airspeed` (kt) | 0..400 | Tempo (60..160 BPM) | Drives `Tone.Transport.bpm`. |
| `altitude` (ft AGL) | 0..40k | Octave shift on lead | Quantized to scale degrees, not continuous. |
| `pitchAngle` (deg) | -30..+30 | Filter cutoff (200..8k Hz) | Nose-up opens the filter. |
| `rollAngle` (deg) | -60..+60 | Stereo pan (-1..+1) | Bank left, sound left. |
| `yawRate` (deg/s) | -10..+10 | Vibrato LFO rate | Tail kicks → wobble. |
| `verticalSpeed` (fpm) | -3000..+3000 | Pitch bend / detune | Climb sharp, descend flat. |
| `engineRpm` (N1) | 0..1 | Sub-bass drone amplitude | Engine roar = bass voice. |
| `heading` (deg) | 0..360 | Scale/mode rotation | Each octant = a new mode. |
| `flapsSetting` | 0..4 | Reverb send | Flaps full = max wet. |
| `gear` | up/down | Delay insert on/off | Gear extension = ducked echo. |
| `stallWarning` | bool | Distortion on lead | "Stick shaker" = clipped tone. |
| `overspeed` | bool | Bit-crusher on master | Going too fast → digital damage. |
| `turbulence` | 0..1 | Granular noise layer | Weather variable from flight plan. |
| `comms` (ATC) | event | Radio-FX vocal sample | Optional; out of v1. |
| `tcas`/`taws` | event | Dissonant interval cluster | Conflict alerts as dissonance. |

A `MappingProfile` in `sound/profiles.ts` is the JSON record that defines all curves. Players unlock new profiles by completing flight phases.

---

## 5. Cockpit-as-modular-synth

Every instrument in the cockpit is **also** a synth module. Tapping/dragging an instrument both controls the aircraft *and* the matching audio parameter — they are the same control surface.

| Cockpit instrument | Aircraft role | Synth role |
|---|---|---|
| Throttle quadrant | Engine power | VCA / master gain |
| Yoke (touch joystick) | Pitch + roll | Filter cutoff (Y) + pan (X) |
| Rudder pedals | Yaw | Vibrato/LFO rate |
| Trim wheel | Pitch trim | Detune |
| Flap lever | Flap setting | Reverb send |
| Gear lever | Gear up/down | Delay bypass |
| Mixture/prop | Fuel/RPM | Wavetable position / oscillator mix |
| Heading bug (HSI) | AP target heading | Scale/mode selector |
| Altitude bug (ALT preselect) | AP target altitude | Octave selector |
| Autopilot panel | Engage AP modes | **Engage DJ mode** (generative composition) |
| Radio panel | ATC freq | Sample triggering / vocal-FX cue |
| Master caution | Warning aggregator | Sidechain compressor trigger |

This is the "instruments are knobs" principle. There is no separate "synth UI tab" — the cockpit is the synth.

---

## 6. Flight = composition arc

A flight plan is a song form. Each phase is a section of a generative track, with its own energy, pattern density, and effect targets. This is the same machinery that already lives in `useDjAutoPlay.ts` — we reuse the section-FSM pattern but replace `DRIFT/PULSE/BLOOM/SURGE/DISSOLVE` with flight phases.

| Phase | Bars | Energy | Drum pattern | Lead role | Notes |
|---|---|---|---|---|---|
| `PREFLIGHT` | 4 | 0.05 | none | none | APU drone, ATIS murmur. Player taps "Start engines". |
| `TAXI` | 4 | 0.15 | tick (hi-hat only) | sparse motif | Engine-RPM rumble. |
| `TAKEOFF` | 8 | 0.4 → 0.85 | builds (kick on every beat by mid-roll) | ascending arp | Airspeed climbs; tempo + filter open dramatically. |
| `CLIMB` | 16 | 0.7 | four-on-floor | melodic phrase | Altitude mapping pushes octave up; reverb opens. |
| `CRUISE` | 32 | 0.6 | pulsing | pad chords + sparse lead | The chill section. AP engaged → DJ mode generates. |
| `DESCENT` | 16 | 0.65 | filtered loop | falling motif | Pitch bend down, filter sweeps closed. |
| `APPROACH` | 12 | 0.8 | tight, syncopated | tense phrase | Glide-slope as pitch drift; ILS beep as click track. |
| `LANDING` | 6 | 0.95 → 0.2 | impact + roll-out | stab → silence | Wheel-touch = downbeat hit; rollout fades. |
| `SHUTDOWN` | 4 | 0.05 | none | shimmer tail | Spool-down resonance; track ends. |

The phase machine lives in `src/synthsim/flightplan/phases.ts`. Like `DJ_SECTIONS` in `shared/constants.ts`, each entry is a record (phase name, bars, energy, drum pattern key, mapping-profile patch).

---

## 7. Architecture

```
src/synthsim/
├── DESIGN.md                   ← this file
├── SynthSimApp.tsx             ← orchestrates: loader → preflight → cockpit
├── styles.ts                   ← palette + keyframes (already exists)
├── components/                 ← splash + chrome (already exists)
│   ├── LoadingScreen.tsx
│   └── Landing.tsx             ← becomes "Pre-flight" screen
├── engine/                     ← FLIGHT DYNAMICS (no audio, no DOM)
│   ├── state.ts                ← Telemetry type, FlightState type
│   ├── forces.ts               ← lift, drag, thrust, gravity calcs
│   ├── integrate.ts            ← RK4 integrator, fixed-step (e.g. 60Hz)
│   ├── airframe.ts             ← Cessna-152-ish defaults, mass, wing area
│   └── controls.ts             ← Control inputs (throttle/elevator/aileron/rudder)
├── sound/                      ← AUDIO (no DOM, no engine internals)
│   ├── audioEngine.ts          ← Tone.js graph (mirrors useAudioEngine.ts)
│   ├── mapping.ts              ← Telemetry → param-mapping curves
│   ├── profiles.ts             ← Named MappingProfile presets
│   └── phaseScheduler.ts       ← Phase FSM → Tone.Transport callbacks
├── cockpit/                    ← UI for instruments + controls
│   ├── Cockpit.tsx             ← Layout (mobile portrait / landscape)
│   ├── Throttle.tsx            ← Touch slider
│   ├── Yoke.tsx                ← Touch joystick (pitch + roll)
│   ├── instruments/            ← react-flight-indicators wrappers + custom
│   │   ├── AttitudeIndicator.tsx
│   │   ├── Airspeed.tsx
│   │   ├── Altimeter.tsx
│   │   ├── HSI.tsx
│   │   ├── Variometer.tsx
│   │   └── FilterScope.tsx     ← custom: shows current filter cutoff
│   ├── AutopilotPanel.tsx      ← Engages DJ generative mode
│   └── MasterCaution.tsx       ← Warnings → sidechain trigger
├── world/                      ← Three.js scene
│   ├── scene.ts                ← Sky, horizon, simple terrain plane
│   ├── aircraft.ts             ← Optional external view of own aircraft
│   └── shaders.ts              ← Sky gradient, fog
├── flightplan/
│   ├── phases.ts               ← Phase FSM (PREFLIGHT → ... → SHUTDOWN)
│   └── plan.ts                 ← Flight-plan generator (route, waypoints, weather)
├── hud/                        ← Minimal overlays
│   ├── Hud.tsx                 ← Top bar: phase, fuel, time
│   └── StallBanner.tsx
└── hooks/
    ├── useBootSequence.ts      ← (already exists)
    ├── useFlightLoop.ts        ← Drives engine.integrate at 60Hz
    ├── useTelemetrySound.ts    ← Subscribes telemetry → sound.mapping.apply
    ├── useTouchControls.ts     ← Aggregates throttle/yoke/pedal touches
    └── usePhase.ts             ← Phase FSM hook
```

### Loop (one frame)

```
useTouchControls  ──► engine.applyControls
useFlightLoop     ──► engine.integrate(dt)  ──► Telemetry
                                                 │
                                                 ├─► useTelemetrySound ──► Tone.js params
                                                 ├─► cockpit instruments (props)
                                                 ├─► world.scene (camera attitude)
                                                 └─► usePhase (auto-advance flight plan)
```

### Boundaries (intentional)

- `engine/` knows nothing about audio or the DOM.
- `sound/` knows nothing about Three.js or React.
- `cockpit/` reads telemetry + sends controls; it does not read engine internals.
- `world/` consumes telemetry only — no DOM listeners.

This keeps the system portable when the project moves to its own repo.

---

## 8. Mobile UX layout

### Portrait (default phone)

```
┌─────────────────────┐
│  HUD (phase, fuel)  │
├─────────────────────┤
│                     │
│  ATTITUDE INDICATOR │   ← single primary instrument, large
│      + horizon      │
│                     │
├─────────────────────┤
│  ASI │ ALT │  HSI   │   ← secondary 3-pack, small
├─────────────────────┤
│      [ YOKE ]       │   ← bottom-left touch joystick
│         + [THROTTLE]│   ← bottom-right vertical slider
└─────────────────────┘
```

### Landscape (rotates to "cockpit" view)

Full 6-pack at center, throttle quadrant on right, yoke on left, AP/radio panel above. This is the "studio" layout for tabletop play.

### Touch model

- One-finger drag on yoke = pitch (Y) + roll (X)
- Two-finger pinch on yoke = rudder (yaw)
- Vertical slide on throttle = power (anywhere on bottom-right zone)
- Tap-and-hold on instrument = "tune" mode (drag to rotate)
- Swipe left/right on phase ribbon = scrub composition (for sandbox mode)

---

## 9. Implementation milestones

Each milestone ships a runnable `/synthsim`. **Mobile-first** smoke test on every milestone (Chrome DevTools mobile emulation + a real phone before merge).

### M0 — boot shell (✅ already done)

`SynthSimApp` + loader + Pre-flight landing. Mobile responsive.

### M1 — engine + telemetry stub

- `engine/` with simplified 6-DOF
- `useFlightLoop` running at 60Hz desktop / 30Hz mobile
- A debug HUD showing live telemetry
- No audio yet, no instruments yet
- **Done when**: tilting touch joystick produces realistic attitude/airspeed numbers in a debug overlay.

### M2 — primary cockpit (mobile portrait)

- `react-flight-indicators` wired to telemetry
- Touch yoke + throttle controls
- Phase HUD (manually advance phase via debug button)
- **Done when**: I can fly a tap-yoke approach on iPhone Safari without missing inputs.

### M3 — sound v1 (telemetry-driven)

- `sound/audioEngine.ts` mirroring biome-synth pattern
- `sound/mapping.ts` with the v1 telemetry table from §4
- Tap-to-start audio gesture on mobile
- **Done when**: throttle drives gain, airspeed drives BPM, altitude shifts pitch, audibly and stably.

### M4 — phase machine + flight plan

- `flightplan/phases.ts` FSM
- Auto-advance on telemetry triggers (e.g. wheels-up → TAKEOFF→CLIMB)
- Phase changes mutate the active mapping profile
- **Done when**: a complete preflight→shutdown demo plays an evolving track.

### M5 — autopilot = DJ mode

- AP-engage hands flight to a generative pilot
- AP modes (HDG/ALT/APP) become musical controls (mode/octave/intensity)
- Reuse `useDjAutoPlay`-style ref-based section state
- **Done when**: one tap engages AP and the simulator generates a 4-minute composition that flies itself to landing.

### M6 — world view (optional polish)

- Three.js sky/horizon synced to attitude
- Day/night cycle bound to time-of-day in flight plan
- **Done when**: external glance view feels coherent with the audio + instruments.

### Stretch — JSBSim WASM swap

- Rebuild JSBSim with modern Emscripten
- Replace `engine/` with a thin TS adapter over the WASM module
- Default airframe: C-172 from JSBSim's stock library
- Worth it only if v1 fidelity feels too coarse.

---

## 10. Reuse from `cosmic-chord-synth`

The synth app's patterns directly apply. We **copy patterns**, not files (the new repo can't import from `biome-synth/`).

| What | From | What for |
|---|---|---|
| Tone.js graph: synth → filter → effects → reverb → destination | `src/components/biome-synth/hooks/useAudioEngine.ts` | `src/synthsim/sound/audioEngine.ts` |
| Section FSM with bars/energy/drum pattern | `src/components/biome-synth/hooks/useDjAutoPlay.ts` + `DJ_SECTIONS` | `src/synthsim/flightplan/phases.ts` |
| Mobile gating via `isMobile` | `src/components/biome-synth/shared/constants.ts` | `src/synthsim/engine/integrate.ts` (rate cap), `src/synthsim/world/scene.ts` |
| Ref-based state for audio-rate updates | `useDjAutoPlay.ts` (`djState` ref) | `src/synthsim/hooks/useFlightLoop.ts` (`flightStateRef`) |
| `m2f`, `noteColor`, `clamp`, `haptic` helpers | `src/components/biome-synth/shared/helpers.ts` | `src/synthsim/sound/mapping.ts` |

---

## 11. Repo extraction (what `HANDOFF.md` used to cover)

When `synthsim` graduates to its own repo:

1. `cp -r src/synthsim <new-repo>/src/synthsim`
2. Add deps to the new `package.json`: `react`, `react-dom`, `react-router-dom` (only if multi-page), `clsx`, `tailwind-merge`, `tailwindcss`, `tone`, `three`, `react-flight-indicators`.
3. Replace `cn()` import with a local copy (one-liner: `clsx` + `twMerge`).
4. Mount `<SynthSimApp />` directly from the new repo's `main.tsx` — no router needed unless multi-page.
5. Delete `src/synthsim/`, `src/pages/Synthsim.tsx`, and the two `App.tsx` lines from this repo.

The folder is **already** designed to be lift-out-ready: no imports from `biome-synth/`, no shared state with the synth app.

---

## 12. Open questions

- [ ] **Airframe**: do we ship a single Cessna-152-ish, or pick something more characterful (J3 Cub, Spitfire, A320)? Affects the "voice" of the synth via mass/lift curves.
- [ ] **Sandbox vs guided**: is the v1 default a free-flight sandbox or a guided "flight school" that walks the player through phases? Recommendation: guided first, sandbox unlocks after one completed flight.
- [ ] **External controllers**: support WebMIDI / Web Gamepad in v1, or v2? Recommendation: v2.
- [ ] **Multiplayer**: not in this design. Out of scope.
- [ ] **Co-pilot LLM voice**: ATC/co-pilot voice driven by an LLM endpoint? Cool, but gated behind a feature flag — needs a backend.

---

## Sources / inspiration

- JSBSim — https://github.com/JSBSim-Team/jsbsim
- JSBSim.js (stale Emscripten port) — https://github.com/csbrandt/JSBSim.js
- FlyByWire A32NX — https://github.com/flybywiresim/aircraft
- Jakob Maier, "Building a Flight Simulator with JS and Three.js" — https://www.jakobmaier.at/posts/flight-simulator-in-javascript/
- web-flight-simulator — https://github.com/dimartarmizi/web-flight-simulator
- react-flight-indicators — https://github.com/skyhop/react-flight-indicators
- SIREN sonification framework — https://github.com/Kizjkre/siren
- Tone.js — https://tonejs.github.io/
