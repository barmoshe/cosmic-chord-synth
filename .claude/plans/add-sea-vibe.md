# Add "Sea" Vibe to Cosmic Chord Synth

## Context

Cosmic Chord Synth currently ships two vibes — SPACE (3D WebGL galaxy via `useThreeScene`) and JUNGLE (2D canvas forest via `useJungleScene`) — selected through `ThemeChooser`. The user wants a third **SEA** vibe: music-reactive waves, schooling fish, and swaying corals/kelp.

Because the audio engine (`useAudioEngine`), DJ autoplay (`useDjAutoPlay`), and section constants are theme-agnostic (verified), the new vibe is purely a **scene + overlay + styling** addition. Following the Jungle precedent keeps scope tight: a 2D canvas scene hook, three DOM overlay components, and a `.theme-sea` style block. All visual reactivity reads the existing FFT analyzer — no new analysis, no new Tone.js nodes.

## Architectural Findings (verified)

- `CosmicTheme` type: `src/components/cosmic-synth/ThemeChooser.tsx:1` — currently `"space" | "jungle"`.
- Theme state + persistence: `src/components/CosmicSynth.tsx:20,46-52,66` (localStorage key `cosmic-synth-theme`).
- Scene mounts are **inline** in `CosmicSynth.tsx:36-44` — `SpaceSceneMount` calls `useThreeScene`, `JungleSceneMount` calls `useJungleScene`. Both take the same `SceneMountProps` (defined lines 22-34).
- Engine interface populated on `engineRef.current` in both scenes: `addRipple, emitParticles, s2w, flash, sectionTransition, triggerDrum, pickDrumStar` (no `camera` in 2D jungle). See `useJungleScene.ts:249-252` and `useThreeScene.ts:511-516`.
- FFT analyzer already exposes `{ bass, mid, treble, high, vol, pitch }` via `analyze()` / `analysisRef` — consumers do **not** compute bands themselves (`useAudioEngine.ts:195-224`).
- Jungle overlays rendered conditionally in `CosmicSynth.tsx:258-264` when `isJungle && phase === "play"`.
- `.theme-jungle` style block: `styles.ts:733-893` (~160 lines).
- DJ sections (from `constants.ts:31-37`): `DRIFT → PULSE → BLOOM → SURGE → DISSOLVE`. `BLOOM` and `SURGE` are valid section names to key visual intensity from.
- Shared utilities: `PARTICLE_POOL`, `RIPPLE_POOL`, `DRUM_STARS`, `isMobile` in `constants.ts`; `clamp`, `haptic`, `m2f`, `noteColor` in `helpers.ts`.

## Files to Create

### 1. `src/components/cosmic-synth/useSeaScene.ts`

2D canvas scene hook mirroring `useJungleScene.ts` structure. Same arguments, same returned engine interface. Only visuals change.

