# Add "Sea" Vibe to Cosmic Chord Synth

## Context

Cosmic Chord Synth already ships two vibes — **SPACE** (3D WebGL galaxy) and **JUNGLE** (2D canvas forest) — selectable via `ThemeChooser`. The user wants a third **SEA** vibe with music-reactive waves, schooling fish, and swaying *almogs* (corals/kelp). Per the project's existing architecture, vibes are purely **scene + styling**; the audio engine and DJ structure stay shared. This vibe will follow the Jungle pattern (2D canvas scene + overlay sprite components) for fastest shipping and mobile-safe performance, with deep music-reactivity so waves/fish/corals "dance" with the music.

Implementation note (post-plan): the sea scene will be **reinvented with real water physics** (1D wave-equation surface heightfield, spring-damped coral sway, boid-based fish schools, buoyancy-driven bubbles) rather than a direct copy of Jungle. Same engine interface, same 2D canvas approach — but the visuals are driven by simulation, not static sprite animations.

## Architecture recap (existing)

- `CosmicTheme` type lives in `src/components/cosmic-synth/ThemeChooser.tsx:1` (currently `"space" | "jungle"`).
- `CosmicSynth.tsx` owns the `theme` state + `localStorage` key `cosmic-synth-theme`, renders `SpaceSceneMount` or `JungleSceneMount` with `key={scene-<theme>}` for clean remount.
- Each scene hook implements the same engine interface exposed on `engineRef.current`: `addRipple`, `emitParticles`, `pickDrumStar`, `triggerDrum`, `sectionTransition`, `flash`, `s2w`.
- Styling overrides live in `src/components/cosmic-synth/styles.ts:733+` under a `.theme-jungle` scope; the default (space) rules apply otherwise.
- `CosmicDjPanel` receives `theme` prop (`CosmicDjPanel.tsx:41,209`) and branches on `isJungle`.
- Jungle overlays: `JungleFlora.tsx`, `JumpingMonkeys.tsx`, `FloatingBananas.tsx` — rendered conditionally in `CosmicSynth.tsx:258-264` when `isJungle`.

## Scope

### 1. Type & chooser
**File**: `src/components/cosmic-synth/ThemeChooser.tsx`
- Line 1: extend `CosmicTheme = "space" | "jungle" | "sea"`.
- Lines 8-11: add option `{ value: "sea", label: "SEA", hint: "Reef + fish + waves" }`.

### 2. Theme routing
**File**: `src/components/CosmicSynth.tsx`
- Line 49: accept `"sea"` in `readStoredTheme`.
- Lines 68-70: derive `isSea`; add `productName` / `warpText` branches ("SEA SYNTH" / "DIVING INTO THE REEF").
- Line 212 background: add sea color `#041a2e` for `isSea`.
- Lines 218-220: render new `<SeaSceneMount key="scene-sea" {...sceneProps} />` branch using `useSeaScene`.
- Lines 258-264: alongside jungle block, add `{isSea && (<><SeaCorals ... /><SwimmingFish ... /><FloatingBubbles ... /></>)}`.
- Update root wrapper class: `isJungle ? "theme-jungle" : isSea ? "theme-sea" : "theme-space"`.

### 3. New scene hook (reinvented with water physics)
**Create**: `src/components/cosmic-synth/useSeaScene.ts`

Same 2D canvas + engine-interface contract as Jungle, but the visuals are driven by simulation:

