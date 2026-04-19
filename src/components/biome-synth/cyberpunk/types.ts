import type { DrumName } from "../shared/constants";

export type RGB = number[];

export interface Building {
  x: number; w: number; h: number; color: string; stripe: string;
  windowRows: number; windowCols: number; windowSeed: number;
  lightPhase: number; bandIdx: number;
}

export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number;
  col: RGB; rot: number; vr: number;
  alive: boolean; kind: 0 | 1;
}

export interface Ripple {
  x: number; y: number; r: number; maxR: number;
  col: RGB; alpha: number; alive: boolean;
}

export interface RainStreak {
  x: number; y: number; speed: number; len: number; hue: number; alpha: number;
}

export interface DrumGlyph {
  name: DrumName; x: number; y: number;
  color: RGB; label: string; pulse: number;
}
