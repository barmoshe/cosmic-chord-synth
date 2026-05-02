export type ScaleName =
  | "minorPentatonic"
  | "dorian"
  | "mixolydian"
  | "lydian"
  | "ionian"
  | "aeolian"
  | "phrygian"
  | "locrian";

export interface Scale {
  name: ScaleName;
  steps: number[];
}

export const SCALES: Record<ScaleName, Scale> = {
  minorPentatonic: { name: "minorPentatonic", steps: [0, 3, 5, 7, 10] },
  dorian:          { name: "dorian",          steps: [0, 2, 3, 5, 7, 9, 10] },
  mixolydian:      { name: "mixolydian",      steps: [0, 2, 4, 5, 7, 9, 10] },
  lydian:          { name: "lydian",          steps: [0, 2, 4, 6, 7, 9, 11] },
  ionian:          { name: "ionian",          steps: [0, 2, 4, 5, 7, 9, 11] },
  aeolian:         { name: "aeolian",         steps: [0, 2, 3, 5, 7, 8, 10] },
  phrygian:        { name: "phrygian",        steps: [0, 1, 3, 5, 7, 8, 10] },
  locrian:         { name: "locrian",         steps: [0, 1, 3, 5, 6, 8, 10] },
};

export const SCALE_NAMES_BY_OCTANT: ScaleName[] = [
  "minorPentatonic",
  "dorian",
  "mixolydian",
  "lydian",
  "ionian",
  "aeolian",
  "phrygian",
  "locrian",
];

const TWO_PI = 360;
const OCTANT = TWO_PI / 8;

export const headingToScale = (deg: number): ScaleName => {
  const wrapped = ((deg % TWO_PI) + TWO_PI) % TWO_PI;
  const idx = Math.floor(wrapped / OCTANT) % 8;
  return SCALE_NAMES_BY_OCTANT[idx];
};

export const scaleStepToMidi = (
  scale: Scale,
  step: number,
  rootMidi: number,
  octaveOffset: number,
): number => {
  const len = scale.steps.length;
  const wrappedStep = ((step % len) + len) % len;
  return rootMidi + octaveOffset * 12 + scale.steps[wrappedStep];
};
