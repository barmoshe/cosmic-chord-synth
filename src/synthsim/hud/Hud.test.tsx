import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Hud from "./Hud";
import { TelemetryProvider } from "../cockpit/TelemetryContext";
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

const wrap = (t: Telemetry, phase?: string) => {
  const flight: FlightLoopHandle = {
    stateRef: { current: null as never },
    controlsRef: { current: null as never },
    telemetryRef: { current: t },
    subscribe: () => () => {},
  };
  return render(
    <TelemetryProvider flight={flight} intervalMs={1000}>
      <Hud phase={phase} />
    </TelemetryProvider>,
  );
};

describe("Hud", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the supplied phase string", () => {
    const { getByTestId } = wrap(baseTelemetry, "PRE-FLIGHT");
    expect(getByTestId("hud-phase").textContent).toBe("PRE-FLIGHT");
  });

  it("clock starts at T+00:00:00", () => {
    const { getByTestId } = wrap(baseTelemetry);
    expect(getByTestId("hud-clock").textContent).toBe("T+00:00:00");
  });

  it("clock advances after a simulated second", () => {
    const { getByTestId } = wrap(baseTelemetry);
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(getByTestId("hud-clock").textContent).toMatch(/T\+00:00:0[12]/);
  });

  it("fuel segments scale with fuel ratio", () => {
    const filled = (root: HTMLElement) =>
      root.querySelectorAll('[data-filled="true"]').length;

    const { container, unmount } = wrap({ ...baseTelemetry, fuel: 1 });
    expect(filled(container)).toBe(8);
    unmount();

    const half = wrap({ ...baseTelemetry, fuel: 0.5 });
    expect(filled(half.container)).toBe(4);
    half.unmount();

    const empty = wrap({ ...baseTelemetry, fuel: 0 });
    expect(filled(empty.container)).toBe(0);
  });
});
