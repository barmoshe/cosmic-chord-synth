# Biome Synth

A playable world. Interactive browser-based synthesizer with five biomes (space, jungle, sea, cyberpunk, tundra), gesture/touch input, and AI DJ mode for generative composition.

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
│   ├── BiomeSynthApp.tsx                # Main synth orchestrator (composes hooks + overlays)
│   ├── NavLink.tsx                      # Router-aware nav link
│   ├── biome-synth/                     # Core audio/visual system
│   │   ├── components/                  # Visual TSX overlays (DOM-based, not WebGL)
│   │   │   ├── DjPanel.tsx              # DJ mode controls UI
│   │   │   ├── HelpOverlay.tsx          # First-run instructions
│   │   │   ├── ThemeChooser.tsx         # Biome switcher
│   │   │   ├── FloatingBananas.tsx, JumpingMonkeys.tsx, JungleFlora.tsx
│   │   │   ├── FloatingBubbles.tsx, SeaCorals.tsx, SwimmingFish.tsx
│   │   │   └── HologramBillboards.tsx, NeonRain.tsx, NeonSkyline.tsx
│   │   ├── hooks/                       # Audio + scene React hooks
│   │   │   ├── useAudioEngine.ts        # Tone.js synths + graph construction
│   │   │   ├── useSetupEffects.ts       # Effects chain + shared reverb bus
│   │   │   ├── useDjAutoPlay.ts         # Generative DJ composition
│   │   │   ├── useTouchInput.ts         # Gesture → note triggering
│   │   │   ├── useKeyboardShortcuts.ts  # Keyboard bindings
│   │   │   ├── useGlowOverlays.ts       # CSS glow/bloom on touch
│   │   │   ├── useThreeScene.ts         # Space biome (WebGL / Three.js)
│   │   │   ├── useJungleScene.ts        # Jungle biome (Canvas2D)
│   │   │   ├── useSeaScene.ts           # Sea biome (Canvas2D + wave sim)
│   │   │   ├── useCyberpunkScene.ts     # Cyberpunk biome (Canvas2D)
│   │   │   └── useTundraScene.ts        # Tundra biome (Canvas2D + aurora)
│   │   ├── shared/                      # Reusable primitives
│   │   │   ├── constants.ts             # Scales, presets, DJ sections, isMobile
│   │   │   ├── helpers.ts               # m2f, noteColor, clamp, haptic
│   │   │   ├── types.ts                 # AudioEngine, AnalysisData, DrumName
│   │   │   ├── shaders.ts               # GLSL vertex/fragment for space biome
│   │   │   └── styles.ts                # Per-biome palette + UI tokens
│   │   ├── space/                       # Space-biome rendering modules (Three.js)
│   │   ├── jungle/                      # Jungle-biome rendering modules (Canvas2D)
│   │   ├── sea/                         # Sea-biome rendering modules (Canvas2D)
│   │   ├── cyberpunk/                   # Cyberpunk-biome rendering modules (Canvas2D)
│   │   └── tundra/                      # Tundra-biome rendering modules (Canvas2D)
│   ├── home/                            # Landing-page pieces (HomeBackdrop, HomeHero)
│   └── ui/                              # shadcn/ui components
├── pages/                               # Home.tsx, Play.tsx, NotFound.tsx
├── hooks/                               # Generic hooks (use-mobile, use-toast)
├── lib/                                 # Utilities (cn() classname merge)
└── test/                                # Test setup + shared specs
```

A walkthrough of the audio signal chain, scene pipeline, and DJ phases lives in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Quick-reference files for Claude: [`docs/CHEATSHEET.md`](docs/CHEATSHEET.md) (which-file-do-I-touch by task) and [`docs/GLOSSARY.md`](docs/GLOSSARY.md) (overloaded terms like phase/section/biome/voice).

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
@.claude/rules/scenes.md
@.claude/rules/dj-mode.md
@.claude/rules/testing.md
