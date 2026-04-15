import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";
import * as Tone from "tone";
import CosmicSequencer from "./CosmicSequencer";

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const SCALES: Record<string, { notes: number[]; label: string; mood: number; chords: number[][] }> = {
  pentatonic: { notes: [0, 3, 5, 7, 10], label: "PENTA", mood: 0.5, chords: [[0, 3, 7], [3, 7, 10], [5, 7, 10], [7, 10, 12], [10, 12, 15]] },
  minor: { notes: [0, 2, 3, 5, 7, 8, 10], label: "MINOR", mood: 0.2, chords: [[0, 3, 7], [2, 5, 8], [3, 7, 10], [5, 8, 12], [7, 10, 14], [8, 12, 15], [10, 14, 17]] },
  major: { notes: [0, 2, 4, 5, 7, 9, 11], label: "MAJOR", mood: 0.85, chords: [[0, 4, 7], [2, 5, 9], [4, 7, 11], [5, 9, 12], [7, 11, 14], [9, 12, 16], [11, 14, 17]] },
  arabic: { notes: [0, 1, 4, 5, 7, 8, 11], label: "ARABIC", mood: 0.25, chords: [[0, 4, 7], [1, 5, 8], [4, 7, 11], [5, 8, 12], [7, 11, 13], [8, 12, 16]] },
};
const SCALE_ORDER = ["pentatonic", "minor", "major", "arabic"];
const PROGS: Record<string, number[][]> = {
  pentatonic: [[0, 3, 0, 4], [0, 1, 2, 0]],
  minor: [[0, 3, 4, 0], [0, 5, 3, 4], [0, 2, 5, 4]],
  major: [[0, 4, 5, 3], [0, 3, 4, 0]],
  arabic: [[0, 3, 4, 0], [0, 2, 4, 0]],
};

const isMobile = typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);
const BASE_MIDI = 48;
const MIDI_RANGE = 36;
const GALAXY_COUNT = isMobile ? 5000 : 9000;
const PARTICLE_POOL = isMobile ? 150 : 300;
const RIPPLE_POOL = 12;
const FFT_BARS = 32;
const SMOOTH = 0.14;
const PAL: number[][] = [[0, 0.94, 1], [1, 0, 0.9], [1, 0.9, 0], [0, 1, 0.53], [1, 0.38, 0.19], [0.5, 0.25, 1]];
const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

/* DJ Arrangement */
const DJ_SECTIONS = [
  { name: "INTRO", bars: 4, e: 0.1, d: 0.15, l: { dr: 1, pd: 0, bs: 0, ml: 0, ar: 0, ct: 0 }, ft: 0.15, rv: 0.6, dw: 0.2, algo: "silent", adsr: [2, 1, 0.7, 3], mod: [1, 1, 0, 5] },
  { name: "VERSE", bars: 8, e: 0.3, d: 0.4, l: { dr: 1, pd: 0.5, bs: 0, ml: 1, ar: 0, ct: 0 }, ft: 0.35, rv: 0.45, dw: 0.18, algo: "motif", adsr: [0.08, 0.3, 0.5, 1.5], mod: [3, 2, 8, 12] },
  { name: "BUILD", bars: 4, e: 0.55, d: 0.6, l: { dr: 1, pd: 0.7, bs: 0.3, ml: 1, ar: 0.5, ct: 0 }, ft: 0.6, rv: 0.35, dw: 0.15, algo: "sequence", sweep: 1, adsr: [0.05, 0.25, 0.55, 1.2], mod: [4, 2.5, 12, 15] },
  { name: "DROP", bars: 8, e: 0.85, d: 0.8, l: { dr: 1, pd: 1, bs: 1, ml: 1, ar: 0.8, ct: 0.3 }, ft: 0.9, rv: 0.3, dw: 0.12, algo: "develop", adsr: [0.03, 0.2, 0.6, 0.8], mod: [5, 3, 15, 18] },
  { name: "BREAK", bars: 6, e: 0.2, d: 0.25, l: { dr: 1, pd: 0.8, bs: 0, ml: 0.5, ar: 0, ct: 0 }, ft: 0.25, rv: 0.55, dw: 0.25, algo: "fragment", adsr: [0.15, 0.4, 0.4, 2.5], mod: [2, 1.5, 5, 8] },
  { name: "BUILD2", bars: 4, e: 0.65, d: 0.7, l: { dr: 1, pd: 0.8, bs: 0.5, ml: 1, ar: 0.7, ct: 0.3 }, ft: 0.75, rv: 0.3, dw: 0.13, algo: "sequence", sweep: 1, riser: 1, adsr: [0.04, 0.2, 0.6, 1], mod: [5, 2.8, 14, 16] },
  { name: "PEAK", bars: 8, e: 1, d: 0.9, l: { dr: 1, pd: 1, bs: 1, ml: 1, ar: 1, ct: 0.6 }, ft: 1, rv: 0.25, dw: 0.1, algo: "climax", adsr: [0.02, 0.15, 0.65, 0.6], mod: [6, 3.5, 18, 22] },
  { name: "OUTRO", bars: 6, e: 0.15, d: 0.2, l: { dr: 1, pd: 0.4, bs: 0, ml: 0.3, ar: 0, ct: 0 }, ft: 0.15, rv: 0.6, dw: 0.22, algo: "fragment", adsr: [0.2, 0.5, 0.4, 3], mod: [1.5, 1.2, 3, 6] },
] as any[];
const RHY: Record<string, number[][]> = {
  sparse: [[8, 1], [8, 0.7]],
  quarter: [[4, 1], [4, 0.7], [4, 0.9], [4, 0.6]],
  driving: [[2, 1], [2, 0.6], [2, 0.9], [2, 0.5], [2, 1], [2, 0.7], [2, 0.8], [2, 0.5]],
  syncopated: [[3, 1], [1, 0.5], [4, 0.8], [3, 0.9], [1, 0.4], [4, 0.7]],
  dense: [[2, 1], [1, 0.5], [1, 0.7], [2, 0.9], [2, 0.8], [1, 0.6], [1, 0.5], [2, 0.7]],
};
const BASS_PAT: Record<string, number[][]> = {
  whole: [[16, 1]],
  octave: [[4, 1], [4, 0.8], [4, 1], [4, 0.7]],
  bounce: [[2, 1], [2, 0], [2, 0.8], [2, 0], [2, 1], [2, 0], [2, 0.7], [2, 0]],
};
const ARP_MODES = ["up", "down", "updown", "random", "skip"];

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
const m2f = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function quantize(midi: number, scaleNotes: number[]) {
  const oct = Math.floor(midi / 12);
  const pc = ((midi % 12) + 12) % 12;
  let best = scaleNotes[0], bestDist = 99;
  for (const s of scaleNotes) {
    const d = Math.min(Math.abs(pc - s), 12 - Math.abs(pc - s));
    if (d < bestDist) { bestDist = d; best = s; }
  }
  return oct * 12 + best;
}

function noteColor(midi: number): [number, number, number] {
  const t = ((midi % 12) / 12) * PAL.length;
  const i = Math.floor(t) % PAL.length;
  const j = (i + 1) % PAL.length;
  const f = t - Math.floor(t);
  return [
    PAL[i][0] + (PAL[j][0] - PAL[i][0]) * f,
    PAL[i][1] + (PAL[j][1] - PAL[i][1]) * f,
    PAL[i][2] + (PAL[j][2] - PAL[i][2]) * f,
  ];
}

function noteHex(midi: number) {
  const c = noteColor(midi);
  return "#" + c.map(v => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
}

function haptic(ms: number | number[]) {
  try { navigator.vibrate?.(Array.isArray(ms) ? ms : [ms]); } catch {}
}

// Motif engine
function genMotif(scaleNotes: number[], len = 4) {
  const m: number[] = [];
  let d = Math.floor(Math.random() * scaleNotes.length);
  m.push(d);
  for (let i = 1; i < len; i++) {
    d = clamp(d + (Math.random() < 0.7 ? (Math.random() < 0.5 ? 1 : -1) : (Math.random() < 0.5 ? 2 : -2)), 0, scaleNotes.length - 1);
    m.push(d);
  }
  return m;
}

function devMotif(m: number[], tech: string, n: number): number[] {
  switch (tech) {
    case "transpose": { const s = pick([1, 2, -1, -2]); return m.map(d => clamp(d + s, 0, n - 1)); }
    case "invert": { const a = m[0]; return m.map(d => clamp(a - (d - a), 0, n - 1)); }
    case "retrograde": return [...m].reverse();
    case "fragment": return m.slice(0, Math.ceil(m.length / 2));
    case "ornament": {
      const r: number[] = [];
      m.forEach((d, i) => { r.push(d); if (i < m.length - 1 && Math.random() < 0.4) r.push(clamp(Math.round((d + m[i + 1]) / 2), 0, n - 1)); });
      return r;
    }
    case "sequence": { const s = pick([2, 3, -2]); return m.map(d => clamp(d + s, 0, n - 1)); }
    default: return m;
  }
}

function buildMatrix(scaleNotes: number[]) {
  const n = scaleNotes.length;
  const m: Record<number, Record<number, number>> = {};
  for (let i = 0; i < n; i++) {
    const w: Record<number, number> = {};
    for (let j = 0; j < n; j++) {
      const iv = Math.abs(i - j);
      w[j] = iv === 0 ? 0.05 : iv === 1 ? 4 : iv === 2 ? 2.2 : iv === 3 ? 1 : 0.35;
    }
    if (i === n - 1) w[0] = 6;
    if (i === n - 2) { w[n - 1] = 3.5; w[0] = 2.5; }
    m[i] = w;
  }
  return m;
}

function wPick(w: Record<number, number>) {
  const e = Object.entries(w);
  const tot = e.reduce((s, [, v]) => s + (v as number), 0);
  let r = Math.random() * tot;
  for (const [k, v] of e) { r -= v as number; if (r <= 0) return parseInt(k); }
  return parseInt(e[0][0]);
}

function getArpNote(ch: number[], step: number, mode: string) {
  const n = ch.length;
  if (!n) return 0;
  switch (mode) {
    case "up": return ch[step % n];
    case "down": return ch[(n - 1) - (step % n)];
    case "updown": { const c = n * 2 - 2 || 1; const p = step % c; return p < n ? ch[p] : ch[c - p]; }
    case "skip": return ch[(step * 2) % n];
    default: return ch[Math.floor(Math.random() * n)];
  }
}

/* ═══════════════════════════════════════════════
   SHADERS — Improved quality
═══════════════════════════════════════════════ */
const GALAXY_VERT = `
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

const GALAXY_FRAG = `
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

const PARTICLE_VERT = `
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

const PARTICLE_FRAG = `
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

const STAR_VERT = `
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

const STAR_FRAG = `
  uniform float uTime, uBass, uPitch;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    vec3 c1 = vec3(0.0, 0.94, 1.0);
    vec3 c2 = vec3(1.0, 0.0, 0.9);
    vec3 c3 = vec3(1.0, 0.9, 0.0);
    vec3 color = mix(c1, mix(c2, c3, uPitch), sin(uTime * 0.4 + uPitch * 4.0) * 0.5 + 0.5);
    
    float energy = pow(rim, 1.5) * (2.5 + uBass * 5.0) + 0.6 + uBass * 0.5;
    // Inner glow
    float inner = 1.0 - rim;
    energy += inner * inner * (0.3 + uBass * 0.8);
    
    gl_FragColor = vec4(color * energy, 1.0);
  }
