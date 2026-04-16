---
paths:
  - "src/components/cosmic-synth/useThreeScene.ts"
  - "src/components/cosmic-synth/shaders.ts"
  - "src/components/cosmic-synth/useGlowOverlays.ts"
---

# Three.js Scene Rules

- Dispose all geometries, materials, textures, and render targets on cleanup
- Use `renderer.dispose()` and remove the canvas from DOM on unmount
- Reduce particle counts on mobile (check `isMobile` flag)
- GLSL shaders are in `shaders.ts` — keep vertex and fragment shaders as template literals
- Use `requestAnimationFrame` via the Three.js animation loop, not manual RAF
- Audio-reactive visuals read from the FFT analyzer — don't create duplicate analyzers
- Keep draw calls minimal: batch particles into single `Points` geometry
- Use `BufferGeometry` with typed arrays, not legacy `Geometry`
- Glow/bloom effects via overlay divs (`useGlowOverlays`), not post-processing passes
- Test WebGL availability before initializing renderer
