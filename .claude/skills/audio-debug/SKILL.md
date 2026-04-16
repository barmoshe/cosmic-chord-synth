---
name: audio-debug
description: Debug Tone.js audio issues - signal chain, scheduling, context state
context: fork
agent: Explore
---

Investigate and debug audio issues in the Cosmic Chord Synth:

1. **Read the audio engine**: Examine `src/components/cosmic-synth/useAudioEngine.ts` for:
   - AudioContext state (suspended, running, closed)
   - Synth initialization and disposal
   - Effect chain connections (Filter → Chorus → Delay → Reverb → Destination)
   - Transport scheduling patterns

2. **Check the DJ system**: Examine `src/components/cosmic-synth/useDjAutoPlay.ts` for:
   - Note scheduling timing
   - Section transitions
   - Pattern generation logic

3. **Check touch input**: Examine `src/components/cosmic-synth/useTouchInput.ts` for:
   - Note triggering on gesture events
   - Attack/release timing
   - Frequency calculation from position

4. **Common issues to look for**:
   - Tone.js nodes not disposed (memory leak)
   - AudioContext not started on user gesture
   - Transport not started before scheduling
   - Shared reverb bus disconnected
   - Too many polyphony voices causing glitches

5. **Report findings** with specific file paths, line numbers, and suggested fixes.

Use `$ARGUMENTS` as context for what specific audio issue the user is experiencing.