`;

const HALO_FRAG = `
  uniform float uTime, uBass;
  varying vec3 vNormal;
  
  void main() {
    float rim = pow(max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
    vec3 c = mix(vec3(0.0, 0.94, 1.0), vec3(1.0, 0.0, 0.9), sin(uTime * 0.2) * 0.5 + 0.5);
    gl_FragColor = vec4(c, rim * (0.35 + uBass * 0.65));
  }
`;

const PP_VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`;

const BRIGHT_FRAG = `
  uniform sampler2D tDiffuse;
  uniform float uThreshold;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(tDiffuse, vUv);
    float lum = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
    gl_FragColor = lum > uThreshold ? c * 1.3 : vec4(0.0);
  }
`;

const BLUR_FRAG = `
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

const COMPOSITE_FRAG = `
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
    
    // Vignette
    color *= 1.0 - smoothstep(0.4, 1.4, dist * 2.0) * uVignette;
    
    // Color grading based on mood
    vec3 cool = color * vec3(0.85, 0.92, 1.15);
    vec3 warm = color * vec3(1.12, 0.98, 0.85);
    color = mix(cool, warm, uMood);
    
    // Film grain (subtle)
    float grain = fract(sin(dot(vUv * uTime * 60.0, vec2(12.9898, 78.233))) * 43758.5453);
    color += (grain - 0.5) * 0.02;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

/* ═══════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════ */
export default function CosmicSynth() {
  const [phase, setPhase] = useState<"splash" | "warp" | "play">("splash");
  const [audioOk, setAudioOk] = useState(true);
  const [scale, setScale] = useState("pentatonic");
  const [autoPlay, setAutoPlay] = useState(false);
  const [flash, setFlash] = useState("");
  const [showUI, setShowUI] = useState(true);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [gyroPrompt, setGyroPrompt] = useState(false);
  const [djSection, setDjSection] = useState("");
  const [warpProgress, setWarpProgress] = useState(0);
  const [seqOpen, setSeqOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<any>(null);
  const audioRef = useRef<any>(null);
  const touchesRef = useRef(new Map());
  const analysisRef = useRef({ bass: 0, mid: 0, treble: 0, high: 0, vol: 0, pitch: 0 });
  const scaleRef = useRef("pentatonic");
  const fftBuffer = useRef(new Float32Array(128));
  const rafRef = useRef<number | null>(null);
  const glowsRef = useRef(new Map());
  const glowContainerRef = useRef<HTMLDivElement>(null);
  const gyroRef = useRef({ on: false, beta: 0, gamma: 0, alpha: 0, accelX: 0, accelY: 0, accelZ: 0, shake: 0, lastShakeTime: 0 });
  const hideTimerRef = useRef<any>(null);
  const flashIntensity = useRef(0);
  const warpState = useRef({ on: false, t: 0 });
  const djState = useRef<any>({
    on: false, iv: null, si: 0, tis: 0, tt: 0, motif: [], phrase: [], pp: 0,
    ci: 0, ct: 0, bi: 0, am: "up", as: 0, ac: [], ri: 0,
    oct: 4, deg: 0, tf: 0.3, cf: 0.3, te: 0.1, ce: 0.1, rf: 200,
  });
  const frameCount = useRef(0);

  useEffect(() => { scaleRef.current = scale; }, [scale]);

  // Load fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Raleway:wght@200;300;400;500&display=swap";
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  // Disable context menu
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", prevent, { passive: false } as any);
    const style = document.createElement("style");
    style.textContent = `*{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important;-webkit-tap-highlight-color:transparent!important;}`;
    document.head.appendChild(style);
    return () => {
      document.removeEventListener("contextmenu", prevent);
      try { document.head.removeChild(style); } catch {}
    };
  }, []);

  const resetUIHide = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    setShowUI(true);
    hideTimerRef.current = setTimeout(() => setShowUI(false), 4000);
    if (!hintDismissed) setHintDismissed(true);
  }, [hintDismissed]);

  // Gyroscope + Accelerometer
  useEffect(() => {
    if (phase !== "play") return;
    const g = gyroRef.current;
    const orientHandler = (e: DeviceOrientationEvent) => {
      g.on = true; g.beta = e.beta || 0; g.gamma = e.gamma || 0; g.alpha = e.alpha || 0;
    };
    const motionHandler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      g.accelX = acc.x || 0; g.accelY = acc.y || 0; g.accelZ = acc.z || 0;
      // Shake detection
      const magnitude = Math.sqrt(g.accelX ** 2 + g.accelY ** 2 + g.accelZ ** 2);
      if (magnitude > 25) {
        const now = Date.now();
        if (now - g.lastShakeTime > 600) {
          g.lastShakeTime = now;
          g.shake = 1;
          // Shake triggers scale change + visual burst
          const si = SCALE_ORDER.indexOf(scaleRef.current);
          const newScale = SCALE_ORDER[(si + 1) % SCALE_ORDER.length];
          setScale(newScale); scaleRef.current = newScale;
          flashIntensity.current = 1.5;
          setFlash(SCALES[newScale].label);
          setTimeout(() => setFlash(""), 1500);
          haptic([30, 50, 30, 50, 30]);
          // Emit burst particles from center
          if (engineRef.current) {
            const col = noteColor(60);
            for (let i = 0; i < 5; i++) {
              engineRef.current.emitParticles(
                (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200,
                col, 15, 1
              );
            }
          }
        }
      }
    };

    if (typeof DeviceOrientationEvent !== "undefined" && typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      setGyroPrompt(true);
    } else {
      window.addEventListener("deviceorientation", orientHandler);
      window.addEventListener("devicemotion", motionHandler);
      g.on = true;
    }
    return () => {
      window.removeEventListener("deviceorientation", orientHandler);
      window.removeEventListener("devicemotion", motionHandler);
    };
  }, [phase]);

  const grantGyro = useCallback(async () => {
    setGyroPrompt(false);
    try {
      const g = gyroRef.current;
      const s = await (DeviceOrientationEvent as any).requestPermission();
      if (s === "granted") {
        window.addEventListener("deviceorientation", (e: DeviceOrientationEvent) => {
          g.on = true; g.beta = e.beta || 0; g.gamma = e.gamma || 0; g.alpha = e.alpha || 0;
        });
      }
      // Also request motion permission (iOS 13+)
      if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
        const ms = await (DeviceMotionEvent as any).requestPermission();
        if (ms === "granted") {
          window.addEventListener("devicemotion", (e: DeviceMotionEvent) => {
            const acc = e.accelerationIncludingGravity;
            if (!acc) return;
            g.accelX = acc.x || 0; g.accelY = acc.y || 0; g.accelZ = acc.z || 0;
            const magnitude = Math.sqrt(g.accelX ** 2 + g.accelY ** 2 + g.accelZ ** 2);
            if (magnitude > 25) {
              const now = Date.now();
              if (now - g.lastShakeTime > 600) {
                g.lastShakeTime = now; g.shake = 1;
                haptic([30, 50, 30]);
              }
            }
          });
        }
      }
    } catch {}
  }, []);

  const handleStart = useCallback(async () => {
    try { await Tone.start(); initAudio(); } catch { setAudioOk(false); }
    setPhase("warp");
    warpState.current = { on: true, t: 0 };
    
    // Animate warp progress
    let wp = 0;
    const warpInterval = setInterval(() => {
      wp += 0.02;
      setWarpProgress(Math.min(wp, 1));
      if (wp >= 1) {
        clearInterval(warpInterval);
        setPhase("play");
        warpState.current.on = false;
      }
    }, 25);
  }, []);

  function initAudio() {
    try {
      const mainFilter = new Tone.Filter({ type: "lowpass", frequency: 4500, rolloff: -12 });
      const reverb = new Tone.Reverb({ decay: 3, wet: 0.3 });
      const delay = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.18, wet: 0.1 });
      const chorus = new Tone.Chorus({ frequency: 0.6, delayTime: 3.5, depth: 0.4, wet: 0.12 }).start();

      const lead = new Tone.PolySynth(Tone.FMSynth, {
        maxPolyphony: 4, harmonicity: 2, modulationIndex: 3,
        oscillator: { type: "sawtooth" },
        modulation: { type: "triangle" },
        envelope: { attack: 0.05, decay: 0.25, sustain: 0.4, release: 0.8 },
        modulationEnvelope: { attack: 0.08, decay: 0.15, sustain: 0.3, release: 0.6 },
      } as any);
      lead.volume.value = -10;

      const sub = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 3, oscillator: { type: "sine" },
        envelope: { attack: 0.08, decay: 0.2, sustain: 0.5, release: 0.8 },
      } as any);
      sub.volume.value = -18;

      lead.connect(mainFilter); sub.connect(mainFilter);
      mainFilter.connect(chorus); chorus.connect(delay); delay.connect(reverb); reverb.toDestination();

      const padFilter = new Tone.Filter({ type: "lowpass", frequency: 1200, rolloff: -12 });
      const padReverb = new Tone.Reverb({ decay: 4, wet: 0.4 });
      const pad = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 4, oscillator: { type: "sine" },
        envelope: { attack: 2, decay: 0.8, sustain: 0.6, release: 2 },
      } as any);
      pad.volume.value = -22; pad.connect(padFilter); padFilter.connect(padReverb); padReverb.toDestination();

      const bassFilter = new Tone.Filter({ type: "lowpass", frequency: 800, rolloff: -24 });
      const bassReverb = new Tone.Reverb({ decay: 1.5, wet: 0.12 });
      const bass = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 2, oscillator: { type: "square" },
        envelope: { attack: 0.02, decay: 0.12, sustain: 0.6, release: 0.3 },
      } as any);
      bass.volume.value = -14; bass.connect(bassFilter); bassFilter.connect(bassReverb); bassReverb.toDestination();

      const arpFilter = new Tone.Filter({ type: "lowpass", frequency: 3000, rolloff: -12 });
      const arpDelay = new Tone.FeedbackDelay({ delayTime: "16n", feedback: 0.2, wet: 0.15 });
      const arp = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 3, oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.08, sustain: 0.15, release: 0.25 },
      } as any);
      arp.volume.value = -18; arp.connect(arpFilter); arpFilter.connect(arpDelay); arpDelay.connect(reverb);

      const droneFilter = new Tone.Filter({ type: "lowpass", frequency: 600, rolloff: -12 });
      const droneReverb = new Tone.Reverb({ decay: 5, wet: 0.4 });
      const drone = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 2, oscillator: { type: "sine" },
        envelope: { attack: 3, decay: 2, sustain: 0.8, release: 4 },
      } as any);
      drone.volume.value = -24; drone.connect(droneFilter); droneFilter.connect(droneReverb); droneReverb.toDestination();
      drone.triggerAttack([m2f(36), m2f(43)], Tone.now());

      const lfo = new Tone.LFO(0.05, 100, 500); lfo.connect(droneFilter.frequency); lfo.start();
      const fft = new Tone.FFT(128); Tone.getDestination().connect(fft);

      // ── Drum synths (lightweight) ──
      const drumReverb = new Tone.Reverb({ decay: 1, wet: 0.1 }); drumReverb.toDestination();
      
      const kick = new Tone.MembraneSynth({
        pitchDecay: 0.04, octaves: 5, oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.3 },
      });
      kick.volume.value = -8; kick.connect(drumReverb);

      const snare = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.13, sustain: 0, release: 0.1 },
      });
      snare.volume.value = -14;
      const snareFilter = new Tone.Filter({ type: "bandpass", frequency: 3000, Q: 1 });
      snare.connect(snareFilter); snareFilter.connect(drumReverb);

      const hihat = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
        harmonicity: 5.1, modulationIndex: 28, resonance: 4000, octaves: 1.5,
      } as any);
      hihat.volume.value = -22; hihat.connect(drumReverb);

      const clap = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
      });
      clap.volume.value = -16;
      const clapFilter = new Tone.Filter({ type: "bandpass", frequency: 1500, Q: 1.5 });
      clap.connect(clapFilter); clapFilter.connect(drumReverb);

      audioRef.current = {
        ld: lead, sb: sub, pd: pad, bs: bass, ar: arp, dn: drone,
        kick, snare, hihat, clap,
        fi: mainFilter, pf: padFilter, bf: bassFilter, af: arpFilter, df: droneFilter,
        rv: reverb, dl: delay, ch: chorus, pr: padReverb, br2: bassReverb, dr2: droneReverb,
        drumRv: drumReverb,
        fft, lfo,
      };
    } catch (e) {
      console.error("Audio init error:", e);
      setAudioOk(false);
    }
  }

  function analyze() {
    const a = analysisRef.current;
    if (!audioRef.current?.fft) { a.bass = a.mid = a.treble = a.high = a.vol = a.pitch = 0; return; }
    const raw = audioRef.current.fft.getValue();
    let rB = 0, rM = 0, rT = 0, rH = 0, rV = 0, maxI = 0, maxV = -200;
    const len = raw.length;
    for (let i = 0; i < len; i++) {
      const db = raw[i] as number;
      const v = db > -100 ? (db + 100) * 0.01 : 0;
      fftBuffer.current[i] += (v - fftBuffer.current[i]) * 0.2;
      const s = fftBuffer.current[i];
      rV += s;
      if (s > maxV) { maxV = s; maxI = i; }
      const f = (i / len) * 22050;
      if (f < 150) rB += s;
      else if (f < 600) rM += s;
      else if (f < 4000) rT += s;
      else rH += s;
    }
    a.bass += (Math.min(rB / 6, 1) - a.bass) * SMOOTH;
    a.mid += (Math.min(rM / 8, 1) - a.mid) * SMOOTH;
    a.treble += (Math.min(rT / 12, 1) - a.treble) * SMOOTH;
    a.high += (Math.min(rH / 8, 1) - a.high) * SMOOTH;
    a.vol += (Math.min(rV / len, 1) - a.vol) * SMOOTH;
    a.pitch += (maxI / len - a.pitch) * 0.08;
  }

  /* ═══════════════════════════════════════════════
     THREE.JS Scene — Optimized
  ═══════════════════════════════════════════════ */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const PR = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x010005, 0.00008);
    const camera = new THREE.PerspectiveCamera(72, W() / H(), 1, 12000);
    camera.position.z = 650;

    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !isMobile, powerPreference: "high-performance" });
    renderer.setSize(W(), H());
    renderer.setPixelRatio(PR);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.setClearColor(0x010005);

    // ── Background star field — distant fixed stars ──
    const bgStarCount = isMobile ? 2000 : 4000;
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(bgStarCount * 3);
    const bgCol = new Float32Array(bgStarCount * 3);
    const bgSize = new Float32Array(bgStarCount);
    const bgRand = new Float32Array(bgStarCount);
    for (let i = 0; i < bgStarCount; i++) {
      // Distribute on a large sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3000 + Math.random() * 5000;
      bgPos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      bgPos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      bgPos[i * 3 + 2] = Math.cos(phi) * r;
      // Realistic star temperature colors
      const temp = Math.random();
      if (temp < 0.1) { bgCol[i*3]=1; bgCol[i*3+1]=0.6; bgCol[i*3+2]=0.3; } // red/orange
      else if (temp < 0.3) { bgCol[i*3]=1; bgCol[i*3+1]=0.9; bgCol[i*3+2]=0.7; } // warm white
      else if (temp < 0.7) { bgCol[i*3]=0.9; bgCol[i*3+1]=0.92; bgCol[i*3+2]=1; } // white
      else { bgCol[i*3]=0.7; bgCol[i*3+1]=0.8; bgCol[i*3+2]=1; } // blue-white
      const b = 0.3 + Math.random() * 0.7;
      bgCol[i*3] *= b; bgCol[i*3+1] *= b; bgCol[i*3+2] *= b;
      bgSize[i] = 0.5 + Math.random() * 1.5;
      bgRand[i] = Math.random();
    }
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
    bgGeo.setAttribute("color", new THREE.BufferAttribute(bgCol, 3));
    bgGeo.setAttribute("aSize", new THREE.BufferAttribute(bgSize, 1));
    bgGeo.setAttribute("aRand", new THREE.BufferAttribute(bgRand, 1));

    // ── Galaxy Stars — Realistic spiral ──
    const galaxyGeo = new THREE.BufferGeometry();
    const gPos = new Float32Array(GALAXY_COUNT * 3);
    const gCol = new Float32Array(GALAXY_COUNT * 3);
    const gSize = new Float32Array(GALAXY_COUNT);
    const gRand = new Float32Array(GALAXY_COUNT);
    
    const ARM_COUNT = 4;
    const TWIST_FACTOR = 0.0035;
    const ARM_SPREAD = 0.35;
    
    for (let i = 0; i < GALAXY_COUNT; i++) {
      const arm = i % ARM_COUNT;
      const baseAngle = (arm / ARM_COUNT) * Math.PI * 2;
      const t = Math.random();
      const radius = 15 + Math.pow(t, 0.6) * 980;
      
      // Logarithmic spiral with spread
      const spiralAngle = baseAngle + radius * TWIST_FACTOR + (Math.random() - 0.5) * ARM_SPREAD * (1 + radius * 0.0008);
      
      const x = Math.cos(spiralAngle) * radius;
      const z = Math.sin(spiralAngle) * radius;
      // Thin disk with bulge in center
      const diskThickness = 12 * Math.exp(-radius * 0.003) + 3;
      const y = (Math.random() - 0.5) * diskThickness * (1 + (Math.random() < 0.02 ? 8 : 1));
      
      gPos[i * 3] = x; gPos[i * 3 + 1] = y; gPos[i * 3 + 2] = z;
      
      // Realistic star colors — core is warm/yellow, arms are blue/white, scattered red giants
      const coreInfluence = Math.exp(-radius * 0.004);
      const isRedGiant = Math.random() < 0.03;
      const isBlueGiant = Math.random() < 0.06 && radius > 200;
      
      let r: number, g: number, b: number;
      if (isRedGiant) {
        r = 1; g = 0.4 + Math.random() * 0.2; b = 0.1 + Math.random() * 0.1;
      } else if (isBlueGiant) {
        r = 0.6 + Math.random() * 0.2; g = 0.7 + Math.random() * 0.2; b = 1;
      } else {
        // Mix between warm core and cool arm stars
        const temp = coreInfluence * 0.8 + Math.random() * 0.3;
        r = 0.8 + temp * 0.2;
        g = 0.7 + (1 - temp) * 0.3;
        b = 0.5 + (1 - temp) * 0.5;
      }
      
      const brightness = (0.3 + Math.random() * 0.7) * (0.5 + coreInfluence * 1.5);
      gCol[i * 3] = r * brightness;
      gCol[i * 3 + 1] = g * brightness;
      gCol[i * 3 + 2] = b * brightness;
      gSize[i] = (0.8 + Math.random() * 2.5) * (1 + coreInfluence * 3);
      gRand[i] = Math.random();
    }
    galaxyGeo.setAttribute("position", new THREE.BufferAttribute(gPos, 3));
    galaxyGeo.setAttribute("color", new THREE.BufferAttribute(gCol, 3));
    galaxyGeo.setAttribute("aSize", new THREE.BufferAttribute(gSize, 1));
    galaxyGeo.setAttribute("aRand", new THREE.BufferAttribute(gRand, 1));
    const galaxyMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: PR }, uBass: { value: 0 }, uTreble: { value: 0 }, uVol: { value: 0 }, uFlash: { value: 0 } },
      vertexShader: GALAXY_VERT, fragmentShader: GALAXY_FRAG,
      transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
    });
    const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
    scene.add(galaxy);

    // ── Dust lanes (dark matter feel) ──
    for (let d = 0; d < 3; d++) {
      const dustGeo = new THREE.BufferGeometry();
      const dustCount = isMobile ? 600 : 1200;
      const dustPos = new Float32Array(dustCount * 3);
      const dustCol = new Float32Array(dustCount * 3);
      const dustSize = new Float32Array(dustCount);
      const dustRand = new Float32Array(dustCount);
      for (let i = 0; i < dustCount; i++) {
        const arm = (d + i % 2) % ARM_COUNT;
        const baseAngle = (arm / ARM_COUNT) * Math.PI * 2 + 0.15;
        const radius = 80 + Math.pow(Math.random(), 0.5) * 700;
        const angle = baseAngle + radius * TWIST_FACTOR * 0.95 + (Math.random() - 0.5) * 0.2;
        dustPos[i * 3] = Math.cos(angle) * radius;
        dustPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
        dustPos[i * 3 + 2] = Math.sin(angle) * radius;
        const warmth = 0.5 + Math.random() * 0.5;
        dustCol[i * 3] = 0.15 * warmth; dustCol[i * 3 + 1] = 0.08 * warmth; dustCol[i * 3 + 2] = 0.2 * warmth;
        dustSize[i] = 6 + Math.random() * 14;
        dustRand[i] = Math.random();
      }
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      dustGeo.setAttribute("color", new THREE.BufferAttribute(dustCol, 3));
      dustGeo.setAttribute("aSize", new THREE.BufferAttribute(dustSize, 1));
      dustGeo.setAttribute("aRand", new THREE.BufferAttribute(dustRand, 1));
      const dustMat = new THREE.ShaderMaterial({
        uniforms: galaxyMat.uniforms,
        vertexShader: GALAXY_VERT, fragmentShader: GALAXY_FRAG,
        transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
      });
      scene.add(new THREE.Points(dustGeo, dustMat));
    }

    // ── Central Star ──
    const starGeo = new THREE.IcosahedronGeometry(18, 5);
    const starMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uBass: { value: 0 }, uPitch: { value: 0 } },
      vertexShader: STAR_VERT, fragmentShader: STAR_FRAG,
    });
    const star = new THREE.Mesh(starGeo, starMat);
    scene.add(star);

    // ── Halo ──
    const haloGeo = new THREE.SphereGeometry(50, 32, 32);
    const haloMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uBass: { value: 0 } },
      vertexShader: STAR_VERT.replace('p += normal', '// p += normal').replace('p += normal', '// p += normal'),
      fragmentShader: HALO_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    scene.add(halo);

    // ── Orbital Rings ──
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const rGeo = new THREE.RingGeometry(85 + i * 50, 86.5 + i * 50, 128);
      const rMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(PAL[i % PAL.length][0], PAL[i % PAL.length][1], PAL[i % PAL.length][2]),
        transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
      });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.rotation.x = 0.2 + i * 0.3;
      ring.rotation.y = i * 0.5;
      scene.add(ring);
      rings.push(ring);
    }

    // ── Nebulae — volumetric look ──
    const nebulae: (THREE.Sprite & { _baseOpacity: number })[] = [];
    for (let i = 0; i < 10; i++) {
      const c = document.createElement("canvas"); c.width = 512; c.height = 512;
      const ctx = c.getContext("2d")!;
      // Multi-layer radial gradient for volume
      const ci = PAL[i % PAL.length];
      const cx = 256 + (Math.random() - 0.5) * 60;
      const cy = 256 + (Math.random() - 0.5) * 60;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220 + Math.random() * 36);
      grad.addColorStop(0, `rgba(${Math.round(ci[0] * 255)},${Math.round(ci[1] * 255)},${Math.round(ci[2] * 255)},0.12)`);
      grad.addColorStop(0.3, `rgba(${Math.round(ci[0] * 200)},${Math.round(ci[1] * 200)},${Math.round(ci[2] * 200)},0.06)`);
      grad.addColorStop(0.6, `rgba(${Math.round(ci[0] * 120)},${Math.round(ci[1] * 120)},${Math.round(ci[2] * 120)},0.03)`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 512);
      // Second pass — displaced center for asymmetry
      const grad2 = ctx.createRadialGradient(cx + 40, cy - 30, 0, cx + 40, cy - 30, 160);
      grad2.addColorStop(0, `rgba(${Math.round(ci[0] * 255)},${Math.round(ci[1] * 255)},${Math.round(ci[2] * 255)},0.06)`);
      grad2.addColorStop(1, "transparent");
      ctx.fillStyle = grad2; ctx.fillRect(0, 0, 512, 512);
      const tex = new THREE.CanvasTexture(c);
      const baseOp = 0.04 + Math.random() * 0.04;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: baseOp });
      const spr = new THREE.Sprite(mat) as THREE.Sprite & { _baseOpacity: number };
      const dist = 200 + Math.random() * 900;
      const angle = Math.random() * Math.PI * 2;
      spr.scale.setScalar(300 + Math.random() * 700);
      spr.position.set(Math.cos(angle) * dist, (Math.random() - 0.5) * 120, Math.sin(angle) * dist);
      spr._baseOpacity = baseOp;
      scene.add(spr); nebulae.push(spr);
    }

    // ── Shooting Stars ──
    const SH_COUNT = 6, SH_TRAIL = 24;
    const shPos = new Float32Array(SH_COUNT * 3);
    const shVel = new Float32Array(SH_COUNT * 3);
    const shLife = new Float32Array(SH_COUNT);
    const shMaxLife = new Float32Array(SH_COUNT);
    const shTrailPos = new Float32Array(SH_COUNT * SH_TRAIL * 3);
    const shHead = new Int32Array(SH_COUNT);
    const shLen = new Int32Array(SH_COUNT);
    for (let i = 0; i < SH_COUNT; i++) {
      shPos[i * 3] = (Math.random() - 0.5) * 2000; shPos[i * 3 + 1] = (Math.random() - 0.5) * 800; shPos[i * 3 + 2] = (Math.random() - 0.5) * 2000;
      shVel[i * 3] = (Math.random() - 0.5) * 5; shVel[i * 3 + 1] = (Math.random() - 0.5) * 2; shVel[i * 3 + 2] = (Math.random() - 0.5) * 5;
      shLife[i] = 0; shMaxLife[i] = 80 + Math.random() * 140;
    }
    const shGeo = new THREE.BufferGeometry();
    shGeo.setAttribute("position", new THREE.BufferAttribute(shTrailPos, 3));
    const shMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.8, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    scene.add(new THREE.Points(shGeo, shMat));

    // ── Particles ──
    const pPos = new Float32Array(PARTICLE_POOL * 3);
    const pCol = new Float32Array(PARTICLE_POOL * 3);
    const pVel = new Float32Array(PARTICLE_POOL * 3);
    const pLife = new Float32Array(PARTICLE_POOL);
    const pMaxLife = new Float32Array(PARTICLE_POOL);
    const pSize = new Float32Array(PARTICLE_POOL);
    for (let i = 0; i < PARTICLE_POOL; i++) { pPos[i * 3 + 1] = -9999; pLife[i] = 0; pMaxLife[i] = 1; pSize[i] = 2; }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
    pGeo.setAttribute("aLife", new THREE.BufferAttribute(pLife, 1));
    pGeo.setAttribute("aMaxLife", new THREE.BufferAttribute(pMaxLife, 1));
    pGeo.setAttribute("aSize", new THREE.BufferAttribute(pSize, 1));
    const pMat = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: PR }, uBass: { value: 0 } },
      vertexShader: PARTICLE_VERT, fragmentShader: PARTICLE_FRAG,
      transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(pGeo, pMat));
    let pIdx = 0, pDirty = false;

    function emitParticles(x: number, y: number, z: number, col: number[], count: number, vel: number) {
      for (let i = 0; i < count; i++) {
        const idx = pIdx; pIdx = (pIdx + 1) % PARTICLE_POOL;
        pPos[idx * 3] = x; pPos[idx * 3 + 1] = y; pPos[idx * 3 + 2] = z;
        const speed = vel * 6;
        pVel[idx * 3] = (Math.random() - 0.5) * speed;
        pVel[idx * 3 + 1] = (Math.random() - 0.5) * speed;
        pVel[idx * 3 + 2] = (Math.random() - 0.5) * speed;
        pCol[idx * 3] = col[0]; pCol[idx * 3 + 1] = col[1]; pCol[idx * 3 + 2] = col[2];
        pLife[idx] = 1; pMaxLife[idx] = 35 + Math.random() * 45; pSize[idx] = 3 + Math.random() * 6;
        pDirty = true;
      }
    }

    // ── Ripple Pool ──
    const ripples: { mesh: THREE.Mesh; active: boolean; life: number }[] = [];
    for (let i = 0; i < RIPPLE_POOL; i++) {
      const rGeo = new THREE.RingGeometry(0.5, 1.5, 64);
      const rMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.visible = false; scene.add(rMesh);
      ripples.push({ mesh: rMesh, active: false, life: 0 });
    }

    function addRipple(x: number, y: number, z: number, col: number[]) {
      const r = ripples.find(r => !r.active); if (!r) return;
      r.active = true; r.life = 0; r.mesh.visible = true;
      r.mesh.position.set(x, y, z); r.mesh.scale.setScalar(1);
      (r.mesh.material as THREE.MeshBasicMaterial).color.setRGB(col[0], col[1], col[2]);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.6;
    }

    // ── FFT Bars (ring) ──
    const fftGroup = new THREE.Group(); scene.add(fftGroup);
    const fftMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < FFT_BARS; i++) {
      const bGeo = new THREE.BoxGeometry(4, 1, 4);
      const ci = Math.floor((i / FFT_BARS) * PAL.length) % PAL.length;
      const bMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(PAL[ci][0], PAL[ci][1], PAL[ci][2]),
        transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const mesh = new THREE.Mesh(bGeo, bMat);
      const ang = (i / FFT_BARS) * Math.PI * 2;
      mesh.position.set(Math.cos(ang) * 240, 0, Math.sin(ang) * 240);
      mesh.lookAt(0, 0, 0);
      fftGroup.add(mesh); fftMeshes.push(mesh);
    }

    // ── Post Processing ──
    const renderTarget = new THREE.WebGLRenderTarget(W(), H());
    const bloomW = () => Math.ceil(W() * 0.25);
    const bloomH = () => Math.ceil(H() * 0.25);
    const bloomTarget1 = new THREE.WebGLRenderTarget(bloomW(), bloomH());
    const bloomTarget2 = new THREE.WebGLRenderTarget(bloomW(), bloomH());
    const ppCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const fsQuad = new THREE.PlaneGeometry(2, 2);

    const brightPass = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, uThreshold: { value: 0.4 } }, vertexShader: PP_VERT, fragmentShader: BRIGHT_FRAG });
    const brightScene = new THREE.Scene(); brightScene.add(new THREE.Mesh(fsQuad, brightPass));

    const blurPass = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, uResolution: { value: new THREE.Vector2(bloomW(), bloomH()) } }, vertexShader: PP_VERT, fragmentShader: BLUR_FRAG });
    const blurScene = new THREE.Scene(); blurScene.add(new THREE.Mesh(fsQuad.clone(), blurPass));

    const compositePass = new THREE.ShaderMaterial({
      uniforms: { tOriginal: { value: null }, tBloom: { value: null }, uBloomStrength: { value: 0.55 }, uChromatic: { value: 0 }, uVignette: { value: 0.35 }, uTime: { value: 0 }, uMood: { value: 0.5 } },
      vertexShader: PP_VERT, fragmentShader: COMPOSITE_FRAG,
    });
    const compositeScene = new THREE.Scene(); compositeScene.add(new THREE.Mesh(fsQuad.clone(), compositePass));

    // ── Interaction state ──
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let scrollZ = 0;
    window.addEventListener("wheel", e => { scrollZ += e.deltaY * 0.2; }, { passive: true });
    window.addEventListener("mousemove", e => { mouse.tx = (e.clientX / W() - 0.5) * 2; mouse.ty = -(e.clientY / H() - 0.5) * 2; });

    const onResize = () => {
      camera.aspect = W() / H(); camera.updateProjectionMatrix();
      renderer.setSize(W(), H()); renderTarget.setSize(W(), H());
      bloomTarget1.setSize(bloomW(), bloomH()); bloomTarget2.setSize(bloomW(), bloomH());
      blurPass.uniforms.uResolution.value.set(bloomW(), bloomH());
    };
    window.addEventListener("resize", onResize);

    function screenToWorld(x: number, y: number) {
      const ndc = new THREE.Vector3((x / W()) * 2 - 1, -(y / H()) * 2 + 1, 0.5);
      ndc.unproject(camera);
      const dir = ndc.sub(camera.position).normalize();
      return camera.position.clone().add(dir.multiplyScalar(280));
    }

    engineRef.current = {
      camera, addRipple, emitParticles,
      s2w: (x: number, y: number) => { const p = screenToWorld(x, y); return [p.x, p.y, p.z]; },
    };

    const clock = new THREE.Clock();

    function frame() {
      rafRef.current = requestAnimationFrame(frame);
      const t = clock.getElapsedTime();
      const a = analysisRef.current;
      const fc = frameCount.current++;

      // Throttle FFT analysis — every 3rd frame
      if (fc % 3 === 0) analyze();

      // Gyro input — expanded mobile mechanics
      const g = gyroRef.current;
      if (g.on) {
        // Tilt controls camera position (gamma=left/right, beta=forward/back)
        mouse.tx = clamp(g.gamma / 30, -1, 1);
        mouse.ty = clamp(-g.beta / 45 + 0.5, -1, 1);
        
        // Alpha (compass rotation) slowly rotates galaxy — immersive exploration
        galaxy.rotation.y += (g.alpha * 0.0001 - galaxy.rotation.y * 0.001) * 0.02;
        
        // Tilt controls audio — throttled to every 6th frame to avoid rampTo spam
        if (audioRef.current && fc % 6 === 0) {
          const tiltBrightness = clamp((g.beta - 20) / 60, 0, 1);
          try { audioRef.current.fi.frequency.rampTo(500 + tiltBrightness * 5000, 0.5); } catch {}
          const tiltWet = clamp(Math.abs(g.gamma) / 45, 0, 0.6);
          try { audioRef.current.rv.wet.rampTo(0.12 + tiltWet, 0.5); } catch {}
        }
        
        // Accelerometer: tilt intensity affects bloom and chromatic aberration
        const accelMag = Math.sqrt(g.accelX ** 2 + g.accelY ** 2) * 0.05;
        compositePass.uniforms.uChromatic.value = clamp(a.treble * 1.5 + accelMag * 0.3, 0, 3);
        
        // Shake decay
        g.shake *= 0.92;
        if (g.shake > 0.01) {
          // Shake adds camera vibration and bloom burst
          camera.position.x += (Math.random() - 0.5) * g.shake * 8;
          camera.position.y += (Math.random() - 0.5) * g.shake * 6;
          compositePass.uniforms.uBloomStrength.value = 0.55 + g.shake * 1.5;
        } else {
          compositePass.uniforms.uBloomStrength.value = 0.55;
        }
      }

      // Smooth camera
      mouse.x += (mouse.tx - mouse.x) * 0.035;
      mouse.y += (mouse.ty - mouse.y) * 0.035;
      const warp = warpState.current;
      let targetZ = 650 + scrollZ;
      if (warp.on) { warp.t = Math.min(warp.t + 0.02, 1); targetZ = 650 - 450 * warp.t * warp.t + scrollZ; }
      camera.position.x += (mouse.x * 120 - camera.position.x) * 0.015;
      camera.position.y += (mouse.y * 80 - camera.position.y) * 0.015;
      camera.position.z += (targetZ - camera.position.z) * 0.035;
      camera.position.z = clamp(camera.position.z, 80, 1600);
      camera.lookAt(0, 0, 0);

      // Flash decay
      flashIntensity.current *= 0.92;

      // Galaxy
      galaxy.rotation.y = t * (0.015 + a.mid * 0.025);
      const gu = galaxyMat.uniforms;
      gu.uTime.value = t; gu.uBass.value = a.bass; gu.uTreble.value = a.treble;
      gu.uVol.value = a.vol; gu.uFlash.value = flashIntensity.current;

      // Star
      starMat.uniforms.uTime.value = t;
      starMat.uniforms.uBass.value = a.bass;
      starMat.uniforms.uPitch.value = a.pitch;
      star.scale.setScalar(1 + Math.sin(t * 1.5) * 0.06 + a.bass * 2.5);

      // Halo
      haloMat.uniforms.uTime.value = t;
      haloMat.uniforms.uBass.value = a.bass;
      halo.scale.setScalar(1 + a.bass * 2);

      // Rings
      for (let i = 0; i < rings.length; i++) {
        rings[i].rotation.z = t * (0.06 + i * 0.03 + a.mid * 0.25);
        (rings[i].material as THREE.MeshBasicMaterial).opacity = 0.08 + a.mid * 0.25;
      }

      // Nebulae
      for (const n of nebulae) {
        (n.material as THREE.SpriteMaterial).opacity = n._baseOpacity + a.mid * 0.05 + a.vol * 0.02;
      }

      // Shooting stars
      for (let i = 0; i < SH_COUNT; i++) {
        shLife[i]++;
        if (shLife[i] > shMaxLife[i]) {
          shLife[i] = 0;
          shPos[i * 3] = (Math.random() - 0.5) * 2000;
          shPos[i * 3 + 1] = (Math.random() - 0.5) * 800;
          shPos[i * 3 + 2] = (Math.random() - 0.5) * 2000;
          const v = 4 + a.high * 8;
          shVel[i * 3] = (Math.random() - 0.5) * v;
          shVel[i * 3 + 1] = (Math.random() - 0.5) * v * 0.4;
          shVel[i * 3 + 2] = (Math.random() - 0.5) * v;
          shHead[i] = 0; shLen[i] = 0;
        }
        shPos[i * 3] += shVel[i * 3];
        shPos[i * 3 + 1] += shVel[i * 3 + 1];
        shPos[i * 3 + 2] += shVel[i * 3 + 2];
        const h = shHead[i], base = i * SH_TRAIL * 3, idx = h * 3;
        shTrailPos[base + idx] = shPos[i * 3];
        shTrailPos[base + idx + 1] = shPos[i * 3 + 1];
        shTrailPos[base + idx + 2] = shPos[i * 3 + 2];
        shHead[i] = (h + 1) % SH_TRAIL;
        if (shLen[i] < SH_TRAIL) shLen[i]++;
      }
      shGeo.attributes.position.needsUpdate = true;

      // Particles
      let anyAlive = false;
      for (let i = 0; i < PARTICLE_POOL; i++) {
        if (pLife[i] > 0 && pLife[i] < pMaxLife[i]) {
          pLife[i]++;
          pPos[i * 3] += pVel[i * 3];
          pPos[i * 3 + 1] += pVel[i * 3 + 1];
          pPos[i * 3 + 2] += pVel[i * 3 + 2];
          pVel[i * 3] *= 0.97; pVel[i * 3 + 1] *= 0.97; pVel[i * 3 + 2] *= 0.97;
          anyAlive = true;
        } else if (pLife[i] >= pMaxLife[i]) {
          pLife[i] = 0; pPos[i * 3 + 1] = -9999; anyAlive = true;
        }
      }
      if (anyAlive || pDirty) {
        pGeo.attributes.position.needsUpdate = true;
        pGeo.attributes.aLife.needsUpdate = true;
        if (pDirty) {
          pGeo.attributes.color.needsUpdate = true;
          pGeo.attributes.aSize.needsUpdate = true;
          pGeo.attributes.aMaxLife.needsUpdate = true;
          pDirty = false;
        }
        pMat.uniforms.uBass.value = a.bass;
      }

      // Ripples
      for (const r of ripples) {
        if (!r.active) continue;
        r.life++;
        r.mesh.scale.setScalar(1 + r.life * 3);
        (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.6 * Math.pow(1 - r.life / 60, 2);
        if (r.life >= 60) { r.mesh.visible = false; r.active = false; }
      }

      // FFT bars (every 3rd frame)
      if (fc % 3 === 0) {
        for (let i = 0; i < FFT_BARS; i++) {
          const v = fftBuffer.current[Math.floor(i / FFT_BARS * 128)] || 0;
          fftMeshes[i].scale.y = 1 + v * 100;
          (fftMeshes[i].material as THREE.MeshBasicMaterial).opacity = 0.15 + v * 0.7;
        }
      }

      // Post-processing pipeline
      renderer.setRenderTarget(renderTarget); renderer.render(scene, camera);
      brightPass.uniforms.tDiffuse.value = renderTarget.texture;
      renderer.setRenderTarget(bloomTarget1); renderer.render(brightScene, ppCamera);
      blurPass.uniforms.tDiffuse.value = bloomTarget1.texture;
      renderer.setRenderTarget(bloomTarget2); renderer.render(blurScene, ppCamera);
      compositePass.uniforms.tOriginal.value = renderTarget.texture;
      compositePass.uniforms.tBloom.value = bloomTarget2.texture;
      compositePass.uniforms.uChromatic.value = a.treble * 1.5;
      compositePass.uniforms.uTime.value = t;
      compositePass.uniforms.uMood.value = SCALES[scaleRef.current]?.mood || 0.5;
      renderer.setRenderTarget(null); renderer.render(compositeScene, ppCamera);
    }

    frame();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      renderer.dispose(); renderTarget.dispose(); bloomTarget1.dispose(); bloomTarget2.dispose();
      scene.traverse((o: any) => {
        o.geometry?.dispose();
        if (o.material) { if (Array.isArray(o.material)) o.material.forEach((m: any) => m.dispose()); else o.material.dispose(); }
      });
    };
  }, []);

  /* ═══════════════════════════════════════════════
     Touch / Mouse Input
  ═══════════════════════════════════════════════ */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || phase !== "play") return;

    function noteOn(id: any, x: number, y: number) {
      if (!audioRef.current) return;
      resetUIHide();
      const sn = SCALES[scaleRef.current].notes;
      const midi = quantize(Math.round(BASE_MIDI + (x / window.innerWidth) * MIDI_RANGE), sn);
      const freq = m2f(midi);
      const brightness = 1 - y / window.innerHeight;
      const vel = 0.3 + brightness * 0.6;
      const cut = 300 + brightness * 5500;
      try {
        audioRef.current.ld.triggerAttack(freq, Tone.now(), vel);
        audioRef.current.sb.triggerAttack(m2f(midi - 12), Tone.now(), vel * 0.5);
        audioRef.current.fi.frequency.rampTo(cut, 0.08);
        audioRef.current.pd.volume.rampTo(-28, 0.05);
        setTimeout(() => { try { audioRef.current.pd.volume.rampTo(-20, 0.4); } catch {} }, 100);
      } catch {}
      haptic(12);
      const col = noteColor(midi);
      if (engineRef.current) {
        const [wx, wy, wz] = engineRef.current.s2w(x, y);
        engineRef.current.addRipple(wx, wy, wz, col);
        engineRef.current.emitParticles(wx, wy, wz, col, isMobile ? 15 : 30, vel);
      }
      touchesRef.current.set(id, { midi, freq, subFreq: m2f(midi - 12), x, y, note: NOTE_NAMES[midi % 12] });
    }

    function noteMove(id: any, x: number, y: number) {
      if (!audioRef.current || !touchesRef.current.has(id)) return;
      const prev = touchesRef.current.get(id);
      const sn = SCALES[scaleRef.current].notes;
      const midi = quantize(Math.round(BASE_MIDI + (x / window.innerWidth) * MIDI_RANGE), sn);
      const freq = m2f(midi);
      if (midi !== prev.midi) {
        try {
          audioRef.current.ld.triggerRelease(prev.freq, Tone.now());
          audioRef.current.sb.triggerRelease(prev.subFreq, Tone.now());
          const brightness = 1 - y / window.innerHeight;
          audioRef.current.ld.triggerAttack(freq, Tone.now() + 0.015, 0.3 + brightness * 0.5);
          audioRef.current.sb.triggerAttack(m2f(midi - 12), Tone.now() + 0.015, 0.25);
        } catch {}
        haptic(6);
        prev.midi = midi; prev.freq = freq; prev.subFreq = m2f(midi - 12); prev.note = NOTE_NAMES[midi % 12];
      }
      try { audioRef.current.fi.frequency.rampTo(300 + (1 - y / window.innerHeight) * 5500, 0.06); } catch {}
      prev.x = x; prev.y = y;
    }

    function noteOff(id: any) {
      const info = touchesRef.current.get(id);
      if (info && audioRef.current) {
        try { audioRef.current.ld.triggerRelease(info.freq, Tone.now()); audioRef.current.sb.triggerRelease(info.subFreq, Tone.now()); } catch {}
      }
      touchesRef.current.delete(id);
    }

    const onTS = (e: TouchEvent) => { e.preventDefault(); for (const t of Array.from(e.changedTouches)) noteOn(t.identifier, t.clientX, t.clientY); };
    const onTM = (e: TouchEvent) => { e.preventDefault(); for (const t of Array.from(e.changedTouches)) noteMove(t.identifier, t.clientX, t.clientY); };
    const onTE = (e: TouchEvent) => { for (const t of Array.from(e.changedTouches)) noteOff(t.identifier); };
    const onMD = (e: MouseEvent) => noteOn("m", e.clientX, e.clientY);
    const onMM = (e: MouseEvent) => { if (touchesRef.current.has("m")) noteMove("m", e.clientX, e.clientY); };
    const onMU = () => noteOff("m");

    cv.addEventListener("touchstart", onTS, { passive: false });
    cv.addEventListener("touchmove", onTM, { passive: false });
    cv.addEventListener("touchend", onTE); cv.addEventListener("touchcancel", onTE);
    cv.addEventListener("mousedown", onMD); cv.addEventListener("mousemove", onMM);
    cv.addEventListener("mouseup", onMU); cv.addEventListener("mouseleave", onMU);

    return () => {
      cv.removeEventListener("touchstart", onTS); cv.removeEventListener("touchmove", onTM);
      cv.removeEventListener("touchend", onTE); cv.removeEventListener("touchcancel", onTE);
      cv.removeEventListener("mousedown", onMD); cv.removeEventListener("mousemove", onMM);
      cv.removeEventListener("mouseup", onMU); cv.removeEventListener("mouseleave", onMU);
    };
  }, [phase, resetUIHide]);

  /* ── Glow overlays ── */
  useEffect(() => {
    let raf: number;
    function loop() {
      raf = requestAnimationFrame(loop);
      const container = glowContainerRef.current; if (!container) return;
      const active = touchesRef.current;

      glowsRef.current.forEach((el: any, id: any) => {
        if (!active.has(id)) {
          el.root.style.opacity = "0";
          setTimeout(() => { try { el.root.remove(); } catch {} }, 350);
          glowsRef.current.delete(id);
        }
      });

      active.forEach((info: any, id: any) => {
        let entry = glowsRef.current.get(id);
        if (!entry) {
          const root = document.createElement("div");
          root.style.cssText = "position:fixed;pointer-events:none;z-index:12;transform:translate(-50%,-50%);transition:opacity .3s cubic-bezier(.4,0,.2,1);text-align:center;";
          const orb = document.createElement("div");
          orb.style.cssText = "width:80px;height:80px;border-radius:50%;transition:all .15s ease-out;";
          const label = document.createElement("div");
          label.style.cssText = "font-family:'Orbitron',monospace;font-size:11px;margin-top:6px;letter-spacing:.12em;font-weight:400;transition:color .15s;";
          root.appendChild(orb); root.appendChild(label); container.appendChild(root);
          entry = { root, orb, label, lastMidi: -1, lastX: -1, lastY: -1 };
          glowsRef.current.set(id, entry);
        }
        if (info.x !== entry.lastX || info.y !== entry.lastY) {
          entry.root.style.left = info.x + "px"; entry.root.style.top = info.y + "px";
          entry.lastX = info.x; entry.lastY = info.y;
        }
        if (info.midi !== entry.lastMidi) {
          const hex = noteHex(info.midi);
          entry.orb.style.background = `radial-gradient(circle, ${hex}44 0%, ${hex}11 40%, transparent 70%)`;
          entry.orb.style.boxShadow = `0 0 40px ${hex}66, 0 0 80px ${hex}22`;
          entry.label.style.color = hex;
          entry.label.style.textShadow = `0 0 12px ${hex}`;
          entry.label.textContent = info.note;
          entry.lastMidi = info.midi;
        }
        entry.root.style.opacity = "0.9";
      });
    }
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ═══════════════════════════════════════════════
     DJ Auto-Play Engine
  ═══════════════════════════════════════════════ */
  useEffect(() => {
    const dj = djState.current;
    if (!autoPlay || !audioRef.current) {
      dj.on = false;
      if (dj.iv) { clearInterval(dj.iv); dj.iv = null; }
      try { audioRef.current?.pd?.releaseAll(); audioRef.current?.bs?.releaseAll(); audioRef.current?.ar?.releaseAll(); } catch {}
      setDjSection(""); return;
    }
    dj.on = true; dj.si = 0; dj.tis = 0; dj.tt = 0; dj.oct = 4; dj.deg = 0; dj.cf = 0.15; dj.ce = 0.1;
    const sn = () => SCALES[scaleRef.current];
    const sec = () => DJ_SECTIONS[dj.si % DJ_SECTIONS.length];
    let prog = (PROGS[scaleRef.current] || PROGS.minor)[0];
    dj.ci = 0; dj.motif = genMotif(sn().notes); dj.am = pick(ARP_MODES); dj.as = 0;

    // Cache matrix — only rebuild on scale/section change
    let cachedMatrix: Record<number, Record<number, number>> = buildMatrix(sn().notes);
    let cachedScale = scaleRef.current;
    let lastFilterVal = -1;

    function secRhy(s: any) { return s.d < 0.3 ? RHY.sparse : s.d < 0.5 ? RHY.quarter : s.d < 0.7 ? pick([RHY.syncopated, RHY.quarter]) : s.d < 0.85 ? RHY.driving : pick([RHY.dense, RHY.driving]); }
    function secBass(s: any) { return s.e < 0.4 ? BASS_PAT.whole : s.e < 0.7 ? BASS_PAT.octave : BASS_PAT.bounce; }
    let rhy = secRhy(sec()); dj.ri = 0; let bRhy = secBass(sec()); dj.bi = 0;

    function transition() {
      const s = sec(); setDjSection(s.name);
      rhy = secRhy(s); dj.ri = 0; bRhy = secBass(s); dj.bi = 0;
      dj.tf = s.ft; dj.te = s.e; dj.am = pick(ARP_MODES); dj.as = 0;
      try {
        const [at, dc, su, rl] = s.adsr;
        const [mi, hm, , sp] = s.mod;
        audioRef.current.ld.set({ envelope: { attack: at, decay: dc, sustain: su, release: rl }, modulationIndex: mi, harmonicity: hm });
        audioRef.current.rv.wet.value = s.rv;
        audioRef.current.dl.wet.value = s.dw;
      } catch {}
      // Rebuild matrix only on scale change
      if (scaleRef.current !== cachedScale) {
        cachedMatrix = buildMatrix(sn().notes);
        cachedScale = scaleRef.current;
      }
      const sc2 = sn();
      switch (s.algo) {
        case "motif": dj.phrase = [...dj.motif]; break;
        case "sequence": dj.phrase = devMotif(dj.motif, "sequence", sc2.notes.length); break;
        case "develop": dj.phrase = devMotif(dj.motif, pick(["transpose", "invert", "ornament"]), sc2.notes.length); break;
        case "fragment": dj.phrase = devMotif(dj.motif, "fragment", sc2.notes.length); break;
        case "climax": dj.phrase = [...devMotif(dj.motif, "ornament", sc2.notes.length), ...devMotif(dj.motif, "transpose", sc2.notes.length)]; break;
        default: dj.phrase = [];
      }
      dj.pp = 0;
      if (dj.si % 3 === 0) { const ps = PROGS[scaleRef.current] || PROGS.minor; prog = pick(ps); dj.ci = 0; }
    }
    transition(); setDjSection(sec().name);

    dj.iv = setInterval(() => {
      if (!audioRef.current || !dj.on) return;
      const s = sec(), sc2 = sn(), notes = sc2.notes, chords = sc2.chords;
      // Refresh matrix cache if scale changed
      if (scaleRef.current !== cachedScale) { cachedMatrix = buildMatrix(notes); cachedScale = scaleRef.current; }
      const matrix = cachedMatrix;
      
      dj.tt++; dj.tis++;
      dj.ce += (dj.te - dj.ce) * 0.06;
      dj.cf += (dj.tf - dj.cf) * 0.04;
      const E = dj.ce;
      if (s.sweep) { dj.cf = lerp(s.ft * 0.3, s.ft, Math.min(dj.tis / (s.bars * 4), 1)); }
      
      // Throttle filter rampTo — only when value changes significantly
      const newFilterVal = Math.round(200 + dj.cf * 5800);
      if (Math.abs(newFilterVal - lastFilterVal) > 100) {
        lastFilterVal = newFilterVal;
        try { audioRef.current.fi.frequency.rampTo(newFilterVal, 0.3); } catch {}
      }
      
      if (dj.tis >= s.bars * 4) { dj.tis = 0; dj.si++; transition(); return; }
      dj.ct++;
      if (dj.ct >= 4) {
        dj.ct = 0; dj.ci = (dj.ci + 1) % prog.length;
        dj.ac = chords[prog[dj.ci] % chords.length] || [];
        if (s.l.pd > 0) {
          try {
            audioRef.current.pd.releaseAll(Tone.now());
            const padFreqs = dj.ac.map((n: number) => m2f(48 + n));
            audioRef.current.pd.triggerAttack(padFreqs, Tone.now() + 0.02, 0.08 + E * 0.12 * s.l.pd);
            audioRef.current.pf.frequency.rampTo(400 + E * 2500, 0.8);
          } catch {}
        }
        if (dj.tt % 8 === 0) {
          try {
            const rn = notes[prog[dj.ci] % notes.length];
            audioRef.current.dn.releaseAll(Tone.now() + 0.1);
            audioRef.current.dn.triggerAttack([m2f(36 + rn), m2f(36 + rn + 7)], Tone.now() + 0.15);
          } catch {}
        }
      }

      const rC = rhy[dj.ri % rhy.length]; dj.ri++; const durS = rC[0] * 0.14;
      const now = Tone.now();

      // Melody — use triggerAttackRelease with offset to prevent scheduling conflicts
      if (s.l.ml > 0 && dj.phrase.length > 0) {
        const restProb = E < 0.2 ? 0.5 : E < 0.4 ? 0.25 : 0.08;
        if (Math.random() > restProb) {
          let di: number;
          if (dj.pp < dj.phrase.length) { di = dj.phrase[dj.pp]; dj.pp++; }
          else { di = wPick(matrix[dj.deg]); dj.deg = di; }
          dj.oct = E > 0.6 ? 5 : 4;
          const midi = dj.oct * 12 + notes[di % notes.length];
          const vel = Math.min((0.1 + E * 0.6) * rC[1] * s.l.ml, 0.85);
          try {
            audioRef.current.ld.triggerAttackRelease(m2f(midi), durS * 0.8, now + 0.01, vel);
          } catch {}
          if (engineRef.current && dj.tt % 2 === 0) {
            const fx = ((midi - BASE_MIDI) / MIDI_RANGE) * window.innerWidth;
            const fy = (1 - E) * window.innerHeight;
            const [wx, wy, wz] = engineRef.current.s2w(fx, fy);
            engineRef.current.addRipple(wx, wy, wz, noteColor(midi));
            engineRef.current.emitParticles(wx, wy, wz, noteColor(midi), Math.floor(4 + E * 10), E);
          }
        }
      }

      // Bass — less frequent
      if (s.l.bs > 0) {
        const bC = bRhy[dj.bi % bRhy.length]; dj.bi++;
        if (bC[1] > 0) {
          const bn = notes[prog[dj.ci] % notes.length];
          try { audioRef.current.bs.triggerAttackRelease(m2f(36 + bn), bC[0] * 0.12, now + 0.01, Math.min((0.2 + E * 0.5) * bC[1] * s.l.bs, 0.8)); } catch {}
        }
      }

      // Arp — every 3rd tick instead of 2nd
      if (s.l.ar > 0 && dj.ac.length > 0 && dj.tt % 3 === 0) {
        const an = getArpNote(dj.ac, dj.as, dj.am); dj.as++;
        try { audioRef.current.ar.triggerAttackRelease(m2f(60 + an), 0.1, now + 0.01, Math.min((0.12 + E * 0.3) * s.l.ar, 0.7)); } catch {}
      }

      // Counter melody — less frequent
      if (s.l.ct > 0 && dj.tt % 8 === 5) {
        const cD = wPick(matrix[dj.deg]);
        try { audioRef.current.ld.triggerAttackRelease(m2f(60 + notes[cD % notes.length]), 0.08, now + 0.06, Math.min((0.08 + E * 0.25) * s.l.ct, 0.6)); } catch {}
      }

      if (s.riser && dj.tt % 3 === 0) { dj.rf = lerp(200, 2000, dj.tis / (s.bars * 4)); try { audioRef.current.af.frequency.rampTo(dj.rf, 0.3); } catch {} }
    }, 160);  // Slower tick rate: 160ms instead of 140ms

    return () => { if (djState.current.iv) { clearInterval(djState.current.iv); djState.current.iv = null; } };
  }, [autoPlay]);

  /* ═══════════════════════════════════════════════
     UI Controls
  ═══════════════════════════════════════════════ */
  const changeScale = useCallback((newScale: string) => {
    setScale(newScale);
    flashIntensity.current = 1;
    setFlash(SCALES[newScale].label);
    setTimeout(() => setFlash(""), 1500);
  }, []);

  const nextScale = useCallback(() => {
    const i = SCALE_ORDER.indexOf(scale);
    changeScale(SCALE_ORDER[(i + 1) % SCALE_ORDER.length]);
  }, [scale, changeScale]);

  const prevScale = useCallback(() => {
    const i = SCALE_ORDER.indexOf(scale);
    changeScale(SCALE_ORDER[(i - 1 + SCALE_ORDER.length) % SCALE_ORDER.length]);
  }, [scale, changeScale]);

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#010008", touchAction: "none" }}>
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 1, touchAction: "none" }} />
      <div ref={glowContainerRef} style={{ position: "fixed", inset: 0, zIndex: 12, pointerEvents: "none" }} />

      {/* ── Splash Screen ── */}
      {phase === "splash" && (
        <div
          onTouchStart={(e) => { e.preventDefault(); handleStart(); }}
          onClick={() => handleStart()}
          className="cosmic-splash"
        >
          <div className="cosmic-splash-inner">
            <div className="cosmic-logo">COSMIC SYNTH</div>
            <div className="cosmic-subtitle-group">
              <div className="cosmic-line" />
              <div className="cosmic-subtitle">INTERACTIVE MUSIC EXPERIENCE</div>
              <div className="cosmic-line" />
            </div>
            <div className="cosmic-cta">
              <div className="cosmic-cta-ring" />
              <span>TAP TO ENTER</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Warp Transition ── */}
      {phase === "warp" && (
        <div className="cosmic-warp">
          <div className="cosmic-warp-text">ENTERING THE COSMOS</div>
          <div className="cosmic-warp-bar">
            <div className="cosmic-warp-fill" style={{ width: `${warpProgress * 100}%` }} />
          </div>
        </div>
      )}

      {/* ── Play UI ── */}
      {phase === "play" && (
        <>
          {/* Title bar */}
          <div className="cosmic-header" style={{ opacity: showUI ? 1 : 0 }}>
            <div className="cosmic-header-title">COSMIC SYNTH</div>
            <div className="cosmic-header-sub">Touch · Tilt · Shake</div>
          </div>

          {/* Hint */}
          {!hintDismissed && (
            <div className="cosmic-hint">Touch to play · Tilt to explore · Shake to change scale</div>
          )}

          {/* Auto-play button */}
          <div className="cosmic-auto-group">
            <button
              onTouchStart={(e) => { e.preventDefault(); setAutoPlay(p => !p); }}
              onClick={() => setAutoPlay(p => !p)}
              className={`cosmic-btn cosmic-btn-auto ${autoPlay ? "active" : ""}`}
            >
              <span className="cosmic-btn-icon">
                {autoPlay ? "⏸" : "▶"}
              </span>
              <span className="cosmic-btn-label">AUTO</span>
            </button>
            {autoPlay && djSection && (
              <div className="cosmic-section-tag">{djSection}</div>
            )}
            {/* Sequencer button */}
            <button
              onTouchStart={(e) => { e.preventDefault(); setSeqOpen(true); }}
              onClick={() => setSeqOpen(true)}
              className="cosmic-btn cosmic-btn-seq"
            >
              <span className="cosmic-btn-icon">⎚</span>
              <span className="cosmic-btn-label">SEQ</span>
            </button>
          </div>

          {/* Scale selector */}
          <div className="cosmic-scale-group">
            <button
              onTouchStart={(e) => { e.preventDefault(); prevScale(); }}
              onClick={() => prevScale()}
              className="cosmic-btn cosmic-btn-arrow"
            >
              ‹
            </button>
            <div className="cosmic-scale-label">{SCALES[scale].label}</div>
            <button
              onTouchStart={(e) => { e.preventDefault(); nextScale(); }}
              onClick={() => nextScale()}
              className="cosmic-btn cosmic-btn-arrow"
            >
              ›
            </button>
          </div>

          {/* Flash indicator */}
          {flash && <div className="cosmic-flash">{flash}</div>}

          {/* Gyro prompt */}
          {gyroPrompt && (
            <button
              onTouchStart={(e) => { e.preventDefault(); grantGyro(); }}
              onClick={() => grantGyro()}
              className="cosmic-btn cosmic-gyro-prompt"
            >
              🌀 Allow motion controls
              <span style={{ display: "block", fontSize: 9, opacity: 0.5, marginTop: 4 }}>
                Tilt · Rotate · Shake
              </span>
            </button>
          )}

          {/* Audio fallback */}
          {!audioOk && (
            <div className="cosmic-error">Audio unavailable — visual only</div>
          )}
        </>
      )}

      {/* Sequencer */}
      {phase === "play" && (
        <CosmicSequencer
          visible={seqOpen}
          onClose={() => setSeqOpen(false)}
          audioRef={audioRef}
          engineRef={engineRef}
          scaleRef={scaleRef}
          scales={SCALES}
          noteColorFn={noteColor}
          m2fFn={m2f}
        />
      )}

      <style>{`
        /* ── Cosmic Design System ── */
        @keyframes cosmicGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes cosmicPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes cosmicFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes cosmicRing {
          0% { transform: scale(0.8); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.2; }
          100% { transform: scale(0.8); opacity: 0.6; }
        }
        @keyframes cosmicFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cosmicShimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes cosmicWarpPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .cosmic-splash {
          position: fixed; inset: 0; z-index: 100;
          display: flex; align-items: center; justify-content: center;
          background: radial-gradient(ellipse at center, rgba(2,0,16,0.85) 0%, rgba(0,0,0,0.95) 100%);
          backdrop-filter: blur(8px);
          cursor: pointer; touch-action: none;
        }
        .cosmic-splash-inner {
          display: flex; flex-direction: column; align-items: center; gap: 28px;
          animation: cosmicFadeIn 1.2s ease-out;
        }
        .cosmic-logo {
          font-family: 'Orbitron', monospace;
          font-size: clamp(26px, 7vw, 58px);
          font-weight: 900;
          letter-spacing: 0.22em;
          background: linear-gradient(135deg, #00f0ff 0%, #a855f7 30%, #ff00e6 60%, #ffee00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 300% 100%;
          animation: cosmicGradient 6s ease infinite;
          text-align: center;
          filter: drop-shadow(0 0 30px rgba(0,240,255,0.3));
        }
        .cosmic-subtitle-group {
          display: flex; align-items: center; gap: 16px;
        }
        .cosmic-line {
          width: clamp(30px, 8vw, 80px); height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        }
        .cosmic-subtitle {
          font-family: 'Raleway', sans-serif;
          font-size: clamp(8px, 1.6vw, 12px);
          font-weight: 300;
          letter-spacing: 0.35em;
          color: rgba(255,255,255,0.35);
        }
        .cosmic-cta {
          position: relative;
          display: flex; align-items: center; justify-content: center;
          margin-top: 20px;
          animation: cosmicFloat 3s ease-in-out infinite;
        }
        .cosmic-cta span {
          font-family: 'Orbitron', monospace;
          font-size: clamp(10px, 2vw, 14px);
          font-weight: 400;
          letter-spacing: 0.3em;
          color: rgba(0,240,255,0.6);
          animation: cosmicPulse 2.5s ease-in-out infinite;
        }
        .cosmic-cta-ring {
          position: absolute;
          width: 100px; height: 100px;
          border: 1px solid rgba(0,240,255,0.15);
          border-radius: 50%;
          animation: cosmicRing 3s ease-in-out infinite;
        }

        .cosmic-warp {
          position: fixed; inset: 0; z-index: 100;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px;
          background: radial-gradient(ellipse at center, rgba(2,0,16,0.7) 0%, rgba(0,0,0,0.9) 100%);
          backdrop-filter: blur(4px);
        }
        .cosmic-warp-text {
          font-family: 'Orbitron', monospace;
          font-size: clamp(10px, 2vw, 14px);
          font-weight: 400;
          letter-spacing: 0.4em;
          color: rgba(0,240,255,0.5);
          animation: cosmicWarpPulse 1s ease-in-out infinite;
        }
        .cosmic-warp-bar {
          width: clamp(180px, 50vw, 350px); height: 2px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px; overflow: hidden;
        }
        .cosmic-warp-fill {
          height: 100%;
          background: linear-gradient(90deg, #00f0ff, #ff00e6);
          border-radius: 2px;
          transition: width 0.1s linear;
          box-shadow: 0 0 12px rgba(0,240,255,0.4);
        }

        .cosmic-header {
          position: fixed; top: 24px; left: 0; right: 0; z-index: 10;
          display: flex; flex-direction: column; align-items: center;
          pointer-events: none;
          transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cosmic-header-title {
          font-family: 'Orbitron', monospace;
          font-size: clamp(10px, 1.8vw, 14px);
          font-weight: 400;
          letter-spacing: 0.35em;
          background: linear-gradient(90deg, rgba(0,240,255,0.7), rgba(168,85,247,0.6));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
        }
        .cosmic-header-sub {
          font-family: 'Raleway', sans-serif;
          font-size: 9px; font-weight: 300;
          letter-spacing: 0.2em;
          color: rgba(255,255,255,0.2);
        }

        .cosmic-hint {
          position: fixed; bottom: 16%; left: 0; right: 0; z-index: 10;
          text-align: center;
          font-family: 'Raleway', sans-serif;
          font-size: clamp(10px, 1.6vw, 13px);
          font-weight: 300;
          letter-spacing: 0.25em;
          color: rgba(255,255,255,0.15);
          pointer-events: none;
          animation: cosmicPulse 3.5s ease-in-out infinite;
        }

        .cosmic-btn {
          all: unset;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04);
          cursor: pointer; touch-action: none;
          user-select: none; -webkit-user-select: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cosmic-btn:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
        }
        .cosmic-btn:active {
          transform: scale(0.95);
        }

        .cosmic-btn-auto, .cosmic-btn-seq {
          flex-direction: column; gap: 3px;
          width: 52px; height: 52px; border-radius: 50%;
          font-family: 'Orbitron', monospace;
          color: rgba(255,255,255,0.35);
        }
        .cosmic-btn-seq {
          background: rgba(168,85,247,0.04);
          border-color: rgba(168,85,247,0.12);
        }
        .cosmic-btn-seq:hover {
          background: rgba(168,85,247,0.1);
          border-color: rgba(168,85,247,0.25);
          color: rgba(168,85,247,0.8);
        }
        .cosmic-btn-auto .cosmic-btn-icon {
          font-size: 14px; line-height: 1;
        }
        .cosmic-btn-auto .cosmic-btn-label {
          font-size: 7px; letter-spacing: 0.15em; font-weight: 400;
        }
        .cosmic-btn-auto.active {
          color: #00f0ff;
          background: rgba(0,240,255,0.08);
          border-color: rgba(0,240,255,0.25);
          box-shadow: 0 0 30px rgba(0,240,255,0.1), inset 0 0 15px rgba(0,240,255,0.05);
        }

        .cosmic-btn-arrow {
          width: 34px; height: 34px; border-radius: 50%;
          font-family: 'Raleway', sans-serif;
          font-size: 16px; font-weight: 300;
          color: rgba(255,255,255,0.3);
        }

        .cosmic-auto-group {
          position: fixed; bottom: 24px; left: 24px; z-index: 10;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .cosmic-section-tag {
          font-family: 'Orbitron', monospace;
          font-size: 8px; letter-spacing: 0.18em;
          color: rgba(0,240,255,0.4);
          padding: 3px 10px;
          background: rgba(0,240,255,0.04);
          border: 1px solid rgba(0,240,255,0.1);
          border-radius: 10px;
        }

        .cosmic-scale-group {
          position: fixed; bottom: 24px; right: 24px; z-index: 10;
          display: flex; align-items: center; gap: 12px;
        }
        .cosmic-scale-label {
          font-family: 'Orbitron', monospace;
          font-size: clamp(10px, 1.8vw, 13px);
          font-weight: 400;
          letter-spacing: 0.22em;
          color: rgba(255,255,255,0.45);
          min-width: 65px; text-align: center;
        }

        .cosmic-flash {
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 15;
          font-family: 'Orbitron', monospace;
          font-size: clamp(28px, 6vw, 52px);
          font-weight: 900;
          letter-spacing: 0.3em;
          background: linear-gradient(135deg, #00f0ff, #a855f7, #ff00e6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 20px rgba(0,240,255,0.4));
          pointer-events: none;
          animation: cosmicPulse 1.5s ease-out forwards;
        }

        .cosmic-gyro-prompt {
          position: fixed !important;
          bottom: 80px !important; left: 50% !important;
          transform: translateX(-50%) !important;
          z-index: 20 !important;
          padding: 14px 28px !important;
          border-radius: 24px !important;
          font-family: 'Raleway', sans-serif !important;
          font-size: 12px !important;
          color: rgba(0,240,255,0.6) !important;
          letter-spacing: 0.08em !important;
        }

        .cosmic-error {
          position: fixed; top: 65px; left: 50%;
          transform: translateX(-50%);
          z-index: 15;
          font-family: 'Raleway', sans-serif;
          font-size: 10px;
          color: rgba(255,100,100,0.4);
          letter-spacing: 0.1em;
        }
      `}</style>
    </div>
  );
}
