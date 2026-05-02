import { describe, expect, it } from "vitest";
import { DEFAULT_PROFILE, type LinearCurve } from "./profiles";

const linearKeys: Array<keyof typeof DEFAULT_PROFILE> = [
  "masterGain",
  "drumGain",
  "bpm",
  "leadFilter",
  "masterPan",
  "vibratoRate",
  "droneFilter",
  "subAmplitude",
  "reverbWet",
];

const isLinear = (v: unknown): v is LinearCurve =>
  typeof v === "object" &&
  v !== null &&
  "inMin" in v && "inMax" in v && "outMin" in v && "outMax" in v && "rampMs" in v;

describe("DEFAULT_PROFILE", () => {
  it("defines all expected linear curves", () => {
    for (const key of linearKeys) {
      const v = DEFAULT_PROFILE[key];
      expect(isLinear(v), `${key} should be a LinearCurve`).toBe(true);
    }
  });

  it("linear curves have inMin <= inMax", () => {
    for (const key of linearKeys) {
      const c = DEFAULT_PROFILE[key] as LinearCurve;
      expect(c.inMin, `${key}.inMin <= inMax`).toBeLessThanOrEqual(c.inMax);
    }
  });

  it("ramp times are within 0–500ms", () => {
    for (const key of linearKeys) {
      const c = DEFAULT_PROFILE[key] as LinearCurve;
      expect(c.rampMs, `${key} ramp range`).toBeGreaterThanOrEqual(0);
      expect(c.rampMs, `${key} ramp range`).toBeLessThanOrEqual(500);
    }
  });

  it("master gain output stays at sane dB values", () => {
    const g = DEFAULT_PROFILE.masterGain;
    expect(g.outMin).toBeGreaterThanOrEqual(-80);
    expect(g.outMax).toBeLessThanOrEqual(0);
  });

  it("BPM range stays inside 30–240", () => {
    const b = DEFAULT_PROFILE.bpm;
    expect(b.outMin).toBeGreaterThanOrEqual(30);
    expect(b.outMax).toBeLessThanOrEqual(240);
  });

  it("master pan output is within -1..+1", () => {
    const p = DEFAULT_PROFILE.masterPan;
    expect(p.outMin).toBeGreaterThanOrEqual(-1);
    expect(p.outMax).toBeLessThanOrEqual(1);
  });

  it("bool curves' whenTrue and whenFalse are bounded between 0..1", () => {
    for (const key of ["delayWet", "distortionWet", "bitcrusherWet"] as const) {
      const c = DEFAULT_PROFILE[key];
      expect(c.whenTrue).toBeGreaterThanOrEqual(0);
      expect(c.whenTrue).toBeLessThanOrEqual(1);
      expect(c.whenFalse).toBeGreaterThanOrEqual(0);
      expect(c.whenFalse).toBeLessThanOrEqual(1);
    }
  });

  it("altitude octave step is positive", () => {
    expect(DEFAULT_PROFILE.altitudeFtPerOctave).toBeGreaterThan(0);
  });
});
