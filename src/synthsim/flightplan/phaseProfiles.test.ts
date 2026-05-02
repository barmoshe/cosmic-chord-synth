import { describe, expect, it, vi } from "vitest";
import { PHASE_PATCHES, applyPhasePatch } from "./phaseProfiles";
import type { SoundEngine } from "../sound/audioEngine";
import type { PhaseName } from "./phases";

const phases: PhaseName[] = [
  "PREFLIGHT", "TAXI", "TAKEOFF", "CLIMB", "CRUISE",
  "DESCENT", "APPROACH", "LANDING", "SHUTDOWN",
];

const makeEngine = (): SoundEngine => ({
  start: vi.fn(async () => true),
  dispose: vi.fn(),
  isReady: vi.fn(() => true),
  setMasterGainDb: vi.fn(),
  setMasterPan: vi.fn(),
  setLeadFilterCutoff: vi.fn(),
  setDroneFilterCutoff: vi.fn(),
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
  setDrumPattern: vi.fn(),
});

const ctx = {
  currentMasterGainDb: -12,
  currentDrumGainDb: -8,
  currentReverbWet: 0.3,
  currentLeadFilterHz: 6000,
  delayWetFromGear: 0.14,
};

describe("PHASE_PATCHES", () => {
  it("has exactly one entry per PhaseName", () => {
    for (const p of phases) {
      expect(PHASE_PATCHES[p]).toBeDefined();
    }
    expect(Object.keys(PHASE_PATCHES)).toHaveLength(phases.length);
  });

  it("PREFLIGHT and SHUTDOWN cap master gain low for taxi/quiet", () => {
    expect(PHASE_PATCHES.PREFLIGHT.masterGainCeilingDb).toBeLessThanOrEqual(-30);
    expect(PHASE_PATCHES.SHUTDOWN.masterGainCeilingDb).toBeLessThanOrEqual(-30);
  });
});

describe("applyPhasePatch", () => {
  it("PREFLIGHT clamps master gain below the current level", () => {
    const eng = makeEngine();
    applyPhasePatch(eng, PHASE_PATCHES.PREFLIGHT, ctx);
    expect(eng.setMasterGainDb).toHaveBeenCalledWith(-36, expect.any(Number));
  });

  it("TAXI ducks drum gain to its ceiling", () => {
    const eng = makeEngine();
    applyPhasePatch(eng, PHASE_PATCHES.TAXI, ctx);
    expect(eng.setDrumGainDb).toHaveBeenCalledWith(-30, expect.any(Number));
  });

  it("CRUISE adds 0.25 to reverb wet (within bounds)", () => {
    const eng = makeEngine();
    applyPhasePatch(eng, PHASE_PATCHES.CRUISE, ctx);
    expect(eng.setReverbWet).toHaveBeenCalledWith(0.55, expect.any(Number));
  });

  it("APPROACH forces delay wet regardless of gear context", () => {
    const eng = makeEngine();
    applyPhasePatch(eng, PHASE_PATCHES.APPROACH, ctx);
    expect(eng.setDelayWet).toHaveBeenCalledWith(0.18, expect.any(Number));
  });

  it("phases without delayWetForce restore gear-driven delay", () => {
    const eng = makeEngine();
    applyPhasePatch(eng, PHASE_PATCHES.CRUISE, ctx);
    expect(eng.setDelayWet).toHaveBeenCalledWith(ctx.delayWetFromGear, expect.any(Number));
  });

  it("DESCENT caps lead filter brightness", () => {
    const eng = makeEngine();
    applyPhasePatch(eng, PHASE_PATCHES.DESCENT, ctx);
    expect(eng.setLeadFilterCutoff).toHaveBeenCalledWith(4000, expect.any(Number));
  });

  it("does not call setMasterGainDb when patch has no ceiling", () => {
    const eng = makeEngine();
    applyPhasePatch(eng, PHASE_PATCHES.CRUISE, ctx);
    expect(eng.setMasterGainDb).not.toHaveBeenCalled();
  });

  it("ceiling does not raise current value (only lowers)", () => {
    const eng = makeEngine();
    const high = { ...ctx, currentMasterGainDb: -50 };
    applyPhasePatch(eng, PHASE_PATCHES.PREFLIGHT, high);
    expect(eng.setMasterGainDb).toHaveBeenCalledWith(-50, expect.any(Number));
  });

  it("reverb wet boost is clamped to 1", () => {
    const eng = makeEngine();
    const wet = { ...ctx, currentReverbWet: 0.95 };
    applyPhasePatch(eng, PHASE_PATCHES.CRUISE, wet);
    expect(eng.setReverbWet).toHaveBeenCalledWith(1, expect.any(Number));
  });
});
