---
paths:
  - "src/components/biome-synth/hooks/useThreeScene.ts"
  - "src/components/biome-synth/hooks/useJungleScene.ts"
  - "src/components/biome-synth/hooks/useSeaScene.ts"
  - "src/components/biome-synth/hooks/useCyberpunkScene.ts"
  - "src/components/biome-synth/hooks/useGlowOverlays.ts"
  - "src/components/biome-synth/shared/shaders.ts"
  - "src/components/biome-synth/space/**"
  - "src/components/biome-synth/jungle/**"
  - "src/components/biome-synth/sea/**"
  - "src/components/biome-synth/cyberpunk/**"
---

# Three.js Scene Rules

- Dispose all geometries, materials, textures, and render targets on cleanup
- Use `renderer.dispose()` and remove the canvas from DOM on unmount
- Reduce particle counts on mobile (check `isMobile` flag)
- GLSL shaders are in `biome-synth/shared/shaders.ts` — keep vertex and fragment shaders as template literals
- Use `requestAnimationFrame` via the Three.js animation loop, not manual RAF
- Audio-reactive visuals read from the FFT analyzer — don't create duplicate analyzers
- Keep draw calls minimal: batch particles into single `Points` geometry
- Use `BufferGeometry` with typed arrays, not legacy `Geometry`
- Glow/bloom effects via overlay divs (`useGlowOverlays`), not post-processing passes
- Test WebGL availability before initializing renderer
