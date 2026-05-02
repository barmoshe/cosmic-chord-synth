import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const factory = vi.hoisted(() => ({
  createSoundEngine: vi.fn(),
}));

vi.mock("../sound/audioEngine", () => ({
  createSoundEngine: factory.createSoundEngine,
}));

import { useSoundEngine } from "./useSoundEngine";

const makeStubEngine = () => ({
  start: vi.fn(async () => true),
  dispose: vi.fn(),
  isReady: vi.fn(() => false),
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
  setDrumGainDb: vi.fn(),
  setLeadOctaveOffset: vi.fn(),
  setLeadScale: vi.fn(),
});

describe("useSoundEngine", () => {
  beforeEach(() => {
    factory.createSoundEngine.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a single engine on mount and reuses it across renders", () => {
    const stub = makeStubEngine();
    factory.createSoundEngine.mockReturnValue(stub);

    const { result, rerender } = renderHook(() => useSoundEngine());
    const first = result.current.engine;
    rerender();
    expect(result.current.engine).toBe(first);
    expect(factory.createSoundEngine).toHaveBeenCalledTimes(1);
  });

  it("disposes the engine on unmount", () => {
    const stub = makeStubEngine();
    factory.createSoundEngine.mockReturnValue(stub);

    const { unmount } = renderHook(() => useSoundEngine());
    unmount();
    expect(stub.dispose).toHaveBeenCalledTimes(1);
  });
});
