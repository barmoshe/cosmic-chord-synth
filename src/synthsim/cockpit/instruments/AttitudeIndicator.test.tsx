import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AttitudeIndicator from "./AttitudeIndicator";
import { TelemetryProvider } from "../TelemetryContext";
import type { FlightLoopHandle } from "../../hooks/useFlightLoop";
import type { Telemetry } from "../../engine/types";

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
      <AttitudeIndicator />
    </TelemetryProvider>,
  );
};

describe("AttitudeIndicator", () => {
  it("renders an SVG with role=img", () => {
    const { getByTestId } = wrap(baseTelemetry);
    expect(getByTestId("ai-svg")).toBeInTheDocument();
  });

  it("inner group transform is identity at zero attitude", () => {
    const { getByTestId } = wrap(baseTelemetry);
    const tr = getByTestId("ai-inner").getAttribute("transform")!;
    expect(tr).toMatch(/^translate\(0 0\) rotate\(-?0\)$/);
  });

  it("pitch up moves horizon downward (positive y translate)", () => {
    const { getByTestId } = wrap({ ...baseTelemetry, pitchDeg: 10 });
    const tr = getByTestId("ai-inner").getAttribute("transform")!;
    expect(tr).toMatch(/translate\(0 40\)/);
  });

  it("right roll rotates inner group counterclockwise", () => {
    const { getByTestId } = wrap({ ...baseTelemetry, rollDeg: 30 });
    const tr = getByTestId("ai-inner").getAttribute("transform")!;
    expect(tr).toMatch(/rotate\(-30\)/);
  });

  it("bank pointer scale rotates with -rollDeg", () => {
    const { getByTestId } = wrap({ ...baseTelemetry, rollDeg: 45 });
    const tr = getByTestId("ai-bank").getAttribute("transform")!;
    expect(tr).toBe("rotate(-45)");
  });
});
