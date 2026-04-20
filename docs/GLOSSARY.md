# Glossary

Terms in this codebase that are overloaded or easy to confuse. Read this before editing cross-cutting files.

## Lifecycle

- **phase** — The app-level lifecycle in `BiomeSynthApp`: `"splash" | "warp" | "play"`. Not a Tone.js phase, not a DJ phase.
- **warp** — The short intro transition between splash and play. Driven by `warpState.current.t` over ~1 s.
- **section** — A DJ section. Always one of `DRIFT | PULSE | BLOOM | SURGE | DISSOLVE`. Don't call this a "phase" — that word is already taken.

## World

- **biome** and **theme** — Used interchangeably. Current set: `space | jungle | sea | cyberpunk | tundra`. The type alias is `ThemeId` (in `shared/constants.ts`); component-side props call it `BiomeTheme`.
- **preset** — A `THEME_PRESETS[theme]` record with BPM, default scale, lead/pad voicing, FX wets, and ambient URL. One per biome.

## Music

- **scale** — A musical scale key in `SCALES` (e.g. `pentatonic`, `lydian`). `SCALE_ORDER` is the canonical cycle used by prev/next controls.
- **motif** — A short generative melodic seed (array of scale degrees) that the DJ develops into phrases.
- **progression** — A chord progression from `PROGS`, selected per section.
- **voice** — A synth role in the graph: `lead | sub | pad | arp | bass | drone`. Lead/sub/pad/arp/drone are **wet** (through reverb); bass is **dry**.
- **dry vs wet** — Routing decision. Bass and all drums bypass chorus/delay/reverb and go straight to the master bus. Everything else is wet.
- **m2f** — MIDI-to-frequency helper in `shared/helpers.ts`. Always use this instead of `Math.pow(2, ...)` inline.
- **BASE_MIDI** — The lowest playable MIDI note on the touch surface (see `shared/constants.ts`). Screen-x maps to `BASE_MIDI + offset` via `MIDI_RANGE`.

## Input

- **touch** — A live pointer (finger, mouse, or stylus) tracked in `touchesRef`, keyed by `pointerId`. Holds `{ midi, freq, x, y, note, ... }`.
- **gesture** — Any input event pipeline fed by `useTouchInput`. Vertical axis = filter cutoff, horizontal = pitch.

## Visuals

- **ripple** — A short-lived radial emission triggered by a touch or drum hit. Each biome has its own `ripples.ts`.
- **glow / bloom** — The soft halo around active touches. DOM divs painted by `useGlowOverlays`, not a WebGL post-process pass.
- **scene hook** — `useThreeScene` / `useJungleScene` / `useSeaScene` / `useCyberpunkScene` / `useTundraScene`. One active at a time, keyed on theme.

## Audio graph

- **engine facade** — The `AudioEngine` interface (`shared/types.ts`). The single public surface of `useAudioEngine`. Do not reach past it into the raw Tone nodes.
- **shared reverb bus** — One `Tone.Freeverb` instance fed by all wet voices. Per-synth reverb is forbidden.
- **FFT buffer** — The single 128-bin analyzer fed by `Tone.getDestination()`. Exposed as `fftBuffer` (smoothed Float32Array). Do not create a second analyzer.

## Flags

- **isMobile** — The project-wide perf gate in `shared/constants.ts`. Gates particle counts, max polyphony, and expensive passes.
- **engineReady** — True once `engine.current.isReady()` returns true (post user-gesture audio unlock). UI that touches the engine should wait for this.
