import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Heading from "./Heading";
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
      <Heading />
    </TelemetryProvider>,
  );
};

describe("Heading", () => {
  it("card not rotated when heading is 0 (north up)", () => {
    const { getByTestId } = wrap(baseTelemetry);
    expect(getByTestId("hsi-card").getAttribute("transform")).toMatch(/^rotate\(-?0\)$/);
  });

  it("card rotates by -heading", () => {
    const { getByTestId } = wrap({ ...baseTelemetry, headingDeg: 90 });
    expect(getByTestId("hsi-card").getAttribute("transform")).toBe("rotate(-90)");
  });

  it("digital readout zero-pads to 3 digits", () => {
    const { getByTestId } = wrap({ ...baseTelemetry, headingDeg: 7 });
    expect(getByTestId("hsi-value").textContent).toBe("007");
  });

  it("wraps 360 to 000", () => {
    const { getByTestId } = wrap({ ...baseTelemetry, headingDeg: 360 });
    expect(getByTestId("hsi-value").textContent).toBe("000");
  });

  it("cardinal directions are present in the card", () => {
    const { container } = wrap(baseTelemetry);
    const labels = Array.from(container.querySelectorAll("text")).map((el) => el.textContent);
    expect(labels).toEqual(expect.arrayContaining(["N", "E", "S", "W"]));
  });
});
