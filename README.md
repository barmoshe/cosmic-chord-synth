# Cosmic Chord Synth

A 3D galaxy you can play like an instrument. Touch to create music, or let the AI DJ compose. Every sound shapes the cosmos.

## Quick Start

```bash
npm install
npm run dev      # Opens on http://localhost:8080
```

## Tech Stack

- **React 18** + TypeScript + Vite
- **Tone.js** — Audio synthesis, effects, sequencing
- **Three.js** — 3D galaxy visualization with custom GLSL shaders
- **Tailwind CSS** + shadcn/ui — Styling and UI components

## Features

- Interactive 3D galaxy that responds to touch/mouse input
- Real-time audio synthesis with customizable effects chain
- AI DJ mode with generative composition across 8 musical sections
- 8-track step sequencer with drum and melodic patterns
- Gyroscope support for device-motion-controlled modulation
- Audio-reactive particle visualization
- Mobile-optimized with adaptive performance

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 8080) |
| `npm run build` | Production build |
| `npm run test` | Run test suite |
| `npm run lint` | Lint with ESLint |

## Working with Claude Code

This repo is fully configured for Claude Code with:

- **`CLAUDE.md`** — Project context, architecture, and conventions
- **`.claude/rules/`** — Scoped coding rules for React, Tone.js, Three.js, and testing
- **`.claude/skills/`** — Custom slash commands:
  - `/dev` — Start dev server
  - `/test` — Run tests
  - `/lint-fix` — Lint and auto-fix
  - `/build-check` — Typecheck + production build
  - `/audio-debug` — Debug Tone.js audio issues
- **`.claude/agents/`** — Specialized subagents:
  - `code-reviewer` — Reviews for quality, performance, security
  - `audio-specialist` — Tone.js debugging and optimization
- **`.claude/hooks/`** — Auto-formatting on save, destructive command protection
- **`.claude/settings.json`** — Permissions and hook configuration

## License

MIT
