import type { DrumName } from "../constants";

export type RGB = number[];

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

export interface Bubble {
  x: number; y: number; r: number; vy: number;
  wobblePhase: number; alive: boolean;
}

export interface Fish {
  x: number; y: number; vx: number; vy: number;
  hue: number; size: number; phase: number;
}

export interface CoralSegment {
  len: number; angle: number; angVel: number; target: number; w: number;
}

export interface Coral {
  baseX: number; baseY: number;
  segments: CoralSegment[];
  hue: string;
  baseAngle: number;
}

export interface LightRay {
  x: number; width: number; speed: number;
}

export interface DrumGlyph {
  name: DrumName; x: number; y: number;
  color: RGB; label: string; pulse: number;
}
