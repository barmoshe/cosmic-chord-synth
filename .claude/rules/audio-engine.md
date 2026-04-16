---
paths:
  - "src/components/cosmic-synth/useAudioEngine.ts"
  - "src/components/cosmic-synth/useDjAutoPlay.ts"
  - "src/components/cosmic-synth/constants.ts"
  - "src/components/cosmic-synth/types.ts"
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
- DJ sections follow: INTRO → VERSE → BUILD → DROP → BREAK → BUILD2 → PEAK → OUTRO
- Musical helpers (`m2f`, `noteColor`) are in `helpers.ts` — reuse them
