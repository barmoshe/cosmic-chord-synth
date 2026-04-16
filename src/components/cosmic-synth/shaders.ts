export const GALAXY_VERT = `
  attribute float aSize;
  attribute float aRand;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vDist;
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
    gl_PointSize = max(aSize * (1.0 + uTreble * 0.4 + uFlash * 0.3) * uPixelRatio * (300.0 / -mv.z), 0.5);
    gl_Position = projectionMatrix * mv;
    vAlpha = 0.7 + uVol * 0.3;
  }
`;

export const GALAXY_FRAG = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vDist;
  uniform float uVol;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;

    // Airy disk diffraction pattern for realistic star rendering
    float core = exp(-d * 8.0) * 0.7;
    float inner = exp(-d * 4.0) * 0.25;
    float outer = exp(-d * 2.0) * 0.08;
    float spikes = (1.0 - smoothstep(0.0, 0.03, abs(gl_PointCoord.x - 0.5))) * 0.15 +
                   (1.0 - smoothstep(0.0, 0.03, abs(gl_PointCoord.y - 0.5))) * 0.15;
    spikes *= exp(-d * 3.0);
    float alpha = smoothstep(0.5, 0.01, d) * vAlpha;

    vec3 col = vColor * (1.0 + core * (0.5 + uVol * 0.6)) + inner * 0.2 + outer * 0.05 + spikes * vColor;
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
    // Organic distortion
    vec3 p = position;
    p += normal * sin(p.x * 0.3 + uTime * 2.0) * uBass * 2.0;
    p += normal * cos(p.y * 0.4 + uTime * 1.5) * uBass * 1.5;
    vPosition = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const STAR_FRAG = `
  uniform float uTime, uBass, uPitch;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    // Glacial Aurora 2026: teal → cyan → periwinkle
    vec3 c1 = vec3(0.08, 0.72, 0.65);
    vec3 c2 = vec3(0.13, 0.83, 0.93);
    vec3 c3 = vec3(0.51, 0.55, 0.97);
    vec3 color = mix(c1, mix(c2, c3, uPitch), sin(uTime * 0.4 + uPitch * 4.0) * 0.5 + 0.5);

    float energy = pow(rim, 1.5) * (2.5 + uBass * 5.0) + 0.6 + uBass * 0.5;
    // Inner glow
    float inner = 1.0 - rim;
    energy += inner * inner * (0.3 + uBass * 0.8);

    gl_FragColor = vec4(color * energy, 1.0);
  }
`;

export const HALO_FRAG = `
  uniform float uTime, uBass;
  varying vec3 vNormal;

  void main() {
    float rim = pow(max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
    // Halo: cyan ↔ orchid (cool-on-cool tension)
    vec3 c = mix(vec3(0.13, 0.83, 0.93), vec3(0.91, 0.47, 0.98), sin(uTime * 0.2) * 0.5 + 0.5);
    gl_FragColor = vec4(c, rim * (0.35 + uBass * 0.65));
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
