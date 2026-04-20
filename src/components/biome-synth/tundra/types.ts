import type { DrumName } from "../shared/constants";

export type RGB = number[];

export interface Snowflake {
  x: number; y: number; vx: number; vy: number;
  size: number; phase: number; spin: number;
}

export interface StarDot {
  x: number; y: number; base: number; phase: number; speed: number;
}

export interface AuroraRibbon {
  y: number;         // vertical anchor (0..1 of H)
  amp: number;       // sin-wave amplitude (fraction of H)
  freq: number;      // horizontal cycles across the screen
  phase: number;     // animated over time
  speed: number;     // phase accumulation rate
  hue: RGB;          // ribbon tint
  alpha: number;     // base opacity
  thickness: number; // vertical band height (px)
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
