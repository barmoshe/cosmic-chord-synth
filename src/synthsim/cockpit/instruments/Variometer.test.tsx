import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Variometer from "./Variometer";
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
      <Variometer />
    </TelemetryProvider>,
  );
};

const extractRotate = (transform: string | null) => {
  if (!transform) return null;
  const m = transform.match(/rotate\(([-\d.]+)\)/);
  return m ? parseFloat(m[1]) : null;
};

describe("Variometer", () => {
  it("needle at -90° (9 o'clock) for level flight", () => {
    const { getByTestId } = wrap(baseTelemetry);
    expect(extractRotate(getByTestId("vsi-needle").getAttribute("transform"))).toBe(-90);
  });

  it("needle at 0° (12 o'clock) for +2000 fpm climb", () => {
    const { getByTestId } = wrap({ ...baseTelemetry, verticalSpeedFpm: 2000 });
    expect(extractRotate(getByTestId("vsi-needle").getAttribute("transform"))).toBe(0);
  });

  it("needle at -180° (6 o'clock) for -2000 fpm descent", () => {
    const { getByTestId } = wrap({ ...baseTelemetry, verticalSpeedFpm: -2000 });
    expect(extractRotate(getByTestId("vsi-needle").getAttribute("transform"))).toBe(-180);
  });

  it("needle saturates beyond +2000 fpm", () => {
    const { getByTestId } = wrap({ ...baseTelemetry, verticalSpeedFpm: 5000 });
    expect(extractRotate(getByTestId("vsi-needle").getAttribute("transform"))).toBe(0);
  });

  it("needle saturates below -2000 fpm", () => {
    const { getByTestId } = wrap({ ...baseTelemetry, verticalSpeedFpm: -5000 });
    expect(extractRotate(getByTestId("vsi-needle").getAttribute("transform"))).toBe(-180);
  });
});
