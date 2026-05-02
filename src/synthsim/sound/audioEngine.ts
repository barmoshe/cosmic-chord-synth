import * as Tone from "tone";
import { DRUM_PATTERNS, type DrumPattern, PATTERN_STEPS } from "../flightplan/drumPatterns";
import {
  SCALES,
  type ScaleName,
  scaleStepToMidi,
} from "./scales";

const ROOT_MIDI = 60;
const DEFAULT_RAMP_S = 0.05;

interface AudioNodes {
  lead: Tone.PolySynth;
  leadFilter: Tone.Filter;
  distortion: Tone.Distortion;
  vibrato: Tone.Vibrato;
  chorus: Tone.Chorus;
  delay: Tone.FeedbackDelay;
  reverb: Tone.Freeverb;
  drone: Tone.Synth;
  droneFilter: Tone.Filter;
  sub: Tone.Synth;
  subVolume: Tone.Volume;
  kick: Tone.MembraneSynth;
  hat: Tone.MetalSynth;
  drumVolume: Tone.Volume;
  masterPanner: Tone.Panner;
  bitcrusher: Tone.BitCrusher;
  masterComp: Tone.Compressor;
  limiter: Tone.Limiter;
  masterVolume: Tone.Volume;
}

interface PlaybackState {
  scale: ScaleName;
  octaveOffset: number;
  arpStep: number;
  pattern: DrumPattern;
  drumStep: number;
}

export interface SoundEngine {
  start(): Promise<boolean>;
  dispose(): void;
  isReady(): boolean;
  setMasterGainDb(db: number, rampS?: number): void;
  setMasterPan(p: number, rampS?: number): void;
  setLeadFilterCutoff(hz: number, rampS?: number): void;
  setDroneFilterCutoff(hz: number, rampS?: number): void;
  setReverbWet(w: number, rampS?: number): void;
  setDelayWet(w: number, rampS?: number): void;
  setVibratoRate(hz: number, rampS?: number): void;
  setSubAmplitudeDb(db: number, rampS?: number): void;
  setDistortionWet(w: number, rampS?: number): void;
  setBitcrusherWet(w: number, rampS?: number): void;
  setBpm(bpm: number, rampS?: number): void;
  setDrumGainDb(db: number, rampS?: number): void;
  setLeadOctaveOffset(n: number): void;
  setLeadScale(name: ScaleName): void;
  setDrumPattern(pattern: DrumPattern): void;
}

const rampParam = (
  param: { value: number; rampTo?: (v: number, t: number) => void } | undefined,
  value: number,
  rampS: number,
) => {
  if (!param) return;
  if (typeof param.rampTo === "function") {
    param.rampTo(value, Math.max(rampS, 0.001));
  } else {
    param.value = value;
  }
};

