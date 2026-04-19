export const GALAXY_VERT = `
  attribute float aSize;
  attribute float aRand;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vDist;
  varying float vTwinkle;
  uniform float uTime, uPixelRatio, uBass, uTreble, uVol, uFlash;

  void main() {
    vColor = color * (1.0 + uFlash * 0.6);
    vec3 p = position;
    float dist = length(p.xz);

    // Spiral breathing
    p.xz *= 1.0 + uTreble * 0.04 * smoothstep(100.0, 900.0, dist);
    p.y += sin(p.x * 0.003 + uTime * 0.6 + aRand * 6.2831) * uBass * 15.0;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDist = -mv.z;

    // Per-star scintillation — a cheap atmospheric-like twinkle, decorrelated by aRand
    vTwinkle = 0.85 + 0.15 * sin(uTime * (1.4 + aRand * 2.7) + aRand * 6.2831);

    float pxSize = aSize * (1.0 + uTreble * 0.4 + uFlash * 0.3) * uPixelRatio * (300.0 / -mv.z);
    gl_PointSize = max(pxSize * vTwinkle, 0.5);
    gl_Position = projectionMatrix * mv;
    vAlpha = 0.7 + uVol * 0.3;
  }
`;

export const GALAXY_FRAG = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vDist;
  varying float vTwinkle;
  uniform float uVol;

  void main() {
    vec2 pc = gl_PointCoord - 0.5;
    float d = length(pc);
    if (d > 0.5) discard;

    // Airy-disc-style core: tight gaussian centre + soft halo + far outer falloff
    float core  = exp(-d * d * 64.0);          // pinpoint centre
    float halo  = exp(-d * 7.0) * 0.32;        // soft halo
    float outer = exp(-d * 2.5) * 0.08;        // gentle outer fade

    // 4-point diffraction spikes — anisotropic falloff, smoother than the old smoothstep
    float spikeH = (1.0 - smoothstep(0.0, 0.045, abs(pc.y))) * exp(-abs(pc.x) * 5.5);
    float spikeV = (1.0 - smoothstep(0.0, 0.045, abs(pc.x))) * exp(-abs(pc.y) * 5.5);
    float spikes = (spikeH + spikeV) * 0.45;

    float alpha = smoothstep(0.5, 0.0, d) * vAlpha;

    // Bright stars get a small chromatic spike-tint (cool blue-white) — keeps colored stars colorful
    vec3 spikeTint = vColor * 0.6 + vec3(0.05, 0.08, 0.12);
    vec3 col = vColor * (core * (1.4 + uVol * 0.7) * vTwinkle + halo + outer);
    col += spikes * spikeTint;

    gl_FragColor = vec4(col, alpha);
  }
