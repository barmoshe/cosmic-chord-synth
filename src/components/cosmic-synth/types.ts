import type * as Tone from "tone";
import type { DrumName, ThemeId } from "./constants";

export type { DrumName, ThemeId };

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

export interface LeadEnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface AudioEngine {
  start(): Promise<boolean>;
  dispose(): void;
  isReady(): boolean;

  noteOn(midi: number, velocity: number, x: number, y: number): void;
  noteOff(midi: number): void;
  releaseAllLead(time?: number): void;

  triggerDrum(name: DrumName, velocity: number, time?: number): void;
  triggerLead(midi: number, time: number, velocity: number, duration?: Tone.Unit.Time): void;
  triggerPadChord(midis: number[], time: number, velocity: number, duration?: Tone.Unit.Time): void;
  triggerBass(midi: number, time: number, velocity: number, duration?: Tone.Unit.Time): void;
  triggerArp(midi: number, time: number, velocity: number, duration?: Tone.Unit.Time): void;
  startDrone(): void;
  stopDrone(time?: number): void;

  setFilterCutoff(hz: number, rampTime?: number): void;
  setPadVolume(db: number, rampTime?: number, time?: number): void;
  setPadFilter(hz: number, rampTime?: number): void;
  setReverbWet(w: number, rampTime?: number): void;
  setDelayWet(w: number, rampTime?: number): void;
  setLeadEnvelope(env: LeadEnvelope): void;
  setTheme(theme: ThemeId): void;
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