export function createSoundEngine(): SoundEngine {
  let ready = false;
  let nodes: AudioNodes | null = null;
  const eventIds: number[] = [];
  const state: PlaybackState = {
    scale: "minorPentatonic",
    octaveOffset: 0,
    arpStep: 0,
    pattern: DRUM_PATTERNS.silence,
    drumStep: 0,
  };

  const buildGraph = (): AudioNodes => {
    const lead = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 3,
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.02, decay: 0.12, sustain: 0.35, release: 0.3 },
    });
    lead.volume.value = -10;

    const leadFilter = new Tone.Filter({ frequency: 1200, type: "lowpass", Q: 0.7 });
    const distortion = new Tone.Distortion({ distortion: 0.4, wet: 0 });
    const vibrato = new Tone.Vibrato({ frequency: 0, depth: 0.08 });
    const chorus = new Tone.Chorus({ frequency: 0.6, delayTime: 3.5, depth: 0.4, wet: 0.12 }).start();
    const delay = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.28, wet: 0 });
    const reverb = new Tone.Freeverb({ roomSize: 0.78, dampening: 3500, wet: 0.3 });

    const drone = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 1.5, decay: 0.5, sustain: 0.7, release: 2.0 },
    });
    drone.volume.value = -22;
    const droneFilter = new Tone.Filter({ frequency: 600, type: "lowpass", Q: 0.5 });

    const sub = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.5, decay: 0.5, sustain: 0.85, release: 1.2 },
    });
    const subVolume = new Tone.Volume(-60);

    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.5 },
    });
    const hat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.02 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    });
    hat.volume.value = -22;
    const drumVolume = new Tone.Volume(-60);

    const masterPanner = new Tone.Panner(0);
    const bitcrusher = new Tone.BitCrusher({ bits: 4, wet: 0 });
    const masterComp = new Tone.Compressor({ threshold: -18, ratio: 3, attack: 0.003, release: 0.1 });
    const limiter = new Tone.Limiter(-1);
    const masterVolume = new Tone.Volume(-60);

    lead.chain(leadFilter, distortion, vibrato, chorus, delay, reverb);
    drone.chain(droneFilter, reverb);
    reverb.connect(masterPanner);
    sub.chain(subVolume, masterPanner);
    kick.connect(drumVolume);
    hat.connect(drumVolume);
    drumVolume.connect(masterPanner);
    masterPanner.chain(bitcrusher, masterComp, limiter, masterVolume, Tone.getDestination());

    return {
      lead, leadFilter, distortion, vibrato, chorus, delay, reverb,
      drone, droneFilter, sub, subVolume,
      kick, hat, drumVolume,
      masterPanner, bitcrusher, masterComp, limiter, masterVolume,
    };
  };

  const start = async (): Promise<boolean> => {
    if (ready) return true;
    try {
      await Tone.start();
      const built = buildGraph();
      nodes = built;

      const droneNote = Tone.Frequency(ROOT_MIDI - 12, "midi").toFrequency();
      const subNote = Tone.Frequency(ROOT_MIDI - 24, "midi").toFrequency();
      built.drone.triggerAttack(droneNote);
      built.sub.triggerAttack(subNote);

      eventIds.push(
        Tone.Transport.scheduleRepeat((time) => {
          if (!nodes) return;
          const k = state.pattern.kick[state.drumStep];
          const h = state.pattern.hat[state.drumStep];
          if (k > 0) nodes.kick.triggerAttackRelease("C2", "16n", time, k);
          if (h > 0) nodes.hat.triggerAttackRelease("32n", time, h);
          state.drumStep = (state.drumStep + 1) % PATTERN_STEPS;
        }, "16n"),
      );
      eventIds.push(
        Tone.Transport.scheduleRepeat((time) => {
          if (!nodes) return;
          const scale = SCALES[state.scale];
          const midi = scaleStepToMidi(scale, state.arpStep, ROOT_MIDI, state.octaveOffset);
          const hz = Tone.Frequency(midi, "midi").toFrequency();
          nodes.lead.triggerAttackRelease(hz, "16n", time);
          state.arpStep = (state.arpStep + 1) % scale.steps.length;
        }, "8n"),
      );

      Tone.Transport.bpm.value = 90;
      Tone.Transport.start();
      ready = true;
      return true;
    } catch (err) {
      console.error("synthsim sound: start failed", err);
      return false;
    }
  };

  const dispose = (): void => {
    if (!nodes) {
      ready = false;
      return;
    }
    try {
      Tone.Transport.stop();
    } catch {
      /* transport may already be stopped */
    }
    eventIds.forEach((id) => {
      try { Tone.Transport.clear(id); } catch { /* event may already be cleared */ }
    });
    eventIds.length = 0;

    try { nodes.lead.releaseAll(); } catch { /* ok */ }
    try { nodes.drone.triggerRelease(); } catch { /* ok */ }
    try { nodes.sub.triggerRelease(); } catch { /* ok */ }

    const bag: Array<{ dispose?: () => void }> = Object.values(nodes);
    for (const node of bag) {
      try { node.dispose?.(); } catch { /* swallow per-node errors */ }
    }
    nodes = null;
    ready = false;
  };

  return {
    start,
    dispose,
    isReady: () => ready,

    setMasterGainDb: (db, r = DEFAULT_RAMP_S) => {
      if (nodes) rampParam(nodes.masterVolume.volume, db, r);
    },
    setMasterPan: (p, r = DEFAULT_RAMP_S) => {
      if (nodes) rampParam(nodes.masterPanner.pan, p, r);
    },
    setLeadFilterCutoff: (hz, r = DEFAULT_RAMP_S) => {
      if (nodes) rampParam(nodes.leadFilter.frequency, hz, r);
    },
    setDroneFilterCutoff: (hz, r = DEFAULT_RAMP_S) => {
      if (nodes) rampParam(nodes.droneFilter.frequency, hz, r);
    },
    setReverbWet: (w, r = DEFAULT_RAMP_S) => {
      if (nodes) rampParam(nodes.reverb.wet, w, r);
    },
    setDelayWet: (w, r = DEFAULT_RAMP_S) => {
      if (nodes) rampParam(nodes.delay.wet, w, r);
    },
    setVibratoRate: (hz, r = DEFAULT_RAMP_S) => {
      if (nodes) rampParam(nodes.vibrato.frequency, hz, r);
    },
    setSubAmplitudeDb: (db, r = DEFAULT_RAMP_S) => {
      if (nodes) rampParam(nodes.subVolume.volume, db, r);
    },
    setDistortionWet: (w, r = DEFAULT_RAMP_S) => {
      if (nodes) rampParam(nodes.distortion.wet, w, r);
    },
    setBitcrusherWet: (w, r = DEFAULT_RAMP_S) => {
      if (nodes) rampParam(nodes.bitcrusher.wet, w, r);
    },
    setBpm: (bpm, r = DEFAULT_RAMP_S) => {
      try {
        Tone.Transport.bpm.rampTo(bpm, Math.max(r, 0.001));
      } catch {
        Tone.Transport.bpm.value = bpm;
      }
    },
    setDrumGainDb: (db, r = DEFAULT_RAMP_S) => {
      if (nodes) rampParam(nodes.drumVolume.volume, db, r);
    },
    setLeadOctaveOffset: (n) => {
      state.octaveOffset = n;
    },
    setLeadScale: (name) => {
      if (state.scale !== name) {
        state.scale = name;
        state.arpStep = 0;
      }
    },
    setDrumPattern: (pattern) => {
      if (state.pattern.key !== pattern.key) {
        state.pattern = pattern;
        state.drumStep = 0;
      }
    },
  };
}
