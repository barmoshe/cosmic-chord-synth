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

/* DJ "Cosmic Pulse" — 5-phase loop. DRIFT plays once on AUTO start,
   then PULSE → BLOOM → SURGE → DISSOLVE cycles forever.
   Per-phase `col` drives section-transition flash + panel accents.
   Colors sampled from Glacial Aurora 2026 palette (teal/cyan/periwinkle/mint/lavender/warm-gold spark). */
export const DJ_SECTIONS = [
  { name: "DRIFT",    bars: 8,  e: 0.15, drums: "nebula",   l: { pd: 1,   bs: 0, ml: 0.25, ar: 0 }, ft: 0.3,  rv: 0.65, dw: 0.28, adsr: [1.4, 0.8, 0.7, 2.8], algo: "motif",    col: [0.37, 0.92, 0.83] }, // mint aurora — nebula shimmer
  { name: "PULSE",    bars: 12, e: 0.45, drums: "pulse",    l: { pd: 0.9, bs: 0, ml: 0.6,  ar: 0 }, ft: 0.45, rv: 0.5,  dw: 0.2,  adsr: [0.2, 0.4, 0.55, 2],   algo: "motif",    col: [0.51, 0.55, 0.97] }, // periwinkle
  { name: "BLOOM",    bars: 16, e: 0.7,  drums: "bloom",    l: { pd: 0.7, bs: 1, ml: 1,    ar: 0 }, ft: 0.65, rv: 0.4,  dw: 0.15, adsr: [0.06, 0.3, 0.55, 1.2], algo: "develop", col: [0.13, 0.83, 0.93] }, // cyan
  { name: "SURGE",    bars: 12, e: 1,    drums: "surge",    l: { pd: 1,   bs: 1, ml: 1,    ar: 1 }, ft: 1,    rv: 0.3,  dw: 0.12, adsr: [0.02, 0.2, 0.65, 0.7], algo: "climax", sweep: 1, col: [0.99, 0.83, 0.30] }, // warm-spark gold
  { name: "DISSOLVE", bars: 8,  e: 0.3,  drums: "dissolve", l: { pd: 0.9, bs: 0, ml: 0.4,  ar: 0 }, ft: 0.35, rv: 0.6,  dw: 0.24, adsr: [0.25, 0.5, 0.5, 2.2], algo: "fragment", col: [0.08, 0.72, 0.65] }, // teal
] as any[];

/* Drum patterns — 16 sixteenth-note steps per bar; value = velocity 0..1 (0 = rest).
   Experimental electronic base: kick-driven foundation, claps on backbeat, off-beat hats. */
export const DRUM_PATTERNS: Record<string, { kick: number[]; clap: number[]; hat: number[]; snare: number[] }> = {
  // NEBULA — shimmering atmospheric pattern (DRIFT default). Sparse kicks, scattered ghost claps,
  // constellation of soft hats that twinkle across the bar, occasional ghost-snare fleck.
  nebula: {
    kick:  [0.55, 0, 0, 0,  0, 0, 0, 0.3,   0, 0, 0, 0,  0.5, 0, 0, 0.25],
    clap:  [0, 0, 0, 0.2,   0, 0, 0.35, 0,  0, 0, 0, 0,  0, 0, 0, 0.3],
    hat:   [0.25, 0.1, 0.3, 0.12,  0.22, 0.15, 0.28, 0.1,  0.3, 0.08, 0.22, 0.18,  0.26, 0.12, 0.32, 0.2],
    snare: [0, 0, 0, 0,  0, 0, 0, 0.18,  0, 0, 0, 0,  0, 0, 0.22, 0],
  },
  drift: {
    kick:  [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
    clap:  [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
    hat:   [0, 0, 0.15, 0,  0, 0, 0.12, 0,  0, 0, 0.15, 0,  0, 0, 0.12, 0],
    snare: [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
  },
  pulse: {
    kick:  [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0],      // 2-on-floor (1 & 3)
    clap:  [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
    hat:   [0, 0, 0.4, 0,  0, 0, 0.4, 0,  0, 0, 0.4, 0,  0, 0, 0.4, 0],
    snare: [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
  },
  bloom: {
    kick:  [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],      // 4-on-floor
    clap:  [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],      // backbeat
    hat:   [0, 0, 0.7, 0,  0, 0, 0.7, 0,  0, 0, 0.7, 0,  0, 0, 0.7, 0.4],
    snare: [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
  },
  surge: {
    kick:  [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0.5],    // 4-on-floor + pickup
    clap:  [0, 0, 0, 0,  1, 0, 0, 0.4,  0, 0, 0, 0,  1, 0, 0, 0],
    hat:   [0.7, 0, 1, 0,  0.7, 0, 1, 0.5,  0.7, 0, 1, 0,  0.7, 0, 1, 0.7],   // 16ths
    snare: [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0.5, 0],    // ghost
  },
  dissolve: {
    kick:  [0.8, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0.7],
    clap:  [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
    hat:   [0, 0, 0.3, 0,  0, 0, 0.3, 0.3,  0, 0, 0.3, 0,  0, 0.3, 0.4, 0.5],
    snare: [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0],
  },
};

export const ARP_MODES = ["up", "down", "updown", "random", "skip"];

/* Four drum-stars that orbit the galaxy core. Users can tap them to play drums;
   auto-DJ also targets them. Colors sampled from Glacial Aurora 2026 palette. */
export const DRUM_ORBIT_R = 200;
export const DRUM_STARS = [
  { name: "kick",  angle: 0,                 color: [0.99, 0.83, 0.30], label: "K" }, // gold (N)
  { name: "hat",   angle: Math.PI * 0.5,     color: [0.13, 0.83, 0.93], label: "H" }, // cyan (E)
  { name: "clap",  angle: Math.PI,           color: [0.51, 0.55, 0.97], label: "C" }, // periwinkle (S)
  { name: "snare", angle: Math.PI * 1.5,     color: [0.37, 0.92, 0.83], label: "S" }, // mint (W)
] as const;
export type DrumName = typeof DRUM_STARS[number]["name"];
