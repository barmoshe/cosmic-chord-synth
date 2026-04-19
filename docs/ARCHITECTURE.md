# Architecture

A walkthrough of how input, audio, and the four biome scenes fit together. For directory layout see [`CLAUDE.md`](../CLAUDE.md); for scoped rules see [`.claude/rules/`](../.claude/rules).

## Entry point

`BiomeSynthApp.tsx` is the single orchestrator. It composes the hooks below, owns theme state, and mounts the visual overlays from `biome-synth/components/`. Routing is handled by `src/pages/` (`Home`, `Play`, `NotFound`); `/play` is what loads `BiomeSynthApp`.

## Audio signal chain

Built in `biome-synth/hooks/useAudioEngine.ts`. Every node is disposed on unmount.

```
lead  ──┐
sub   ──┴─► leadFilter ───► chorus ──► delay ──┐
arp   ────► arpFilter  ───────────────► delay ─┤
pad   ────► padFilter  ────────────────────────┤
drone ────► droneFilter ───────────────────────┴─► Freeverb ──┐
                                                              │
bass  ────► bassFilter ───────────────────────────────────────┤
kick  ────────────────────────────────────────────────────────┤
snare ────► snareFilter ──────────────────────────────────────┤
hihat ─────────────────────────────────────────────────────── │
clap  ────► clapFilter ───────────────────────────────────────┤
ambient ──► ambientVolume ────────────────────────────────────┘
                                                              ▼
                                              masterComp ──► masterLimiter ──► destination
                                                                                   │
                                                                                   ▼
                                                                              FFT (128 bins)
```

- **Wet path** (lead, sub, pad, arp, drone): per-synth filter → chorus/delay → shared `Freeverb` bus.
- **Dry path** (bass + all drums + ambient): filter (if any) → master compressor, bypassing chorus/delay/reverb.
- **FFT tap**: `Tone.getDestination()` feeds a 128-bin `Tone.FFT` read every frame by the scene hooks. Don't create additional analyzers.
- **Scheduling**: everything uses `Tone.Transport` (and `Tone.Draw` for visuals synced to audio). Never `setTimeout`/`setInterval` for timing.
- **Start**: `AudioContext` is resumed only on user gesture in `BiomeSynthApp`.

## Scene pipeline

One active biome at a time. Four scene hooks, each lazy-enabled by theme:

| Biome | Hook | Renderer | Module folder |
|-------|------|----------|---------------|
| Space | `useThreeScene` | Three.js (WebGL + GLSL) | `biome-synth/space/` |
| Jungle | `useJungleScene` | Canvas2D | `biome-synth/jungle/` |
| Sea | `useSeaScene` | Canvas2D + wave sim | `biome-synth/sea/` |
| Cyberpunk | `useCyberpunkScene` | Canvas2D | `biome-synth/cyberpunk/` |

Each biome folder holds the same kinds of modules — `background`, `particles`, `ripples`, `drums`, `overlays`, plus its own `types.ts` and (usually) `utils.ts`. The scene hook composes those modules and drives them from the RAF loop, reading the FFT for audio-reactive motion.

GLSL shaders for the space biome live in `biome-synth/shared/shaders.ts`. All Three.js geometries, materials, textures, and render targets are disposed on unmount.

## DJ mode

`biome-synth/hooks/useDjAutoPlay.ts` is a generative composer that schedules notes on `Tone.Transport`. It cycles through five phases defined by `DJ_SECTIONS` in `shared/constants.ts`:

```
DRIFT → PULSE → BLOOM → SURGE → DISSOLVE → (loop)
```

Each section is a preset — bar count, energy, drum pattern, filter target, reverb/delay wet, ADSR, note-generation algorithm, and a transition-flash color. The UI is `components/DjPanel.tsx`.

## Input and data flow

```
touch/mouse ──► useTouchInput ──► audio engine ──► Tone destination ──► FFT
keyboard    ──► useKeyboardShortcuts ─┘                                  │
                                                                         ▼
                                                       useThreeScene / useJungleScene /
                                                       useSeaScene / useCyberpunkScene
                                                                         │
                                                                         ▼
                                                          visual overlays (biome-synth/components/)
                                                          glow bloom (useGlowOverlays)
```

- `useTouchInput` maps pointer coordinates → MIDI → frequency via `m2f`, picks a note color with `noteColor`, and triggers the engine.
- `useGlowOverlays` paints CSS bloom per active touch — overlay divs, not a post-process pass.
- Visual overlays in `biome-synth/components/` (e.g. `FloatingBananas`, `NeonRain`) are pure, stateless CSS-animated layers toggled by the active theme.

## Mobile performance

The `isMobile` flag in `shared/constants.ts` is the single source of truth for perf gating. Particle pools, galaxy star counts, and post-processing passes all check it. Keep `PolySynth.maxPolyphony ≤ 8` on mobile and don't raise the FFT bin count without re-profiling.
