// v2 scene shaders. All effects live in primitive material shaders or
// additive billboard sprites — no EffectComposer post-processing (per
// .claude/rules/three-scene.md). Bloom is faked via halo sprites +
// bright additive trail geometry.

export const BODY_VERT = `
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vViewDir;
  uniform float uTime;
  uniform float uPulse;
  uniform float uDisplace;

  // Cheap multi-axis breathing distortion, anchored to normal so silhouettes stay round.
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 p = position;
    float b = sin(p.x * 0.6 + uTime * 1.3) * 0.22
            + cos(p.y * 0.8 - uTime * 0.9) * 0.18
            + sin(p.z * 0.55 + uTime * 1.1) * 0.14;
    p += normal * (b * uDisplace + uPulse * 0.6 * uDisplace);
    vPos = p;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

export const BODY_FRAG = `
  precision highp float;
  uniform float uTime;
  uniform float uPulse;
  uniform vec3  uColor;
  uniform vec3  uAccent;
  uniform float uRimStrength;
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vViewDir;

  // 3-octave trig plasma — avoids simplex-noise cost on mobile.
  float plasma(vec3 p, float t) {
    float a = sin(p.x * 0.35 + t * 0.6) * cos(p.y * 0.42 - t * 0.45) * sin(p.z * 0.38 + t * 0.4);
    float b = sin(p.x * 0.80 - t * 0.25) * cos(p.y * 0.70 + t * 0.55) * sin(p.z * 0.63 - t * 0.5);
    float c = sin(p.x * 1.70 + t * 0.95) * cos(p.y * 1.55 + t * 0.85) * sin(p.z * 1.45 - t * 0.75);
    return a * 0.55 + b * 0.30 + c * 0.15;
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewDir);
    float NdotV = clamp(dot(N, V), 0.0, 1.0);
    float rim = pow(1.0 - NdotV, 2.2);

    float cells = plasma(vPos * 0.6, uTime) * 0.5 + 0.5;
    float granule = pow(cells, 1.4);

    vec3 base = mix(uColor * 0.55, uColor * 1.25, granule);
    vec3 hot  = mix(base, uAccent, granule * 0.55 + uPulse * 0.35);

    // Limb darkening gives planets real depth under flat light.
    float limb = mix(0.45, 1.0, pow(NdotV, 0.6));
    float corona = rim * uRimStrength * (0.8 + uPulse * 1.6);

    vec3 col = hot * (0.45 + granule * 0.35 + uPulse * 0.35) * limb
             + uAccent * corona;

    // Bright pop on pulse peak — HDR-ish highlight for the halo sprite to chew on.
    col += vec3(1.0) * uPulse * uPulse * 0.4;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const HALO_VERT = `
  // Billboard that always faces the camera, sized in world space.
  uniform float uScale;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += (uv - 0.5) * uScale * 2.0;
    gl_Position = projectionMatrix * mv;
  }
`;

export const HALO_FRAG = `
  precision mediump float;
  uniform vec3  uColor;
  uniform float uIntensity;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    // Soft exponential glow with a sharp core — fakes bloom without a composer pass.
    float core  = exp(-d * d * 28.0);
    float outer = exp(-d * 3.2) * 0.45;

    // Slow rotating 4-spike to add cinematic lens flare without extra geometry.
    float ang = atan(c.y, c.x) * 2.0 + uTime * 0.35;
    float spike = pow(max(cos(ang), 0.0), 40.0) * exp(-d * 4.5) * 0.35;

    float a = (core + outer + spike) * uIntensity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

export const STAR_POINT_VERT = `
  attribute float aSize;
  attribute float aSeed;
  varying vec3  vColor;
  varying float vTwinkle;
  uniform float uTime;
  uniform float uPixelRatio;

  void main() {
    vColor = color;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vTwinkle = 0.7 + 0.3 * sin(uTime * (1.0 + aSeed * 3.1) + aSeed * 6.28);
    gl_PointSize = max(aSize * vTwinkle * uPixelRatio * (260.0 / -mv.z), 0.6);
    gl_Position = projectionMatrix * mv;
  }
`;

export const STAR_POINT_FRAG = `
  precision mediump float;
  varying vec3  vColor;
  varying float vTwinkle;

  void main() {
    vec2 pc = gl_PointCoord - 0.5;
    float d = length(pc);
    if (d > 0.5) discard;
    float core = exp(-d * d * 60.0);
    float halo = exp(-d * 6.0) * 0.35;
    // Airy-disc diffraction spikes for hero stars — dims quickly with distance to center.
    float sH = (1.0 - smoothstep(0.0, 0.04, abs(pc.y))) * exp(-abs(pc.x) * 6.0);
    float sV = (1.0 - smoothstep(0.0, 0.04, abs(pc.x))) * exp(-abs(pc.y) * 6.0);
    float spikes = (sH + sV) * 0.35;
    float a = smoothstep(0.5, 0.0, d);
    vec3 col = vColor * (core * 1.5 + halo) * vTwinkle + vColor * spikes;
    gl_FragColor = vec4(col, a);
  }
`;

export const NEBULA_VERT = `
  varying vec3 vDir;
  void main() {
    // Full-screen triangle trick via clip-space, but we pass a view-ray so the
    // shader can render a true spherical sky without a giant sphere mesh.
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const NEBULA_FRAG = `
  precision highp float;
  uniform float uTime;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uColorC;
  uniform float uIntensity;
  varying vec3  vDir;

  // 2D hash + value-noise + fbm — cheap enough to run fullscreen.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      s += vnoise(p) * a;
      p *= 2.02;
      a *= 0.5;
    }
    return s;
  }

  void main() {
    // Spherical UV from normalized direction.
    vec3 d = normalize(vDir);
    vec2 uv = vec2(atan(d.z, d.x), asin(d.y));

    // Two nebula sheets drifting at different speeds for parallax depth.
    float n1 = fbm(uv * 2.2 + vec2(uTime * 0.02, 0.0));
    float n2 = fbm(uv * 4.8 - vec2(0.0, uTime * 0.015));
    float n  = n1 * 0.7 + n2 * 0.45;

    // Soft clumps: threshold + smoothstep keeps the sky mostly dark.
    float clouds = smoothstep(0.55, 0.95, n);

    vec3 col = mix(uColorA, uColorB, n1);
    col = mix(col, uColorC, clouds * 0.8);
    col *= clouds * uIntensity;

    // Gentle vertical tint so the horizon is a touch warmer — reads as "galactic plane".
    col += uColorA * 0.06 * (1.0 - abs(d.y));

    gl_FragColor = vec4(col, 1.0);
  }
`;