- **Underwater perspective**. Top ~18% = sky/above-water horizon. Wave surface is a physical 1D heightfield (~128 samples) solved with the discrete wave equation (`h_next[i] = 2h[i] - h_prev[i] + c²(h[i-1] - 2h[i] + h[i+1])`), damped each step. Continuous gentle driving from sine sum + stochastic gusts.
- **Interactive waves**. `addRipple(x, ...)` injects a localized displacement into the heightfield so taps create real propagating waves. Bass FFT modulates wave amplitude + propagation speed.
- **Caustics**. Projected from the wave heightfield onto the seafloor: sum the local height + slope to compute refracted brightness, drawn as soft bright bands.
- **Boid fish** (drawn in canvas, not DOM). 30-60 fish (15-25 on mobile) with cohesion / separation / alignment forces, soft-edged world wrap, direction-aware fish glyph (triangle body + forked tail). Drum hits inject a scatter impulse at the hit point.
- **Bubbles**. Physics-driven: rising buoyancy velocity scaled by `mid` FFT, horizontal wobble from low-frequency noise, shrink + pop at the wave surface (compute `h(x)` at their x position, pop when above). Kick drum spawns a burst from the seafloor.
- **Coral (almogs)**. Each coral cluster is a branching multi-segment chain; segment angles are spring-damped: `angVel += k*(target - angle) - d*angVel`. Drum hits inject angular impulses; bass drives base-angle oscillation. Drawn with layered gradient strokes in coral/pink/purple palette.
- **Drum glyphs = sea anemones**. 4 anemones along the seafloor reef (replacing the jungle hibiscus glyphs). Each has radial tentacles that retract/extend on `d.pulse`, a pulsing core, and the K/H/C/S label on the core.
- **Light rays**. Additive-blended cones descending from random surface positions, slowly drifting, intensity scaled by `flashIntensity`.
- **Warp overlay**. Radial cyan → teal → seafoam gradient (vs. jungle's lime-amber).
- **Flash overlay**. Seafoam `#a8e6cf` (vs. jungle's amber).
- Cleanup: cancel RAF, remove listeners, null `engineRef`, clear the main canvas.

### 4. Music-reactivity mapping (read-only from existing FFT)
- `bass` → wave-surface amplitude + propagation speed + coral base-angle sway.
- `mid` → bubble rise speed + caustic brightness.
- `high` → fish swim speed + scatter sensitivity.
- `flashIntensity` → surface / light-ray bloom.
- `triggerDrum(kick)` → surface wave impulse at x(anemone) + bubble burst + sand-puff flash.
- `d.pulse` (per-drum) → anemone tentacle extension + glow.
- No changes to `useAudioEngine.ts`, `useDjAutoPlay.ts`, or `constants.ts`. Audio remains theme-agnostic (matches Jungle).

### 5. Overlay sprite components (parallel to Jungle trio)
**Create** (functional components per `.claude/rules/react-components.md`, props interface above each):
- `src/components/cosmic-synth/SwimmingFish.tsx` — DOM-layer decorative fish far in the background, CSS-animated silhouettes. The canvas boids handle the close/mid layer; this overlay adds depth with distant silhouettes.
- `src/components/cosmic-synth/SeaCorals.tsx` — static decorative SVG coral clusters pinned along the bottom edge (almogs + kelp fans), gentle CSS sway.
- `src/components/cosmic-synth/FloatingBubbles.tsx` — DOM bubbles rising from bottom (counterpart to `FloatingBananas` but simpler — no peel animation).

Each overlay takes `visible: boolean` matching sibling components.

### 6. DJ panel sea theming
**File**: `src/components/cosmic-synth/CosmicDjPanel.tsx`
- The `theme` prop already types `CosmicTheme`; adding `"sea"` to the union needs no code change here. All sea-specific styling is handled via the `.theme-sea` CSS scope on the root element.

### 7. Styles
**File**: `src/components/cosmic-synth/styles.ts`
- Add a `.theme-sea` block mirroring the `.theme-jungle` block: splash background `#041a2e`, logo teal `#7ae582`, warp fill cyan→coral, energy fill teal, CTA ring cyan, active theme chooser dot coral, scale label seafoam, axis labels muted teal, conductor cells `rgba(0,53,84,0.55)` with coral active highlight, phase text `#ff6b6b`. Same selector list — only color tokens change.

### 8. Splash background color
`CosmicSynth.tsx:212` inline style — extend ternary for sea: `isJungle ? "#0a1f14" : isSea ? "#041a2e" : "#162540"`.

## Files created
- `src/components/cosmic-synth/useSeaScene.ts`
- `src/components/cosmic-synth/SwimmingFish.tsx`
- `src/components/cosmic-synth/SeaCorals.tsx`
- `src/components/cosmic-synth/FloatingBubbles.tsx`

## Files modified
- `src/components/cosmic-synth/ThemeChooser.tsx` (type + option)
- `src/components/CosmicSynth.tsx` (routing, overlays, bg color, text)
- `src/components/cosmic-synth/styles.ts` (`.theme-sea` block)

## Reused utilities (no duplication)
- `PARTICLE_POOL`, `RIPPLE_POOL`, `DRUM_STARS`, `isMobile` from `constants.ts`.
- `clamp`, `haptic` from `helpers.ts`.
- FFT analysis via existing `analysisRef` / `analyze()` — no new analyzer.
- Engine interface (`addRipple`, `emitParticles`, etc.) identical signature to Jungle/Space.

## Verification

1. `npm run lint` — no new warnings.
2. `npm run test` — existing suite passes.
3. `npm run dev` → open `http://localhost:8080`:
   - Toggle to **SEA** in theme chooser; confirm localStorage persists across reload.
   - Splash reads "SEA SYNTH"; warp reads "DIVING INTO THE REEF".
   - Scene renders an animated wave surface, rising bubbles, swaying corals + kelp, schooling fish, and 4 anemone drum glyphs along the seafloor.
   - Tap anywhere — a ripple appears, a wave actually propagates across the surface heightfield, a note triggers, bubbles rise.
   - Tap drum anemones — drum fires, anemone tentacles pulse, wave impulse at the anemone's x.
   - Enable DJ (autoplay) — wave amplitude swells with bass; bubbles accelerate on mid; fish scatter on hi-hat/snare; kick triggers surface flash + coral glow.
   - Switch back to Space/Jungle — canvas fully clears, no leftover sea artifacts (verified by the `key={scene-<theme>}` remount).
4. Mobile check (DevTools device emulation): particle counts drop via `isMobile`; frame rate ≥ 40fps.
5. `npm run build` — production bundle builds with no TS errors.

## Non-goals

- No changes to `useAudioEngine.ts`, `useDjAutoPlay.ts`, or musical `SCALES`/`DJ_SECTIONS`. The brief says "integrate … with the music" — interpreted as **visuals driven by existing FFT/drum signals**, matching Jungle's precedent. If a sea-specific scale or preset is desired later, it's a follow-up.
- No new post-processing / WebGL for sea (2D canvas keeps parity with Jungle and avoids Three.js setup cost for the new theme).
