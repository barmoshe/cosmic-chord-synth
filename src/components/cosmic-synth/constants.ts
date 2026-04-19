export const SCALES: Record<string, { notes: number[]; label: string; mood: number; chords: number[][] }> = {
  pentatonic: { notes: [0, 3, 5, 7, 10], label: "PENTA", mood: 0.5, chords: [[0, 3, 7], [3, 7, 10], [5, 7, 10], [7, 10, 12], [10, 12, 15]] },
  minor: { notes: [0, 2, 3, 5, 7, 8, 10], label: "MINOR", mood: 0.2, chords: [[0, 3, 7], [2, 5, 8], [3, 7, 10], [5, 8, 12], [7, 10, 14], [8, 12, 15], [10, 14, 17]] },
  major: { notes: [0, 2, 4, 5, 7, 9, 11], label: "MAJOR", mood: 0.85, chords: [[0, 4, 7], [2, 5, 9], [4, 7, 11], [5, 9, 12], [7, 11, 14], [9, 12, 16], [11, 14, 17]] },
  arabic: { notes: [0, 1, 4, 5, 7, 8, 11], label: "ARABIC", mood: 0.25, chords: [[0, 4, 7], [1, 5, 8], [4, 7, 11], [5, 8, 12], [7, 11, 13], [8, 12, 16]] },
  // Lydian — bright & floaty; #4 gives the "dreamy underwater" lift. Used by SEA theme.
  lydian: { notes: [0, 2, 4, 6, 7, 9, 11], label: "LYDIAN", mood: 0.7, chords: [[0, 4, 7, 11], [2, 6, 9], [4, 7, 11], [6, 9, 12], [7, 11, 14], [9, 12, 16], [11, 14, 18]] },
};
export const SCALE_ORDER = ["pentatonic", "minor", "major", "arabic", "lydian"];
export const PROGS: Record<string, number[][]> = {
  pentatonic: [[0, 3, 0, 4], [0, 1, 2, 0]],
  minor: [[0, 3, 4, 0], [0, 5, 3, 4], [0, 2, 5, 4]],
  major: [[0, 4, 5, 3], [0, 3, 4, 0]],
  arabic: [[0, 3, 4, 0], [0, 2, 4, 0]],
  lydian: [[0, 3, 4, 0], [0, 4, 5, 3], [0, 2, 5, 4]],
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
   auto-DJ also targets them. Warm sunset palette — gold → amber → coral → rose. */
export const DRUM_ORBIT_R = 200;
export const DRUM_STARS = [
  { name: "kick",  angle: 0,                 color: [1.00, 0.78, 0.25], label: "K" }, // warm gold (N)
  { name: "hat",   angle: Math.PI * 0.5,     color: [1.00, 0.62, 0.32], label: "H" }, // amber (E)
  { name: "clap",  angle: Math.PI,           color: [0.98, 0.45, 0.40], label: "C" }, // coral (S)
  { name: "snare", angle: Math.PI * 1.5,     color: [0.95, 0.35, 0.55], label: "S" }, // rose (W)
] as const;
export type DrumName = typeof DRUM_STARS[number]["name"];

/* ── Per-theme sound design ──
   Each theme is a complete sonic identity: synth voicing, drum tuning, BPM,
   default scale, reverb/delay character, and DJ section pacing.
   The audio engine reads this on theme change to retune the graph in place
   (no rebuild — synths/filters/effects update via .set()/rampTo). */
export type ThemeId = "space" | "jungle" | "sea" | "cyberpunk";

export interface SynthVoice {
  type: "sine" | "sawtooth" | "square" | "triangle" | "fatsawtooth" | "fmsine" | "amsine" | "pulse";
  spread?: number;
  count?: number;
}

export interface ThemePreset {
  scale: string;             // default scale auto-selected on theme switch
  bpm: number;               // transport BPM
  // Synth oscillator presets
  lead: SynthVoice;
  sub: SynthVoice;
  pad: SynthVoice;
  bass: SynthVoice;
  arp: SynthVoice;
  drone: SynthVoice;
  // Pad envelope (slow attack for atmospheric, faster for plucky)
  padEnv: { attack: number; decay: number; sustain: number; release: number };
  // Lead default envelope (overridden per DJ section)
  leadEnv: { attack: number; decay: number; sustain: number; release: number };
  // Filter cutoffs
  leadCutoff: number;
  padCutoff: number;
  // FX character
  reverbRoom: number;        // 0..1
  reverbDamp: number;        // Hz
  reverbWet: number;
  delayWet: number;
  delayTime: string;
  chorusWet: number;
  // Drum tuning
  kickPitch: string;         // e.g. "C1", "A0"
  kickDecay: number;
  snareFilterHz: number;     // bandpass center
  snareDecay: number;
  hatHarm: number;           // MetalSynth harmonicity
  hatRes: number;            // resonance
  clapFilterHz: number;
  // DJ section pacing — multiplier on bars and energy curve shape
  djBarMult: number;         // 1 = default; <1 = faster cycles, >1 = slower
  djEnergyBias: number;      // -0.3..+0.3 added to per-section energy
  // Section transition flash palette (inherited from DJ_SECTIONS if undefined)
  drumKit: "default" | "tribal" | "aquatic";
  // Real-world ambient bed layered beneath the synth. CC0 samples committed to
  // public/audio/ — see public/audio/CREDITS.txt.
  ambientUrl: string;        // "/audio/space-ambient.opus"
  ambientVolumeDb: number;   // target gain under the synth (negative dB)
  ambientFadeSec: number;    // cross-fade length on theme switch
}

export const THEME_PRESETS: Record<ThemeId, ThemePreset> = {
  space: {
    scale: "pentatonic",
    bpm: 94,
    lead: isMobile ? { type: "sawtooth" } : { type: "fatsawtooth", spread: 20, count: 2 },
    sub: { type: "sine" },
    pad: { type: "sine" },
    bass: { type: "square" },
    arp: { type: "triangle" },
    drone: { type: "sine" },
    padEnv: { attack: 0.5, decay: 0.6, sustain: 0.6, release: 1.0 },
    leadEnv: { attack: 0.05, decay: 0.25, sustain: 0.4, release: 0.35 },
    leadCutoff: 4500,
    padCutoff: 1200,
    reverbRoom: isMobile ? 0.7 : 0.82,
    reverbDamp: 3500,
    reverbWet: isMobile ? 0.22 : 0.3,
    delayWet: 0.14,
    delayTime: "8n.",
    chorusWet: isMobile ? 0 : 0.14,
    kickPitch: "C1",
    kickDecay: 0.25,
    snareFilterHz: 3000,
    snareDecay: 0.13,
    hatHarm: 5.1,
    hatRes: 4000,
    clapFilterHz: 1500,
    djBarMult: 1,
    djEnergyBias: 0,
    drumKit: "default",
    ambientUrl: "/audio/space-ambient.opus",
    ambientVolumeDb: -22,
    ambientFadeSec: 2.0,
  },
  jungle: {
    scale: "pentatonic",
    bpm: 108,                 // brisker, more rhythmic
    lead: { type: "triangle" },          // marimba-ish soft attack
    sub: { type: "sine" },
    pad: { type: "fmsine" },             // organic, woody pad
    bass: { type: "sine" },              // round upright-bass-like
    arp: { type: "triangle" },           // kalimba-like pluck
    drone: { type: "sine" },
    padEnv: { attack: 0.3, decay: 0.4, sustain: 0.45, release: 0.8 },
    leadEnv: { attack: 0.005, decay: 0.35, sustain: 0.15, release: 0.5 }, // pluck/marimba
    leadCutoff: 3200,
    padCutoff: 900,
    reverbRoom: 0.6,
    reverbDamp: 2200,
    reverbWet: 0.18,
    delayWet: 0.08,
    delayTime: "16n",
    chorusWet: 0.05,
    kickPitch: "A0",          // deeper, tom-like
    kickDecay: 0.4,
    snareFilterHz: 1800,      // wood/rim feel
    snareDecay: 0.08,
    hatHarm: 3.2,             // softer hat → shaker-like
    hatRes: 2200,
    clapFilterHz: 2200,       // wood-block clap
    djBarMult: 0.75,          // shorter sections, more movement
    djEnergyBias: 0.1,        // slightly punchier overall
    drumKit: "tribal",
    ambientUrl: "/audio/jungle-ambient.ogg",
    ambientVolumeDb: -20,
    ambientFadeSec: 2.0,
  },
  sea: {
    scale: "lydian",
    bpm: 76,                  // slow, breathing tempo
    lead: { type: "sine" },              // pure bell-like
    sub: { type: "sine" },
    pad: { type: "amsine" },             // shimmering pad
    bass: { type: "sine" },              // deep sub-bass
    arp: { type: "sine" },               // glassy bell arp
    drone: { type: "sine" },
    padEnv: { attack: 1.2, decay: 1.5, sustain: 0.7, release: 2.5 },
    leadEnv: { attack: 0.02, decay: 1.2, sustain: 0.15, release: 1.8 }, // bell-like
    leadCutoff: 5500,
    padCutoff: 1500,
    reverbRoom: 0.92,         // cathedral-cave wash
    reverbDamp: 2800,
    reverbWet: 0.5,
    delayWet: 0.28,
    delayTime: "4n.",         // slow dotted-quarter pings
    chorusWet: 0.25,
    kickPitch: "G0",          // soft, muffled — like distant whale
    kickDecay: 0.6,
    snareFilterHz: 800,       // dull splash
    snareDecay: 0.2,
    hatHarm: 8,               // shimmer-bell hat
    hatRes: 6000,
    clapFilterHz: 900,        // soft droplet
    djBarMult: 1.5,           // long, breathing sections
    djEnergyBias: -0.15,      // gentler overall
    drumKit: "aquatic",
    ambientUrl: "/audio/sea-ambient.opus",
    ambientVolumeDb: -18,
    ambientFadeSec: 2.0,
  },
  cyberpunk: {
    scale: "arabic",          // dystopian, exotic tension
    bpm: 128,                 // driving synthwave pulse
    lead: isMobile ? { type: "sawtooth" } : { type: "fatsawtooth", spread: 30, count: 3 }, // supersaw lead
    sub: { type: "square" },             // punchy sub
    pad: { type: "fmsine" },             // metallic pad
    bass: { type: "square" },            // reese-adjacent bass
    arp: { type: "pulse" },              // sharp pulse arp
    drone: { type: "sawtooth" },
    padEnv: { attack: 0.05, decay: 0.25, sustain: 0.7, release: 0.8 },
    leadEnv: { attack: 0.003, decay: 0.15, sustain: 0.5, release: 0.4 }, // punchy attack
    leadCutoff: 5200,
    padCutoff: 2800,
    reverbRoom: 0.55,         // drier, industrial space
    reverbDamp: 3200,
    reverbWet: 0.2,
    delayWet: 0.24,
    delayTime: "8n",          // rhythmic slapback
    chorusWet: 0,             // no chorus — keep harsh
    kickPitch: "C1",
    kickDecay: 0.22,          // tight industrial kick
    snareFilterHz: 2400,      // snappy electronic snare
    snareDecay: 0.1,
    hatHarm: 6.4,             // bright metallic hat
    hatRes: 5200,
    clapFilterHz: 1800,
    djBarMult: 0.9,           // snappier sections
    djEnergyBias: 0.15,       // higher overall energy
    drumKit: "default",
    ambientUrl: "",           // no ambient bed in this pass
    ambientVolumeDb: -24,
    ambientFadeSec: 2.0,
  },
};
