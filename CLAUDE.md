# Cosmic Chord Synth

A 3D galaxy you can play like an instrument. Interactive browser-based synthesizer using gesture/touch input with AI DJ mode for generative composition.

## Tech Stack

- **Framework**: React 18 + TypeScript, Vite (dev server on port 8080)
- **Audio**: Tone.js (PolySynth, MembraneSynth, NoiseSynth, MetalSynth, effects chain)
- **3D**: Three.js with custom GLSL shaders, audio-reactive particles
- **Styling**: Tailwind CSS + shadcn/ui (Radix primitives)
- **Testing**: Vitest + jsdom + @testing-library/react
- **Path alias**: `@/` maps to `./src/`

## Commands

```bash
npm run dev        # Start dev server (port 8080)
npm run build      # Production build
npm run test       # Run tests once
npm run test:watch # Watch mode
npm run lint       # ESLint
```

## Project Structure

```
src/
├── components/
│   ├── CosmicSynth.tsx              # Main synth orchestrator
│   ├── CosmicSequencer.tsx          # 8-track step sequencer
│   ├── cosmic-synth/               # Core audio/visual modules
│   │   ├── useAudioEngine.ts       # Tone.js synth + effects init
│   │   ├── useThreeScene.ts        # Three.js 3D scene + animation
│   │   ├── useTouchInput.ts        # Gesture → note triggering
│   │   ├── useGyroscope.ts         # Device motion → modulation
│   │   ├── useDjAutoPlay.ts        # AI DJ generative composition
│   │   ├── constants.ts            # Scales, presets, DJ sections
│   │   ├── types.ts                # AudioEngine, DjState interfaces
│   │   ├── helpers.ts              # MIDI→freq, note colors
│   │   └── shaders.ts              # GLSL galaxy/glow shaders
│   └── ui/                         # shadcn/ui components
├── pages/                          # Route pages (Index, NotFound)
├── hooks/                          # Shared React hooks
├── lib/                            # Utilities (cn() classname merge)
└── test/                           # Test setup + specs
```

## Audio Architecture

Signal chain: Synths → Filter → Effects (Chorus/Delay) → Shared Reverb Bus → Destination.
Drums and Bass are dry (no reverb). Use `Tone.Transport` for all scheduling.
Always dispose Tone.js nodes on cleanup to prevent memory leaks.

## Conventions

- Functional components + React hooks only (no class components)
- Custom hooks in `use*.ts` files, one concern per hook
- Tailwind for all styling; use `cn()` from `@/lib/utils` for conditional classes
- TypeScript interfaces in `types.ts`, helpers in `helpers.ts`
- Mobile-first: reduce particle counts and disable heavy effects on mobile

## Git Workflow

- Mono-branch project: after committing to a feature branch, always fast-forward `main` and `git push origin main`. No PR review flow — main is the single source of truth.

## Scoped Rules

@.claude/rules/react-components.md
@.claude/rules/audio-engine.md
@.claude/rules/three-scene.md
@.claude/rules/testing.md
