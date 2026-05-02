import { describe, expect, it, vi } from "vitest";
import { applyTelemetry, clamp, linMap } from "./mapping";
import { DEFAULT_PROFILE } from "./profiles";
import type { SoundEngine } from "./audioEngine";
import type { Telemetry } from "../engine/types";

const baseTelemetry: Telemetry = {
  airspeedKt: 0,
  altitudeFt: 0,
  verticalSpeedFpm: 0,
  pitchDeg: 0,
  rollDeg: 0,
  headingDeg: 0,
  yawRateDps: 0,
  throttle: 0,
  rpm: 0,
  flaps: 0,
  gearDown: true,
  stallWarning: false,
  overspeed: false,
  onGround: true,
  fuel: 1,
};

const makeStubEngine = (): SoundEngine => ({
  start: vi.fn(async () => true),
  dispose: vi.fn(),
  isReady: vi.fn(() => true),
  setMasterGainDb: vi.fn(),
  setMasterPan: vi.fn(),
  setLeadFilterCutoff: vi.fn(),
  setReverbWet: vi.fn(),
  setDelayWet: vi.fn(),
  setVibratoRate: vi.fn(),
  setSubAmplitudeDb: vi.fn(),
  setDistortionWet: vi.fn(),
  setBitcrusherWet: vi.fn(),
  setBpm: vi.fn(),
  setLeadOctaveOffset: vi.fn(),
  setLeadScale: vi.fn(),
  setDrumGainDb: vi.fn(),
  setDroneFilterCutoff: vi.fn(),
});

describe("clamp", () => {
  it("clamps below", () => expect(clamp(-1, 0, 10)).toBe(0));
  it("clamps above", () => expect(clamp(11, 0, 10)).toBe(10));
  it("passthrough", () => expect(clamp(5, 0, 10)).toBe(5));
});

describe("linMap", () => {
  it("min input maps to outMin", () => {
    expect(linMap(0, 0, 1, -60, -6)).toBe(-60);
  });
  it("max input maps to outMax", () => {
    expect(linMap(1, 0, 1, -60, -6)).toBe(-6);
  });
  it("midpoint maps to midpoint", () => {
    expect(linMap(0.5, 0, 1, 0, 100)).toBe(50);
  });
  it("clamps below input range", () => {
    expect(linMap(-5, 0, 1, 0, 100)).toBe(0);
  });
  it("clamps above input range", () => {
    expect(linMap(5, 0, 1, 0, 100)).toBe(100);
  });
  it("zero-width input range yields outMin (no NaN)", () => {
    expect(linMap(0.5, 1, 1, 10, 20)).toBe(10);
  });
});

describe("applyTelemetry", () => {
  it("idle on ground: master near silence, drums muted, sub muted", () => {
    const eng = makeStubEngine();
    applyTelemetry(baseTelemetry, eng);
    expect(eng.setMasterGainDb).toHaveBeenCalledWith(-60, expect.any(Number));
    expect(eng.setDrumGainDb).toHaveBeenCalledWith(DEFAULT_PROFILE.drumMuteDb, expect.any(Number));
    expect(eng.setSubAmplitudeDb).toHaveBeenCalledWith(DEFAULT_PROFILE.subMuteDb, expect.any(Number));
  });

  it("full throttle, full power: master at -6 dB and drums opened", () => {
    const eng = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, throttle: 1, rpm: 1 }, eng);
    expect(eng.setMasterGainDb).toHaveBeenCalledWith(-6, expect.any(Number));
    expect(eng.setDrumGainDb).toHaveBeenCalledWith(-6, expect.any(Number));
    expect(eng.setSubAmplitudeDb).toHaveBeenCalledWith(-12, expect.any(Number));
  });

  it("airspeed maps to BPM curve", () => {
    const eng = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, airspeedKt: 30 }, eng);
    expect(eng.setBpm).toHaveBeenCalledWith(60, expect.any(Number));

    const eng2 = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, airspeedKt: 200 }, eng2);
    expect(eng2.setBpm).toHaveBeenCalledWith(160, expect.any(Number));
  });

  it("altitude steps the lead octave", () => {
    const eng = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, altitudeFt: 0 }, eng);
    expect(eng.setLeadOctaveOffset).toHaveBeenCalledWith(0);

    const eng2 = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, altitudeFt: 5500 }, eng2);
    expect(eng2.setLeadOctaveOffset).toHaveBeenCalledWith(1);

    const eng3 = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, altitudeFt: 12000 }, eng3);
    expect(eng3.setLeadOctaveOffset).toHaveBeenCalledWith(2);
  });

  it("pitch up opens the lead filter", () => {
    const eng = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, pitchDeg: -20 }, eng);
    expect(eng.setLeadFilterCutoff).toHaveBeenCalledWith(200, expect.any(Number));

    const eng2 = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, pitchDeg: 20 }, eng2);
    expect(eng2.setLeadFilterCutoff).toHaveBeenCalledWith(8000, expect.any(Number));
  });

  it("roll bias is reflected as master pan", () => {
    const eng = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, rollDeg: -45 }, eng);
    expect(eng.setMasterPan).toHaveBeenCalledWith(-1, expect.any(Number));

    const eng2 = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, rollDeg: 45 }, eng2);
    expect(eng2.setMasterPan).toHaveBeenCalledWith(1, expect.any(Number));
  });

  it("yaw rate (abs) drives vibrato rate", () => {
    const eng = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, yawRateDps: -30 }, eng);
    expect(eng.setVibratoRate).toHaveBeenCalledWith(8, expect.any(Number));
  });

  it("vertical speed drives drone filter cutoff", () => {
    const eng = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, verticalSpeedFpm: -3000 }, eng);
    expect(eng.setDroneFilterCutoff).toHaveBeenCalledWith(200, expect.any(Number));

    const eng2 = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, verticalSpeedFpm: 3000 }, eng2);
    expect(eng2.setDroneFilterCutoff).toHaveBeenCalledWith(2000, expect.any(Number));
  });

  it("heading rotates through 8 scales (octants)", () => {
    const eng = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, headingDeg: 0 }, eng);
    expect(eng.setLeadScale).toHaveBeenCalledWith("minorPentatonic");

    const eng2 = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, headingDeg: 180 }, eng2);
    expect(eng2.setLeadScale).toHaveBeenCalledWith("ionian");
  });

  it("flaps open the reverb send", () => {
    const eng = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, flaps: 4 }, eng);
    expect(eng.setReverbWet).toHaveBeenCalledWith(0.55, expect.any(Number));
  });

  it("gear up = dry delay; gear down = ducked echo", () => {
    const eng = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, gearDown: false }, eng);
    expect(eng.setDelayWet).toHaveBeenCalledWith(0, expect.any(Number));

    const eng2 = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, gearDown: true }, eng2);
    expect(eng2.setDelayWet).toHaveBeenCalledWith(0.14, expect.any(Number));
  });

  it("stall flag opens the distortion wet", () => {
    const eng = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, stallWarning: true }, eng);
    expect(eng.setDistortionWet).toHaveBeenCalledWith(0.7, expect.any(Number));
  });

  it("overspeed flag engages the bit-crusher", () => {
    const eng = makeStubEngine();
    applyTelemetry({ ...baseTelemetry, overspeed: true }, eng);
    expect(eng.setBitcrusherWet).toHaveBeenCalledWith(0.6, expect.any(Number));
  });
});
