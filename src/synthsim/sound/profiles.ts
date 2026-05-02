export interface LinearCurve {
  inMin: number;
  inMax: number;
  outMin: number;
  outMax: number;
  rampMs: number;
}

export interface BoolCurve {
  whenFalse: number;
  whenTrue: number;
  rampMs: number;
}

export interface MappingProfile {
  masterGain: LinearCurve;
  drumGain: LinearCurve;
  drumGateThrottle: number;
  drumMuteDb: number;
  bpm: LinearCurve;
  altitudeFtPerOctave: number;
  leadFilter: LinearCurve;
  masterPan: LinearCurve;
  vibratoRate: LinearCurve;
  droneFilter: LinearCurve;
  subAmplitude: LinearCurve;
  subGateRpm: number;
  subMuteDb: number;
  reverbWet: LinearCurve;
  delayWet: BoolCurve;
  distortionWet: BoolCurve;
  bitcrusherWet: BoolCurve;
}

export const DEFAULT_PROFILE: MappingProfile = {
  masterGain: { inMin: 0, inMax: 1, outMin: -60, outMax: -6, rampMs: 50 },

  drumGain: { inMin: 0.1, inMax: 1, outMin: -30, outMax: -6, rampMs: 80 },
  drumGateThrottle: 0.1,
  drumMuteDb: -60,

  bpm: { inMin: 30, inMax: 200, outMin: 60, outMax: 160, rampMs: 200 },

  altitudeFtPerOctave: 5000,

  leadFilter: { inMin: -20, inMax: 20, outMin: 200, outMax: 8000, rampMs: 80 },

  masterPan: { inMin: -45, inMax: 45, outMin: -1, outMax: 1, rampMs: 80 },

  vibratoRate: { inMin: 0, inMax: 30, outMin: 0, outMax: 8, rampMs: 100 },

  droneFilter: { inMin: -3000, inMax: 3000, outMin: 200, outMax: 2000, rampMs: 200 },

  subAmplitude: { inMin: 0.05, inMax: 1, outMin: -36, outMax: -12, rampMs: 80 },
  subGateRpm: 0.05,
  subMuteDb: -60,

  reverbWet: { inMin: 0, inMax: 4, outMin: 0.2, outMax: 0.55, rampMs: 200 },

  delayWet: { whenFalse: 0, whenTrue: 0.14, rampMs: 200 },

  distortionWet: { whenFalse: 0, whenTrue: 0.7, rampMs: 80 },

  bitcrusherWet: { whenFalse: 0, whenTrue: 0.6, rampMs: 80 },
};
