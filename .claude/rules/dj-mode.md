# DJ Auto-Play Rules

Scoped rules for editing `biome-synth/hooks/useDjAutoPlay.ts` and anything it reads.

## State and rendering

- `djState` is a **ref**, not React state. It is read and mutated every tick of the Transport callback — pushing it through `useState` would re-render the whole app at audio rate.
- UI updates happen through the `DjUi` adapter (`setPhase`, `setBeat`, `setStep`, `setEnergy`, `onDrumHit`, `setBpm`, `setProgress`). `DjPanel` installs itself into this adapter via `onReady`. Never call `setState` from inside the tick — route it through `DjUi`.
- `userLayerRef` is the manual drum-grid edit layer. Semantics per cell: `NaN` = pass-through (use the generated value), `0` = force mute, `>0` = force hit at that velocity.

## Timing

- Schedule notes with `Tone.Transport` (see `scheduleRepeat` / `schedule`). Never `setTimeout`/`setInterval` for musical timing.
- Visuals that must be in sync with an audio hit go through `Tone.Draw` inside the same callback.
- Use `Tone.now()` for precise times; never `Date.now()` or `performance.now()` for scheduling.

## Section machine

Sections live in `DJ_SECTIONS` in `shared/constants.ts`. Order is fixed:

```
DRIFT → PULSE → BLOOM → SURGE → DISSOLVE → (loop)
```

Each section defines bar count, energy, drum pattern key (indexes `DRUM_PATTERNS`), filter target, reverb/delay wet, lead ADSR, note-generation algorithm, and transition-flash color. If you need new DJ behaviour, prefer tuning a section here over branching inside the tick.

## Per-theme bias

`THEME_PRESETS[theme]` in `shared/constants.ts` supplies the per-biome BPM, scale default, lead/pad voicing, and effect wets. `useDjAutoPlay` reads this when the theme changes — don't hardcode theme-specific branches inside the tick.

## Generators

- `helpers.ts` exposes `genMotif`, `devMotif`, `buildMatrix`, `wPick`, `pick`, `getArpNote`. Prefer these over inline ad-hoc generators.
- Motif state (`motif`, `phrase`, `pp`) lives on `djState`. Keep it there — don't introduce module-level mutable singletons.

## Don'ts

- Don't create a second FFT analyzer — the scene loop reads the shared `fftBuffer` provided by `useAudioEngine`.
- Don't mutate `touchesRef` from the DJ loop; that ref is owned by `useTouchInput`.
- Don't reach into the audio graph directly — go through the `AudioEngine` facade (`triggerDrum`, `triggerLead`, `triggerPadChord`, `triggerBass`, `triggerArp`, `setFilterCutoff`, etc.).
