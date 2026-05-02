import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StallBanner from "./StallBanner";
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

const wrap = (t: Telemetry) => {
  const flight: FlightLoopHandle = {
    stateRef: { current: null as never },
    controlsRef: { current: null as never },
    telemetryRef: { current: t },
    subscribe: () => () => {},
  };
  return render(
    <TelemetryProvider flight={flight} intervalMs={1000}>
      <StallBanner />
    </TelemetryProvider>,
  );
};

describe("StallBanner", () => {
  it("renders nothing when no warnings active", () => {
    const { queryByTestId } = wrap(baseTelemetry);
    expect(queryByTestId("stall-warning")).toBeNull();
    expect(queryByTestId("overspeed-warning")).toBeNull();
  });

  it("renders STALL banner when stallWarning is true", () => {
    const { queryByTestId } = wrap({ ...baseTelemetry, stallWarning: true });
    expect(queryByTestId("stall-warning")).not.toBeNull();
    expect(queryByTestId("overspeed-warning")).toBeNull();
  });

  it("renders OVERSPEED banner when overspeed is true", () => {
    const { queryByTestId } = wrap({ ...baseTelemetry, overspeed: true });
    expect(queryByTestId("overspeed-warning")).not.toBeNull();
    expect(queryByTestId("stall-warning")).toBeNull();
  });

  it("renders both when both flags are set", () => {
    const { queryByTestId } = wrap({
      ...baseTelemetry,
      stallWarning: true,
      overspeed: true,
    });
    expect(queryByTestId("stall-warning")).not.toBeNull();
    expect(queryByTestId("overspeed-warning")).not.toBeNull();
  });
});
