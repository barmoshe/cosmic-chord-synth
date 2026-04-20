# Biome Scene Rules

Scoped rules for the per-biome render hooks (`useThreeScene`, `useJungleScene`, `useSeaScene`, `useCyberpunkScene`, `useTundraScene`) and their sibling module folders.

## Renderer per biome

| Biome | Hook | Renderer |
|-------|------|----------|
| Space | `useThreeScene` | Three.js / WebGL + GLSL |
| Jungle / Sea / Cyberpunk / Tundra | `use{Theme}Scene` | Canvas2D |

Canvas2D biomes also get DOM overlays from `biome-synth/components/` (e.g. `FloatingBananas`, `NeonRain`). Cyberpunk additionally paints drum flashes to a second canvas (`drumCanvasRef`).

## Module layout per biome

Each biome folder mirrors the same shape:

```
biome-synth/<theme>/
  background.ts      # static/low-freq layers
  particles.ts       # pooled particle systems
  ripples.ts         # pointer-triggered ripples
  drums.ts           # audio-reactive drum visuals
  overlays.ts        # extra layers (rain, bubbles, etc.)
  types.ts           # scene-local types
  utils.ts           # scene-local helpers (often minimal)
```

When adding a new visual, put it in the correct module — don't dump new state into the scene hook.

## Lifecycle contract

- One scene hook is active at a time. `BiomeSynthApp` keys each scene mount with the theme, so switching themes unmounts + remounts — the hook's cleanup must fully dispose.
- Use a single RAF loop per active scene. `rafRef.current = requestAnimationFrame(draw)` and cancel it in cleanup.
- Always dispose Three.js geometries, materials, textures, render targets, and remove the canvas on unmount.
- For Canvas2D, cancel any pending RAF and release any pooled arrays you allocated lazily.

## Audio input

- Scenes read `fftBuffer` (the already-smoothed 128-bin Float32 buffer from `useAudioEngine`) and `analysisRef` (bass/mid/treble/high/vol/pitch).
- Don't create additional `Tone.FFT`, `Tone.Analyser`, or `Tone.Meter` instances — there is one analyzer, fed by `Tone.getDestination()`.
- Don't read from Tone nodes directly; the engine exposes everything a scene needs.

## Mobile budget

- Gate heavy work on `isMobile` from `shared/constants.ts`. Reduce particle pool sizes, skip extra passes, and drop bloom/post layers when true.
- Keep FFT bin count at 128. Raising it requires re-profiling the Canvas2D + Three.js paths.

## Styling

- Visual overlays are pure DOM/CSS. They do **not** read audio refs or touch state; they are toggled by theme.
- GLSL shaders for the space biome live in `shared/shaders.ts` as template literals. Keep vertex and fragment together there.
- Glow/bloom is overlay-div driven (`useGlowOverlays`), not a post-process pass.
