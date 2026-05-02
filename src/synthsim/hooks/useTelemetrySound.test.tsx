import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTelemetrySound } from "./useTelemetrySound";
import type { FlightLoopHandle } from "./useFlightLoop";
import type { SoundEngine } from "../sound/audioEngine";
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

const makeFlight = () => {
  const subs = new Set<(t: Telemetry) => void>();
  const flight: FlightLoopHandle = {
    stateRef: { current: null as never },
    controlsRef: { current: null as never },
    telemetryRef: { current: { ...baseTelemetry } },
    subscribe: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
  return { flight, emit: (t: Telemetry) => subs.forEach((fn) => fn(t)), subs };
};

const makeStubEngine = (ready = true): SoundEngine => ({
  start: vi.fn(async () => true),
  dispose: vi.fn(),
  isReady: vi.fn(() => ready),
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
  setDrumPattern: vi.fn(),
});

describe("useTelemetrySound", () => {
  it("does not subscribe while inactive", () => {
    const { flight, subs } = makeFlight();
    const engine = makeStubEngine();
    renderHook(() => useTelemetrySound(flight, engine, false));
    expect(subs.size).toBe(0);
  });

  it("subscribes when active and applies telemetry on each emit", () => {
    const { flight, emit, subs } = makeFlight();
    const engine = makeStubEngine();
    renderHook(() => useTelemetrySound(flight, engine, true));
    expect(subs.size).toBe(1);

    emit({ ...baseTelemetry, throttle: 1 });
    expect(engine.setMasterGainDb).toHaveBeenCalled();
    expect(engine.setBpm).toHaveBeenCalled();
  });

  it("skips applying when engine is not ready", () => {
    const { flight, emit } = makeFlight();
    const engine = makeStubEngine(false);
    renderHook(() => useTelemetrySound(flight, engine, true));
    emit(baseTelemetry);
    expect(engine.setMasterGainDb).not.toHaveBeenCalled();
  });

  it("unsubscribes on unmount", () => {
    const { flight, subs } = makeFlight();
    const engine = makeStubEngine();
    const { unmount } = renderHook(() => useTelemetrySound(flight, engine, true));
    expect(subs.size).toBe(1);
    unmount();
    expect(subs.size).toBe(0);
  });

  it("unsubscribes when active flips to false", () => {
    const { flight, subs } = makeFlight();
    const engine = makeStubEngine();
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useTelemetrySound(flight, engine, active),
      { initialProps: { active: true } },
    );
    expect(subs.size).toBe(1);
    rerender({ active: false });
    expect(subs.size).toBe(0);
  });

  it("when a phase patch is supplied, applies the patch override after the mapping", async () => {
    const { DEFAULT_PROFILE } = await import("../sound/profiles");
    const { flight, emit } = makeFlight();
    const engine = makeStubEngine();
    renderHook(() =>
      useTelemetrySound(
        flight,
        engine,
        true,
        DEFAULT_PROFILE,
        { masterGainCeilingDb: -36 },
      ),
    );

    emit({ ...baseTelemetry, throttle: 1 });
    const calls = (engine.setMasterGainDb as any).mock.calls as [number, number][];
    const lastValue = calls.at(-1)?.[0];
    expect(lastValue).toBe(-36);
  });
});
