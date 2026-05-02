import { act, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TelemetryProvider, useTelemetry } from "./TelemetryContext";
import type { FlightLoopHandle } from "../hooks/useFlightLoop";
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

const makeFlight = (initial: Telemetry): FlightLoopHandle => ({
  stateRef: { current: null as never },
  controlsRef: { current: null as never },
  telemetryRef: { current: { ...initial } },
  subscribe: () => () => {},
});

describe("TelemetryContext", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("useTelemetry throws outside provider", () => {
    expect(() => renderHook(() => useTelemetry())).toThrow(/useTelemetry/);
  });

  it("provider exposes initial telemetry value", () => {
    const flight = makeFlight({ ...baseTelemetry, airspeedKt: 42 });
    const { result } = renderHook(() => useTelemetry(), {
      wrapper: ({ children }) => (
        <TelemetryProvider flight={flight} intervalMs={50}>
          {children}
        </TelemetryProvider>
      ),
    });
    expect(result.current.airspeedKt).toBe(42);
  });

  it("provider polls and re-emits when telemetryRef mutates", () => {
    const flight = makeFlight(baseTelemetry);
    const seen: number[] = [];
    const Probe = () => {
      const t = useTelemetry();
      seen.push(t.airspeedKt);
      return null;
    };
    render(
      <TelemetryProvider flight={flight} intervalMs={50}>
        <Probe />
      </TelemetryProvider>,
    );
    flight.telemetryRef.current = { ...baseTelemetry, airspeedKt: 73 };
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(seen.at(-1)).toBe(73);
  });

  it("provider clears interval on unmount", () => {
    const flight = makeFlight(baseTelemetry);
    const Probe = () => {
      useTelemetry();
      return null;
    };
    const { unmount } = render(
      <TelemetryProvider flight={flight} intervalMs={50}>
        <Probe />
      </TelemetryProvider>,
    );
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
