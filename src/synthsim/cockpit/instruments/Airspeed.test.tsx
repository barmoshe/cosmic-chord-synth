import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Airspeed from "./Airspeed";
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
      <Airspeed />
    </TelemetryProvider>,
  );
};

const extractRotate = (transform: string | null) => {
  if (!transform) return null;
  const m = transform.match(/rotate\(([-\d.]+)\)/);
  return m ? parseFloat(m[1]) : null;
};

describe("Airspeed", () => {
  it("needle at -135° when airspeed is 0", () => {
    const { getByTestId } = wrap(baseTelemetry);
    expect(extractRotate(getByTestId("asi-needle").getAttribute("transform"))).toBe(-135);
  });

  it("needle at 0° when airspeed is 100 (mid-scale)", () => {
    const { getByTestId } = wrap({ ...baseTelemetry, airspeedKt: 100 });
    expect(extractRotate(getByTestId("asi-needle").getAttribute("transform"))).toBe(0);
  });

  it("needle at +135° when airspeed is 200 (full scale)", () => {
    const { getByTestId } = wrap({ ...baseTelemetry, airspeedKt: 200 });
    expect(extractRotate(getByTestId("asi-needle").getAttribute("transform"))).toBe(135);
  });

  it("needle clamps at +135° beyond 200 kt", () => {
    const { getByTestId } = wrap({ ...baseTelemetry, airspeedKt: 250 });
    expect(extractRotate(getByTestId("asi-needle").getAttribute("transform"))).toBe(135);
  });

  it("renders all four color bands (white, green, yellow + red Vne tick)", () => {
    const { container } = wrap(baseTelemetry);
    const strokes = Array.from(container.querySelectorAll("path,line"))
      .map((el) => el.getAttribute("stroke"))
      .filter(Boolean);
    expect(strokes).toContain("#fff");
    expect(strokes).toContain("#3ec27a");
    expect(strokes).toContain("#e6c547");
    expect(strokes).toContain("#e64545");
  });
});
