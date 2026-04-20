# Cheatsheet

Quick "which file do I touch?" reference for the common tasks in this repo.

## Add a new musical scale

1. Extend `SCALES` in `src/components/biome-synth/shared/constants.ts` with `{ label, notes }`.
2. Add the key to `SCALE_ORDER` (order = prev/next cycle order).
3. No engine changes needed — `useTouchInput` and `useDjAutoPlay` both read `SCALES[scaleRef.current]`.

## Change a DJ section parameter

Edit `DJ_SECTIONS[name]` in `shared/constants.ts`. Each section holds bar count, energy, drum-pattern key, filter target, reverb/delay wets, ADSR, note-gen algorithm, and flash color. Don't branch on section name inside `useDjAutoPlay` — tune the section object.

## Add a new drum

1. Extend the `DrumName` union in `shared/types.ts`.
2. Wire the synth in `useAudioEngine.ts` (create the Tone node, connect, dispose).
3. Add a case in `triggerDrum`.
4. Add a row in `DRUM_PATTERNS` in `shared/constants.ts` if the DJ should play it.
5. Add a lane in `DrumLane`/`DrumPattern` (`useDjAutoPlay.ts`) and `LANES` if you want it on the grid.
6. Render the lane in `DjPanel.tsx`.

## Adjust per-theme audio voicing

`THEME_PRESETS[theme]` in `shared/constants.ts` is the one place. `useAudioEngine.setTheme` reads it and retunes lead/sub/pad/drone oscillators, filters, and FX wets. Don't scatter theme branches elsewhere.

## Add a keyboard shortcut

`useKeyboardShortcuts.ts`. It accepts `{ enabled, onToggleDj, onPrevScale, onNextScale, onToggleHelp, onCloseHelp }`. Extend that prop shape, then thread a handler in from `BiomeSynthApp`.

## Read FFT or band energy from a scene

Use the refs passed into your `useXScene` hook:

- `fftBuffer.current` — 128-bin smoothed Float32Array (dB-normalised to 0..1).
- `analysisRef.current.{bass, mid, treble, high, vol, pitch}` — already-smoothed band levels, computed once per frame in `useAudioEngine.analyze()`.

Never instantiate a new analyzer.

## Add a new biome (big task)

Expect to touch:

1. `shared/constants.ts` — extend `ThemeId`, add `THEME_PRESETS[<name>]`, add pattern/scale defaults.
2. `shared/types.ts` — `ThemeId` is re-exported from here.
3. New folder `biome-synth/<name>/` with `background`, `particles`, `ripples`, `drums`, `overlays`, `types`, `utils`.
4. New hook `biome-synth/hooks/use<Name>Scene.ts` composing those modules.
5. New component(s) in `biome-synth/components/` for DOM overlays if the biome needs them.
6. `ThemeChooser.tsx` — add a pill.
7. `BiomeSynthApp.tsx` — add a `<<Name>SceneMount>`, theme-conditional overlay block, palette branch, and warp/product-name strings.
8. `readStoredTheme()` in `BiomeSynthApp.tsx` — include the new id in the whitelist.
9. Add ambient audio under `public/audio/` if `THEME_PRESETS[<name>].ambientUrl` is set.
10. `shared/styles.ts` — theme class `.theme-<name>` if you need theme-scoped CSS.

## Start/stop audio cleanly

- Unlock is done in `BiomeSynthApp.handleStart()` inside the splash tap. `rawContext.resume()` + `Tone.start()` must run synchronously in the gesture handler (iOS Safari gates on this).
- Dispose everything on unmount — `useAudioEngine.dispose()` walks every node.

## Run the tooling

```bash
npm run dev     # dev server on port 8080
npm run build   # production build
npm run lint    # ESLint
npm run test    # Vitest (jsdom)
```

Single-file test run: `npx vitest run src/path/to/file.test.ts`.