- **Background gradient**: three-stop `#041a2e → #003554 → #00698f`.
- **Waves** (upper ~55% of canvas): two stacked sine polylines rendered as filled paths. Amplitude = `8 + analysisRef.current.bass * 24`. Phase speed also bass-scaled. Tinted teal/cyan with alpha blending for depth.
- **Caustics**: additive radial gradients animated with `sin(t)`, concentrated in the top 40%, brightness scaled by `mid`.
- **Bubbles** (replaces fireflies): ~200 (halved on mobile) upward-drifting circles with sine X-wobble. `vy` scaled by `mid`; fade-out near surface; respawn at bottom.
- **Seafloor band**: cached offscreen canvas (reuses the jungle `mtCanvas` pattern at lines 50-86) — warm sand `#7ec5a3` silhouette with `#2d4a3e` shadow dune.
- **Kelp/coral undergrowth**: cached offscreen canvas with 3-tier branching silhouettes (reuse the fern-cache pattern from jungle lines 88-125). Palette `#ff6b6b, #ff85a1, #a855f7`. Sway at draw time: `sin(t * 0.6 + x * 0.01) * 4 * (1 + bass)`.
- **Drum glyphs**: reuse the jungle drum-glyph geometry (lines 386-482) but reskin as coral/urchin — circular teal core with radial spines extending on `d.pulse`. Labels `K/H/C/S` in white, colors from `DRUM_STARS`.
- **Flash overlay** color: seafoam `#a8e6cf` (instead of jungle's amber `#ffe14d`).
- **Ripple/particle pools**: use `RIPPLE_POOL` and `PARTICLE_POOL` verbatim.
- **Engine interface returned**: same signature — `addRipple(x, y, _z, col, intensity?)`, `emitParticles(x, y, _z, col, count, vel)`, `s2w(x, y) → [x, y, 0]`, `flash`, `sectionTransition`, `triggerDrum`, `pickDrumStar`.
- **Cleanup**: cancel RAF, remove resize listener, null out offscreen canvases.

**Reactivity map (read-only from `analysisRef.current`):**
- `bass` → wave amplitude, wave phase speed, kelp sway magnitude.
- `mid` → bubble rise speed, caustic brightness.
- `high` → scatter burst intensity on spikes (used by `SwimmingFish` via event).
- `flashIntensity` ref → surface-bloom brightening at top of canvas.
- `triggerDrum('kick', …)` → coral-base ripple + sand-puff particles.
- Per-drum `d.pulse` → coral spine extension + glow.

### 2. `src/components/cosmic-synth/SwimmingFish.tsx`

DOM overlay of schooling fish. Mirror the structure of `JumpingMonkeys.tsx`.

- **Props**: `{ visible: boolean }` — matches siblings.
- **Counts**: 20–40 fish in 2–3 schools (desktop); 8–15 in 1 school (mobile, gated via `isMobile`).
- **Behavior**: boid-lite — cohesion + separation + per-frame noise. Flip sprite on X-axis to match heading.
- **Reactivity**: subscribe to engine via a lightweight `requestAnimationFrame` loop that reads `frameCount` / `analysisRef` passed down — mirror the pattern `JumpingMonkeys` uses. On `high > threshold`, briefly boost velocity (scatter).
- **Styling**: absolute-positioned SVG sprites; transform for movement; no inline styles — use Tailwind + a scoped CSS block in `styles.ts` if needed.

### 3. `src/components/cosmic-synth/SeaCorals.tsx`

Static decorative coral clusters along the bottom edge, counterpart to `JungleFlora.tsx`.

- **Props**: `{ visible: boolean }`.
- **Render**: three z-layers (far silhouette / mid detail / near) of SVG coral fans and brain corals.
- **Sway**: CSS keyframe `transform: rotate(…)` with staggered per-cluster `animation-delay`.
- **DJ-section bloom**: brighten during `BLOOM` and `SURGE` if the component can read `djState.section`. If that's awkward, skip — acceptable scope reduction. Check how `JungleFlora` handles this before implementing.
- **Clipping**: `clip-path: inset(60% 0 0 0)` on desktop / `70%` mobile so corals only occupy the seafloor band.

### 4. `src/components/cosmic-synth/FloatingBubbles.tsx`

DOM bubbles rising bottom→top, counterpart to `FloatingBananas.tsx`.

- **Props**: `{ visible: boolean }`.
- **Slots**: 6 bubbles (thin 3 on mobile) with staggered `left / size / duration / delay / bob`.
- **Animation**: copy the drift keyframe shape from `FloatingBananas.tsx:216-262` but vertical (bottom → top) + gentle X-wobble. Opacity fade-out near top.
- **Glyph**: simple SVG circle with highlight arc; no emoji.

## Files to Modify

### `src/components/cosmic-synth/ThemeChooser.tsx`
- Line 1: extend `CosmicTheme = "space" | "jungle" | "sea"`.
- Lines 8-11 `OPTIONS`: append `{ value: "sea", label: "SEA", hint: "Reef + fish + waves" }`.

### `src/components/CosmicSynth.tsx`
- Line 36-44: add inline `SeaSceneMount(p: SceneMountProps) { useSeaScene(...); return null; }` alongside the existing Space/Jungle mounts.
- Line 49 `readStoredTheme`: accept `"sea"` as a valid stored value.
- Line 68: add `const isSea = theme === "sea";` next to `isJungle`.
- Lines 69-70: extend `productName` / `warpText` ternaries — `isSea` → `"SEA SYNTH"` / `"DIVING INTO THE REEF"`.
- Line 212 root wrapper: extend className ternary to `isJungle ? "theme-jungle" : isSea ? "theme-sea" : "theme-space"`.
- Line 212 splash background inline style: extend to `isJungle ? "#0a1f14" : isSea ? "#041a2e" : "#162540"`.
- Lines 218-220 scene-mount render: add `isSea` branch rendering `<SeaSceneMount key="scene-sea" {...sceneProps} />` (keep the `key` pattern for clean remount).
- Lines 258-264: add sibling block `{isSea && phase === "play" && (<><SeaCorals visible /><SwimmingFish visible /><FloatingBubbles visible /></>)}`.

### `src/components/cosmic-synth/styles.ts`
- Append a `.theme-sea` block after the existing `.theme-jungle` block (~after line 893). Mirror the same selector list, change tokens:
  - Splash bg: radial gradient rooted at `#041a2e`.
  - Logo gradient: teal `#7ae582` → seafoam `#a8e6cf`.
  - Warp fill: cyan → coral gradient.
  - Energy fill: 4-stop teal → cyan glow.
  - CTA/arrow ring: cyan outline, dark-navy bg.
  - Scale label: seafoam text + cyan shadow.
  - Axis label: muted teal.
  - Conductor transport/drawer: `rgba(0, 53, 84, 0.55)` glass + cyan border + blur.
  - Active conductor cell: coral outline.
  - Conductor phase: `#ff6b6b`.
  - Cosmic-flash color: seafoam `#a8e6cf` + cyan glow.

### `src/components/cosmic-synth/CosmicDjPanel.tsx`
- Line 209 and wherever `isJungle` is derived: add `const isSea = theme === "sea";`.
- Extend any className/label branching to cover `isSea` where the Jungle branch picks a jungle-specific variant. Where defaults already suffice (no jungle override), leave untouched — the `.theme-sea` CSS cascade will handle styling.

## Reused Utilities (no duplication)

- `PARTICLE_POOL`, `RIPPLE_POOL`, `DRUM_STARS`, `isMobile` — `constants.ts`.
- `clamp`, `haptic`, `noteColor` — `helpers.ts`.
- FFT analysis: `analysisRef`, `analyze()` from `useAudioEngine` — no new `Tone.Analyser`.
- Engine interface signature matches `useJungleScene.ts:249-252` verbatim.
- Offscreen-canvas caching pattern for seafloor/coral art reuses the jungle mountain/fern pattern (`useJungleScene.ts:50-125`).
- Drum-glyph hit-test + pulse rendering reuses the shape at `useJungleScene.ts:386-482`, reskinned.

## Non-goals

- No edits to `useAudioEngine.ts`, `useDjAutoPlay.ts`, or musical `SCALES` / `DJ_SECTIONS` / `DRUM_PATTERNS`.
- No WebGL / post-processing for Sea (stays 2D canvas to match Jungle).
- No new tests — existing suite is theme-agnostic (`useAudioEngine.test.ts` doesn't touch themes). Add only if a test starts referencing `CosmicTheme`.

## Verification

1. **Lint**: `npm run lint` — no new warnings.
2. **Typecheck + build**: `npm run build` — succeeds with no TS errors (this catches the extended `CosmicTheme` union being narrowed correctly at every branch).
3. **Tests**: `npm run test` — existing suite still passes.
4. **Dev server**: `npm run dev` → open `http://localhost:8080`:
   - Select **SEA** in theme chooser. Reload page — `localStorage["cosmic-synth-theme"] === "sea"` persists.
   - Splash shows "SEA SYNTH"; warp overlay reads "DIVING INTO THE REEF".
   - Scene renders: waves (top), caustics, bubbles, seafloor, coral cluster, drum glyphs with `K/H/C/S` labels.
   - Tap empty canvas → ripple appears and a note triggers.
   - Tap a drum glyph → drum fires, coral spines pulse, ripple radiates, haptic on mobile.
   - Enable DJ autoplay: wave amplitude swells with bass, bubbles accelerate on mid, fish scatter on high-frequency hits, kick triggers surface flash, section transitions tint full screen.
   - Switch to SPACE then JUNGLE — canvas clears cleanly on each swap (verified by `key="scene-<theme>"` remount). No ghost frames from sea.
5. **Mobile emulation** (Chrome DevTools iPhone 12): particle / bubble / fish counts drop via `isMobile`; frame rate ≥ 40 fps (visual check — no stutter).
6. **Git**: develop on branch `claude/add-sea-vibe-BdVUr`, commit with descriptive message, push with `-u origin claude/add-sea-vibe-BdVUr`.

## Critical Files — Quick Reference

| File | Role |
|---|---|
| `src/components/cosmic-synth/ThemeChooser.tsx:1,8-11` | extend `CosmicTheme` + `OPTIONS` |
| `src/components/CosmicSynth.tsx:36-44,49,66-70,212,218-220,258-264` | routing, overlays, splash text, background |
| `src/components/cosmic-synth/useJungleScene.ts` (reference only) | structural template for `useSeaScene.ts` |
| `src/components/cosmic-synth/useSeaScene.ts` (new) | 2D canvas scene for Sea |
| `src/components/cosmic-synth/SwimmingFish.tsx` (new) | DOM overlay, fish schools |
| `src/components/cosmic-synth/SeaCorals.tsx` (new) | DOM overlay, coral clusters |
| `src/components/cosmic-synth/FloatingBubbles.tsx` (new) | DOM overlay, rising bubbles |
| `src/components/cosmic-synth/styles.ts` (append after line 893) | `.theme-sea` cascade |
| `src/components/cosmic-synth/CosmicDjPanel.tsx:41,209` | thread `isSea` through any `isJungle` conditionals that need a sea variant |
