import { describe, expect, it } from "vitest";
import { makeControls } from "./controls";
import { FIXED_DT, makeFlightState, step, stepN } from "./integrate";
import type { ControlInputs, FlightState } from "./types";

const isFinite3 = (v: { x: number; y: number; z: number }) =>
  Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);

const allFinite = (s: FlightState) =>
  isFinite3(s.position) &&
  isFinite3(s.velocity) &&
  Number.isFinite(s.attitude.pitch) &&
  Number.isFinite(s.attitude.roll) &&
  Number.isFinite(s.attitude.yaw) &&
  Number.isFinite(s.angVel.pitch) &&
  Number.isFinite(s.angVel.roll) &&
  Number.isFinite(s.angVel.yaw) &&
  Number.isFinite(s.rpm) &&
  Number.isFinite(s.fuel);

describe("integrate.step — no input", () => {
  it("at rest, gear down, no throttle → state stays grounded", () => {
    const start = makeFlightState();
    const ctrl = makeControls();
    const after = stepN(start, ctrl, 60 * 5);
    expect(after.position.y).toBe(0);
    expect(after.onGround).toBe(true);
    expect(Math.hypot(after.velocity.x, after.velocity.y, after.velocity.z)).toBeLessThan(0.1);
  });
});

describe("integrate.step — full throttle takeoff", () => {
  it("accelerates to flight speed within 30s", () => {
    const start = makeFlightState();
    const ctrl: ControlInputs = { ...makeControls(), throttle: 1, elevator: 0.15 };
    const after = stepN(start, ctrl, 60 * 30);
    const speed = Math.hypot(after.velocity.x, after.velocity.y, after.velocity.z);
    expect(speed).toBeGreaterThan(25);
  });

  it("rotates off the ground given a longer takeoff roll", () => {
    const start = makeFlightState();
    const ctrl: ControlInputs = { ...makeControls(), throttle: 1, elevator: 0.15 };
    const after = stepN(start, ctrl, 60 * 60);
    expect(after.position.y).toBeGreaterThan(0);
    expect(after.onGround).toBe(false);
  });
});

describe("integrate.step — descent with no power", () => {
  it("loses altitude when throttle cut + nose down", () => {
    const aloft: FlightState = {
      ...makeFlightState(),
      position: { x: 0, y: 500, z: 0 },
      velocity: { x: 0, y: 0, z: 50 },
      attitude: { pitch: -0.15, roll: 0, yaw: 0 },
      rpm: 0.6,
      onGround: false,
    };
    const ctrl: ControlInputs = { ...makeControls(), throttle: 0, elevator: -0.4 };
    const after = stepN(aloft, ctrl, 60 * 30);
    expect(after.position.y).toBeLessThan(500);
  });
});

describe("integrate.step — numerical stability", () => {
  it("never produces NaN/Infinity over 5 simulated minutes of mixed input", () => {
    let s = makeFlightState();
    const stepsTotal = 60 * 60 * 5;
    for (let i = 0; i < stepsTotal; i++) {
      const phase = i / 60;
      const ctrl: ControlInputs = {
        throttle: 0.5 + 0.5 * Math.sin(phase * 0.1),
        elevator: 0.3 * Math.sin(phase * 0.7),
        aileron: 0.2 * Math.sin(phase * 0.4),
        rudder: 0,
        flaps: 0,
        gearDown: i < 60 * 30,
      };
      s = step(s, ctrl, FIXED_DT);
      if (!allFinite(s)) {
        throw new Error(`non-finite state at step ${i}`);
      }
    }
    expect(allFinite(s)).toBe(true);
  });
});

describe("integrate.step — angle wrapping + clamping", () => {
  it("yaw stays in [0, 2π)", () => {
    let s = makeFlightState();
    const ctrl: ControlInputs = { ...makeControls(), throttle: 1, aileron: 0.6 };
    for (let i = 0; i < 60 * 60; i++) {
      s = step(s, ctrl, FIXED_DT);
    }
    expect(s.attitude.yaw).toBeGreaterThanOrEqual(0);
    expect(s.attitude.yaw).toBeLessThan(Math.PI * 2);
  });

  it("pitch never exceeds clamp", () => {
    let s = makeFlightState();
    const ctrl: ControlInputs = { ...makeControls(), throttle: 1, elevator: 1 };
    for (let i = 0; i < 60 * 30; i++) {
      s = step(s, ctrl, FIXED_DT);
      expect(Math.abs(s.attitude.pitch)).toBeLessThanOrEqual(1.49);
    }
  });
});

describe("integrate.step — speed cap", () => {
  it("never exceeds vNe * 1.3 even under sustained dive", () => {
    let s: FlightState = {
      ...makeFlightState(),
      position: { x: 0, y: 5000, z: 0 },
      velocity: { x: 0, y: 0, z: 60 },
      attitude: { pitch: -0.4, roll: 0, yaw: 0 },
      rpm: 1,
      onGround: false,
    };
    const ctrl: ControlInputs = { ...makeControls(), throttle: 1, elevator: -0.3 };
    for (let i = 0; i < 60 * 60; i++) {
      s = step(s, ctrl, FIXED_DT);
      const speed = Math.hypot(s.velocity.x, s.velocity.y, s.velocity.z);
      expect(speed).toBeLessThanOrEqual(87 * 1.3 + 1e-3);
      if (s.position.y <= 0) break;
    }
  });
});
