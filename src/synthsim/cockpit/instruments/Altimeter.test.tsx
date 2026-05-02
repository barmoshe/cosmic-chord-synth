import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Altimeter from "./Altimeter";
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
      <Altimeter />
    </TelemetryProvider>,
  );
};

describe("Altimeter", () => {
  it("digital readout shows 0 at sea level", () => {
    const { getByTestId } = wrap(baseTelemetry);
    expect(getByTestId("alt-value").textContent).toBe("0");
  });

  it("rounds altitude to whole feet", () => {
    const { getByTestId } = wrap({ ...baseTelemetry, altitudeFt: 1234.7 });
    expect(getByTestId("alt-value").textContent).toBe("1235");
  });

  it("renders the major-label tape ticks at altitudes that are multiples of 500", () => {
    const { container } = wrap({ ...baseTelemetry, altitudeFt: 1300 });
    const labels = Array.from(container.querySelectorAll("text"))
      .map((el) => el.textContent)
      .filter((tx) => tx && /^\d+$/.test(tx));
    expect(labels).toContain("1500");
    expect(labels).toContain("1000");
  });
});
