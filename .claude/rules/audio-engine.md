---
paths:
  - "src/components/biome-synth/hooks/useAudioEngine.ts"
  - "src/components/biome-synth/hooks/useSetupEffects.ts"
  - "src/components/biome-synth/hooks/useDjAutoPlay.ts"
  - "src/components/biome-synth/shared/constants.ts"
  - "src/components/biome-synth/shared/types.ts"
---

# Tone.js Audio Engine Rules

- Always use `Tone.Transport` for scheduling — never `setTimeout`/`setInterval` for audio
- Use the shared reverb bus (`Freeverb`) — don't create per-synth reverb instances
- Signal chain: Synth → Filter → Effects → Shared Reverb → `Tone.getDestination()`
- Drums and Bass connect directly to destination (dry, no reverb)
- Always call `.dispose()` on all Tone.js nodes during cleanup to prevent memory leaks
- Start `AudioContext` only on user gesture (browser autoplay policy)
- Use `Tone.now()` for precise timing, not `Date.now()`
- Keep synth voices minimal: `maxPolyphony` ≤ 8 for PolySynth on mobile
- FFT analysis uses 128 bins — don't increase without checking mobile performance
- DJ sections follow: DRIFT → PULSE → BLOOM → SURGE → DISSOLVE (see `DJ_SECTIONS` in `shared/constants.ts`)
- Musical helpers (`m2f`, `noteColor`) are in `biome-synth/shared/helpers.ts` — reuse them
