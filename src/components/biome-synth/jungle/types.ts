import type { DrumName } from "../shared/constants";

export type RGB = number[];

export interface Firefly {
  x: number; y: number; vx: number; vy: number;
  hue: number; phase: number; speed: number;
}

export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number;
  col: RGB; colStr: string; rot: number; vr: number;
  kind: 0 | 1; alive: boolean;
}

export interface Ripple {
  x: number; y: number; r: number; maxR: number;
  col: RGB; colRgb: string; alpha: number; alive: boolean;
}

export interface DrumGlyph {
  name: DrumName; x: number; y: number;
  color: RGB; label: string; pulse: number;
}

export interface MistBand {
  y: number; speed: number; alpha: number; h: number; off: number;
}
