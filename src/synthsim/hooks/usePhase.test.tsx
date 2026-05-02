import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePhase } from "./usePhase";
import type { FlightLoopHandle } from "./useFlightLoop";
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

describe("usePhase", () => {
  let now = 0;
  beforeEach(() => {
    now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in PREFLIGHT", () => {
    const { flight } = makeFlight();
    const { result } = renderHook(() => usePhase(flight, true));
    expect(result.current.phase).toBe("PREFLIGHT");
  });

  it("does not subscribe while inactive", () => {
    const { flight, subs } = makeFlight();
    renderHook(() => usePhase(flight, false));
    expect(subs.size).toBe(0);
  });

  it("PREFLIGHT → TAXI after throttle bump sustained ≥ 0.5s", () => {
    const { flight, emit } = makeFlight();
    const { result } = renderHook(() => usePhase(flight, true));

    now = 100;
    act(() => emit({ ...baseTelemetry, throttle: 0.2 }));
    expect(result.current.phase).toBe("PREFLIGHT");

    now = 700;
    act(() => emit({ ...baseTelemetry, throttle: 0.2 }));
    expect(result.current.phase).toBe("TAXI");
  });

  it("predicate going on/off resets the candidate dwell", () => {
    const { flight, emit } = makeFlight();
    const { result } = renderHook(() => usePhase(flight, true));

    now = 100;
    act(() => emit({ ...baseTelemetry, throttle: 0.2 }));

    now = 300;
    act(() => emit({ ...baseTelemetry, throttle: 0 }));

    now = 600;
    act(() => emit({ ...baseTelemetry, throttle: 0.2 }));
    expect(result.current.phase).toBe("PREFLIGHT");

    now = 1200;
    act(() => emit({ ...baseTelemetry, throttle: 0.2 }));
    expect(result.current.phase).toBe("TAXI");
  });

  it("respects minDwellSec — TAXI cannot exit before 2s", () => {
    const { flight, emit } = makeFlight();
    const { result } = renderHook(() => usePhase(flight, true));

    now = 100;
    act(() => emit({ ...baseTelemetry, throttle: 0.2 }));
    now = 700;
    act(() => emit({ ...baseTelemetry, throttle: 0.2 }));
    expect(result.current.phase).toBe("TAXI");

    now = 1000;
    act(() => emit({ ...baseTelemetry, throttle: 0.9, onGround: true }));
    expect(result.current.phase).toBe("TAXI");

    now = 3000;
    act(() => emit({ ...baseTelemetry, throttle: 0.9, onGround: true }));
    now = 5500;
    act(() => emit({ ...baseTelemetry, throttle: 0.9, onGround: true }));
    expect(result.current.phase).toBe("TAKEOFF");
  });

  it("TAKEOFF → CLIMB fires on liftoff (sustainSec=0)", () => {
    const { flight, emit } = makeFlight();
    const { result } = renderHook(() => usePhase(flight, true));

    now = 100;
    act(() => emit({ ...baseTelemetry, throttle: 0.2 }));
    now = 700;
    act(() => emit({ ...baseTelemetry, throttle: 0.2 }));
    now = 5000;
    act(() => emit({ ...baseTelemetry, throttle: 0.9, onGround: true }));
    now = 7500;
    act(() => emit({ ...baseTelemetry, throttle: 0.9, onGround: true }));
    expect(result.current.phase).toBe("TAKEOFF");

    now = 12000;
    act(() => emit({ ...baseTelemetry, throttle: 0.9, onGround: false, airspeedKt: 60 }));
    expect(result.current.phase).toBe("CLIMB");
  });

  it("returns matching pattern + patch for current phase", () => {
    const { flight } = makeFlight();
    const { result } = renderHook(() => usePhase(flight, true));
    expect(result.current.pattern.key).toBe("silence");
    expect(result.current.patch).toBeDefined();
  });

  it("unsubscribes on unmount", () => {
    const { flight, subs } = makeFlight();
    const { unmount } = renderHook(() => usePhase(flight, true));
    expect(subs.size).toBe(1);
    unmount();
    expect(subs.size).toBe(0);
  });

  it("unsubscribes when active flips to false", () => {
    const { flight, subs } = makeFlight();
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => usePhase(flight, active),
      { initialProps: { active: true } },
    );
    expect(subs.size).toBe(1);
    rerender({ active: false });
    expect(subs.size).toBe(0);
  });
});
