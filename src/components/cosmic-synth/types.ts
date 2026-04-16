import type * as Tone from "tone";

export interface AnalysisData {
  bass: number;
  mid: number;
  treble: number;
  high: number;
  vol: number;
  pitch: number;
}

export interface GyroState {
  alpha: number;
  beta: number;
  gamma: number;
  ax: number;
  ay: number;
  az: number;
}

export interface TouchInfo {
  midi: number;
  freq: number;
  subFreq: number;
  x: number;
  y: number;
  note: string;
}

export interface EngineInterface {
  camera: any;
  addRipple: (x: number, y: number, z: number, col: [number, number, number]) => void;
  emitParticles: (x: number, y: number, z: number, col: [number, number, number], count: number, vel: number) => void;
  s2w: (sx: number, sy: number) => [number, number, number];
}

export interface AudioEngine {
  ld: Tone.PolySynth;
  sb: Tone.PolySynth;
  pd: Tone.PolySynth;
  bs: Tone.PolySynth;
  ar: Tone.PolySynth;
  dn: Tone.PolySynth;
  kick: Tone.MembraneSynth;
  snare: Tone.NoiseSynth;
  hihat: Tone.MetalSynth;
  clap: Tone.NoiseSynth;
  fi: Tone.Filter;
  pf: Tone.Filter;
  bf: Tone.Filter;
  af: Tone.Filter;
  df: Tone.Filter;
  rv: Tone.Reverb;
  dl: Tone.FeedbackDelay;
  ch: Tone.Chorus;
  pr: Tone.Reverb;
  br2: Tone.Reverb;
  dr2: Tone.Reverb;
  drumRv: Tone.Reverb;
  fft: Tone.FFT;
  lfo: Tone.LFO;
}

export interface DjState {
  on: boolean;
  iv: ReturnType<typeof setInterval> | null;
  si: number;
  tis: number;
  tt: number;
  motif: number[];
  phrase: number[];
  pp: number;
  ci: number;
  ct: number;
  bi: number;
  am: string;
  as: number;
  ac: number[];
  ri: number;
  deg: number;
  oct: number;
  ce: number;
  cf: number;
  te: number;
  tf: number;
  rf: number;
}
