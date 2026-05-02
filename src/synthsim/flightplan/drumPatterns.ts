export type DrumPatternKey =
  | "silence"
  | "tick"
  | "build"
  | "fourFloor"
  | "pulse"
  | "filtered"
  | "tight"
  | "impact";

export interface DrumPattern {
  key: DrumPatternKey;
  kick: number[];
  hat: number[];
}

const STEPS = 16;

const z = (): number[] => Array(STEPS).fill(0);

const at = (positions: number[], vel = 1): number[] => {
  const arr = z();
  for (const p of positions) arr[p] = vel;
  return arr;
};

export const DRUM_PATTERNS: Record<DrumPatternKey, DrumPattern> = {
  silence:   { key: "silence",   kick: z(),                                hat: z() },
  tick:      { key: "tick",      kick: z(),                                hat: at([2, 6, 10, 14], 0.4) },
  build:     { key: "build",     kick: at([0, 4, 8, 12], 0.7),              hat: at([2, 6, 10, 14], 0.6) },
  fourFloor: { key: "fourFloor", kick: at([0, 4, 8, 12]),                   hat: at([2, 6, 10, 14], 0.7) },
  pulse:     { key: "pulse",     kick: at([0, 8], 0.85),                    hat: at([4, 12], 0.5) },
  filtered:  { key: "filtered",  kick: at([0, 4, 8, 12], 0.6),              hat: at([2, 6, 10, 14], 0.8) },
  tight:     { key: "tight",     kick: at([0, 4, 8, 12]),                   hat: at([0, 2, 4, 6, 8, 10, 12, 14], 0.6) },
  impact:    { key: "impact",    kick: at([0], 1.0),                        hat: at([8], 0.4) },
};

export const PATTERN_STEPS = STEPS;