`;

export const PARTICLE_VERT = `
  attribute float aLife;
  attribute float aMaxLife;
  attribute float aSize;
  varying float vLife;
  varying vec3 vColor;
  uniform float uPixelRatio, uBass;

  void main() {
    vLife = aLife / aMaxLife;
    vColor = color;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float alive = step(0.001, aLife) * step(aLife, aMaxLife);
    float fadeOut = 1.0 - vLife;
    gl_PointSize = alive * aSize * fadeOut * fadeOut * (1.0 + uBass * 0.4) * uPixelRatio * (220.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const PARTICLE_FRAG = `
  varying float vLife;
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float fadeOut = 1.0 - vLife;
    float core = exp(-d * 5.0) * 0.5;
    gl_FragColor = vec4(vColor + core * fadeOut, smoothstep(0.5, 0.0, d) * fadeOut * fadeOut * 0.9);
  }
`;

export const STAR_VERT = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uTime, uBass;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    // Multi-octave breathing — softer than the old single-axis pulse
    vec3 p = position;
    float breathe = sin(p.x * 0.3 + uTime * 1.2) * 0.5
                  + cos(p.y * 0.4 + uTime * 0.9) * 0.35
                  + sin(p.z * 0.5 - uTime * 1.1) * 0.25;
    p += normal * breathe * (0.35 + uBass * 1.0);
    // Pass undisplaced position so surface plasma stays anchored as the star breathes
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const STAR_FRAG = `
  uniform float uTime, uBass, uPitch;
  varying vec3 vNormal;
  varying vec3 vPosition;

  // Cheap layered-trig "plasma" — convincing convective granulation without snoise cost
  float plasma(vec3 p, float t) {
    float a = sin(p.x * 0.18 + t * 0.5) * cos(p.y * 0.21 - t * 0.4) * sin(p.z * 0.16 + t * 0.3);
    float b = sin(p.x * 0.42 - t * 0.2) * cos(p.y * 0.37 + t * 0.6) * sin(p.z * 0.31 - t * 0.45);
    float c = sin(p.x * 0.91 + t * 1.1) * cos(p.y * 0.83 + t * 0.95) * sin(p.z * 0.79 - t * 0.85);
    return a * 0.55 + b * 0.30 + c * 0.15;
  }

  void main() {
    vec3 N = normalize(vNormal);
    float NdotV = clamp(dot(N, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
    float rim = 1.0 - NdotV;

    // Warm palette — amber → coral → magenta, drifts with pitch + slow time
    vec3 c1 = vec3(1.00, 0.65, 0.20);   // amber
    vec3 c2 = vec3(0.99, 0.42, 0.34);   // coral
    vec3 c3 = vec3(0.92, 0.30, 0.55);   // magenta
    float mixT = clamp(uPitch + sin(uTime * 0.3) * 0.2, 0.0, 1.0);
    vec3 base = mix(c1, mix(c2, c3, mixT), mixT);

    // Convective cells — bright spots that drift across the surface
    float cells = plasma(vPosition, uTime) * 0.5 + 0.5;
    float granule = pow(cells, 1.6);
    vec3 hotSpot = mix(base, vec3(1.0, 0.92, 0.72), granule * (0.45 + uBass * 0.35));

    // Limb darkening — real stellar discs dim toward the edges
    float limb = mix(0.55, 1.0, pow(NdotV, 0.6));

    // Tight warm corona at the rim, lifts on bass
    float corona = pow(rim, 4.0) * (0.55 + uBass * 1.0);

    // Calmer surface than before — soft glow, not a flash
    float surface = 0.45 + granule * 0.30 + uBass * 0.30;

    vec3 col = hotSpot * surface * limb + base * corona;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export const HALO_FRAG = `
  uniform float uTime, uBass;
  varying vec3 vNormal;

  void main() {
    float rim = pow(max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
    // Warm halo — amber ↔ magenta
    vec3 c = mix(vec3(1.0, 0.55, 0.25), vec3(0.92, 0.30, 0.55), sin(uTime * 0.2) * 0.5 + 0.5);
    gl_FragColor = vec4(c, rim * (0.22 + uBass * 0.45));
  }
`;

// Drum-star: colored icosahedron with plasma surface + limb darkening; brightens on pulse.
export const DRUM_STAR_VERT = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uTime, uPulse;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 p = position;
    // Breathe + pulse distortion (multi-axis = organic)
    float breathe = sin(p.x * 0.4 + uTime * 2.0) * 0.18
                  + cos(p.y * 0.5 - uTime * 1.6) * 0.14;
    p += normal * (breathe + uPulse * 1.4);
    vPosition = position;       // undisplaced — keeps plasma anchored to the surface
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const DRUM_STAR_FRAG = `
  uniform float uTime, uPulse;
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vPosition;

  // Two-octave plasma — convective cells on the small icosahedron surface
  float plasma(vec3 p, float t) {
    float a = sin(p.x * 0.45 + t * 0.7) * cos(p.y * 0.51 - t * 0.5) * sin(p.z * 0.38 + t * 0.4);
    float b = sin(p.x * 1.20 - t * 0.3) * cos(p.y * 0.95 + t * 0.65) * sin(p.z * 0.83 - t * 0.5);
    return a * 0.65 + b * 0.35;
  }

  void main() {
    vec3 N = normalize(vNormal);
    float NdotV = clamp(dot(N, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
    float rim = 1.0 - NdotV;

    // Surface granulation — drifting hot cells across the disc
    float cells = plasma(vPosition, uTime) * 0.5 + 0.5;
    float granule = pow(cells, 1.4);
    vec3 hot = mix(uColor, vec3(1.0, 0.93, 0.78), granule * (0.4 + uPulse * 0.5));

    // Limb darkening — sphere reads as 3D, not a flat disc
    float limb = mix(0.5, 1.0, pow(NdotV, 0.7));

    // Tight warm corona at the rim — lifts on pulse
    float corona = pow(rim, 3.0) * (0.55 + uPulse * 1.6);

    float pulseLift = uPulse * 1.4;
    float surface = 0.5 + granule * 0.30 + pulseLift * 0.4;

    vec3 col = hot * surface * limb + uColor * corona;
    // Bright white pop at the peak of the pulse
    col += vec3(1.0) * uPulse * uPulse * 0.55;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export const PP_VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`;

export const BRIGHT_FRAG = `
  uniform sampler2D tDiffuse;
  uniform float uThreshold;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(tDiffuse, vUv);
    float lum = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
    gl_FragColor = lum > uThreshold ? c * 1.3 : vec4(0.0);
  }
`;

export const BLUR_FRAG = `
  uniform sampler2D tDiffuse;
  uniform vec2 uResolution;
  varying vec2 vUv;
  void main() {
    vec2 texel = 1.0 / uResolution;
    vec4 sum = vec4(0.0);
    // 9-tap gaussian, anamorphic bias
    float weights[5] = float[](0.227, 0.194, 0.121, 0.054, 0.016);
    sum += texture2D(tDiffuse, vUv) * weights[0];
    for (int i = 1; i < 5; i++) {
      vec2 hOff = vec2(float(i) * 2.5, 0.0) * texel;
      vec2 vOff = vec2(0.0, float(i) * 1.2) * texel;
      sum += texture2D(tDiffuse, vUv + hOff) * weights[i];
      sum += texture2D(tDiffuse, vUv - hOff) * weights[i];
      sum += texture2D(tDiffuse, vUv + vOff) * weights[i] * 0.5;
      sum += texture2D(tDiffuse, vUv - vOff) * weights[i] * 0.5;
    }
    gl_FragColor = sum;
  }
`;

export const COMPOSITE_FRAG = `
  uniform sampler2D tOriginal, tBloom;
  uniform float uBloomStrength, uChromatic, uVignette, uTime, uMood;
  varying vec2 vUv;

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);

    // Chromatic aberration
    float offset = uChromatic * dist * 0.012;
    float r = texture2D(tOriginal, vUv + center * offset).r;
    float g = texture2D(tOriginal, vUv).g;
    float b = texture2D(tOriginal, vUv - center * offset).b;

    vec3 color = vec3(r, g, b);
    color += texture2D(tBloom, vUv).rgb * uBloomStrength;

    // Vignette — deeper for space immersion
    color *= 1.0 - smoothstep(0.35, 1.5, dist * 2.0) * uVignette;

    // Glacial Aurora color grading — icy blue shadows, soft violet highlights (always cool)
    vec3 cool = color * vec3(0.85, 0.95, 1.10);
    vec3 warm = color * vec3(1.05, 0.95, 1.10);
    color = mix(cool, warm, uMood);

    // Subtle cool lift in shadows for aurora depth
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color += vec3(0.02, 0.03, 0.05) * (1.0 - luminance);

    // Film grain (very subtle)
    float grain = fract(sin(dot(vUv * uTime * 60.0, vec2(12.9898, 78.233))) * 43758.5453);
    color += (grain - 0.5) * 0.015;

    gl_FragColor = vec4(color, 1.0);
  }
`;
