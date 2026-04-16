export const SCALES: Record<string, { notes: number[]; label: string; mood: number; chords: number[][] }> = {
  pentatonic: { notes: [0, 3, 5, 7, 10], label: "PENTA", mood: 0.5, chords: [[0, 3, 7], [3, 7, 10], [5, 7, 10], [7, 10, 12], [10, 12, 15]] },
  minor: { notes: [0, 2, 3, 5, 7, 8, 10], label: "MINOR", mood: 0.2, chords: [[0, 3, 7], [2, 5, 8], [3, 7, 10], [5, 8, 12], [7, 10, 14], [8, 12, 15], [10, 14, 17]] },
  major: { notes: [0, 2, 4, 5, 7, 9, 11], label: "MAJOR", mood: 0.85, chords: [[0, 4, 7], [2, 5, 9], [4, 7, 11], [5, 9, 12], [7, 11, 14], [9, 12, 16], [11, 14, 17]] },
  arabic: { notes: [0, 1, 4, 5, 7, 8, 11], label: "ARABIC", mood: 0.25, chords: [[0, 4, 7], [1, 5, 8], [4, 7, 11], [5, 8, 12], [7, 11, 13], [8, 12, 16]] },
};
export const SCALE_ORDER = ["pentatonic", "minor", "major", "arabic"];
export const PROGS: Record<string, number[][]> = {
  pentatonic: [[0, 3, 0, 4], [0, 1, 2, 0]],
  minor: [[0, 3, 4, 0], [0, 5, 3, 4], [0, 2, 5, 4]],
  major: [[0, 4, 5, 3], [0, 3, 4, 0]],
  arabic: [[0, 3, 4, 0], [0, 2, 4, 0]],
};

export const isMobile = typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);
export const BASE_MIDI = 48;
export const MIDI_RANGE = 36;
export const GALAXY_COUNT = isMobile ? 5000 : 9000;
export const PARTICLE_POOL = isMobile ? 150 : 300;
export const RIPPLE_POOL = 12;
export const FFT_BARS = 32;
export const SMOOTH = 0.14;
// Glacial Aurora 2026: teal, cyan, periwinkle, mint, lavender, single gold warm-spark for tension
export const PAL: number[][] = [[0.08, 0.72, 0.65], [0.13, 0.83, 0.93], [0.51, 0.55, 0.97], [0.37, 0.92, 0.83], [0.65, 0.55, 0.98], [0.99, 0.83, 0.30]];
export const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

/* DJ Arrangement */
export const DJ_SECTIONS = [
  { name: "INTRO", bars: 4, e: 0.1, d: 0.15, l: { dr: 1, pd: 0, bs: 0, ml: 0, ar: 0, ct: 0 }, ft: 0.15, rv: 0.6, dw: 0.2, algo: "silent", adsr: [2, 1, 0.7, 3], mod: [1, 1, 0, 5] },
  { name: "VERSE", bars: 8, e: 0.3, d: 0.4, l: { dr: 1, pd: 0.5, bs: 0, ml: 1, ar: 0, ct: 0 }, ft: 0.35, rv: 0.45, dw: 0.18, algo: "motif", adsr: [0.08, 0.3, 0.5, 1.5], mod: [3, 2, 8, 12] },
  { name: "BUILD", bars: 4, e: 0.55, d: 0.6, l: { dr: 1, pd: 0.7, bs: 0.3, ml: 1, ar: 0.5, ct: 0 }, ft: 0.6, rv: 0.35, dw: 0.15, algo: "sequence", sweep: 1, adsr: [0.05, 0.25, 0.55, 1.2], mod: [4, 2.5, 12, 15] },
  { name: "DROP", bars: 8, e: 0.85, d: 0.8, l: { dr: 1, pd: 1, bs: 1, ml: 1, ar: 0.8, ct: 0.3 }, ft: 0.9, rv: 0.3, dw: 0.12, algo: "develop", adsr: [0.03, 0.2, 0.6, 0.8], mod: [5, 3, 15, 18] },
  { name: "BREAK", bars: 6, e: 0.2, d: 0.25, l: { dr: 1, pd: 0.8, bs: 0, ml: 0.5, ar: 0, ct: 0 }, ft: 0.25, rv: 0.55, dw: 0.25, algo: "fragment", adsr: [0.15, 0.4, 0.4, 2.5], mod: [2, 1.5, 5, 8] },
  { name: "BUILD2", bars: 4, e: 0.65, d: 0.7, l: { dr: 1, pd: 0.8, bs: 0.5, ml: 1, ar: 0.7, ct: 0.3 }, ft: 0.75, rv: 0.3, dw: 0.13, algo: "sequence", sweep: 1, riser: 1, adsr: [0.04, 0.2, 0.6, 1], mod: [5, 2.8, 14, 16] },
  { name: "PEAK", bars: 8, e: 1, d: 0.9, l: { dr: 1, pd: 1, bs: 1, ml: 1, ar: 1, ct: 0.6 }, ft: 1, rv: 0.25, dw: 0.1, algo: "climax", adsr: [0.02, 0.15, 0.65, 0.6], mod: [6, 3.5, 18, 22] },
  { name: "OUTRO", bars: 6, e: 0.15, d: 0.2, l: { dr: 1, pd: 0.4, bs: 0, ml: 0.3, ar: 0, ct: 0 }, ft: 0.15, rv: 0.6, dw: 0.22, algo: "fragment", adsr: [0.2, 0.5, 0.4, 3], mod: [1.5, 1.2, 3, 6] },
] as any[];
export const RHY: Record<string, number[][]> = {
  sparse: [[8, 1], [8, 0.7]],
  quarter: [[4, 1], [4, 0.7], [4, 0.9], [4, 0.6]],
  driving: [[2, 1], [2, 0.6], [2, 0.9], [2, 0.5], [2, 1], [2, 0.7], [2, 0.8], [2, 0.5]],
  syncopated: [[3, 1], [1, 0.5], [4, 0.8], [3, 0.9], [1, 0.4], [4, 0.7]],
  dense: [[2, 1], [1, 0.5], [1, 0.7], [2, 0.9], [2, 0.8], [1, 0.6], [1, 0.5], [2, 0.7]],
};
export const BASS_PAT: Record<string, number[][]> = {
  whole: [[16, 1]],
  octave: [[4, 1], [4, 0.8], [4, 1], [4, 0.7]],
  bounce: [[2, 1], [2, 0], [2, 0.8], [2, 0], [2, 1], [2, 0], [2, 0.7], [2, 0]],
};
export const ARP_MODES = ["up", "down", "updown", "random", "skip"];
