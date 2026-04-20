import type { DrumName } from "../shared/constants";

export type RGB = number[];

export interface Snowflake {
  x: number; y: number;
  r: number;         // radius px
  vy: number;        // base vertical fall rate
  drift: number;     // base horizontal drift
  phase: number;     // sin oscillator seed for x drift
  phaseSpeed: number;
  opacity: number;
  spin: number;      // flake rotation rate (deg/frame)
  angle: number;     // current rotation
  kind: 0 | 1;       // 0 = round pellet, 1 = six-point flake
}

export interface StarDot {
  x: number; y: number; base: number; phase: number; speed: number;
}

export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number;
  col: RGB; rot: number; vr: number;
  kind: 0 | 1; alive: boolean;
}

export interface Ripple {
  x: number; y: number; r: number; maxR: number;
  col: RGB; alpha: number; alive: boolean;
}

export interface DrumGlyph {
  name: DrumName; x: number; y: number;
  color: RGB; label: string; pulse: number;
}

export interface Penguin {
  x: number; y: number;
  baseY: number;
  vx: number;        // walk speed (can be ±)
  facing: 1 | -1;    // 1 = right, -1 = left
  phase: number;     // waddle clock (radians)
  phaseSpeed: number;
  scale: number;     // per-penguin size multiplier
  mood: number;      // subtle color variation 0..1
  sliding: boolean;
  slideTime: number; // seconds remaining on belly-slide
}
