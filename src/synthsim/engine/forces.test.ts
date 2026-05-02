import { describe, expect, it } from "vitest";
import { AIRFRAME } from "./airframe";
import {
  aerodynamicForces,
  airspeed,
  angleOfAttack,
  bodyAxes,
  dragCoefficient,
  liftCoefficient,
  thrustForce,
} from "./forces";
import { makeFlightState } from "./integrate";
import { makeControls } from "./controls";

const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

describe("airspeed", () => {
  it("zero velocity → zero", () => {
    expect(airspeed({ x: 0, y: 0, z: 0 })).toBe(0);
  });
  it("matches euclidean magnitude", () => {
    expect(airspeed({ x: 3, y: 4, z: 0 })).toBe(5);
    expect(airspeed({ x: 0, y: 0, z: 30 })).toBe(30);
  });
});

describe("bodyAxes", () => {
  it("identity attitude → forward=+Z, right=+X, up=+Y", () => {
    const a = bodyAxes({ pitch: 0, roll: 0, yaw: 0 });
    expect(close(a.forward.x, 0)).toBe(true);
    expect(close(a.forward.y, 0)).toBe(true);
    expect(close(a.forward.z, 1)).toBe(true);
    expect(close(a.right.x, 1)).toBe(true);
    expect(close(a.right.y, 0)).toBe(true);
    expect(close(a.right.z, 0)).toBe(true);
    expect(close(a.up.x, 0)).toBe(true);
    expect(close(a.up.y, 1)).toBe(true);
    expect(close(a.up.z, 0)).toBe(true);
  });

  it("yaw=π/2 → forward=+X (east)", () => {
    const a = bodyAxes({ pitch: 0, roll: 0, yaw: Math.PI / 2 });
    expect(close(a.forward.x, 1)).toBe(true);
    expect(close(a.forward.z, 0)).toBe(true);
  });

  it("pitch up → forward.y > 0", () => {
    const a = bodyAxes({ pitch: 0.3, roll: 0, yaw: 0 });
    expect(a.forward.y).toBeGreaterThan(0);
  });

  it("axes are unit length", () => {
    const a = bodyAxes({ pitch: 0.3, roll: 0.4, yaw: 1.1 });
    expect(close(Math.hypot(a.forward.x, a.forward.y, a.forward.z), 1, 1e-9)).toBe(true);
    expect(close(Math.hypot(a.right.x, a.right.y, a.right.z), 1, 1e-9)).toBe(true);
    expect(close(Math.hypot(a.up.x, a.up.y, a.up.z), 1, 1e-9)).toBe(true);
  });
});

describe("angleOfAttack", () => {
  it("level flight along forward → AoA ≈ 0", () => {
    const axes = bodyAxes({ pitch: 0, roll: 0, yaw: 0 });
    const aoa = angleOfAttack({ x: 0, y: 0, z: 30 }, axes);
    expect(Math.abs(aoa)).toBeLessThan(1e-6);
  });

  it("pitched up while moving level → AoA > 0", () => {
    const axes = bodyAxes({ pitch: 0.2, roll: 0, yaw: 0 });
    const aoa = angleOfAttack({ x: 0, y: 0, z: 30 }, axes);
    expect(aoa).toBeGreaterThan(0);
  });

  it("near-zero speed returns 0", () => {
    const axes = bodyAxes({ pitch: 0.5, roll: 0, yaw: 0 });
    expect(angleOfAttack({ x: 0, y: 0, z: 0 }, axes)).toBe(0);
  });
});

describe("liftCoefficient", () => {
  it("rises with AoA in linear range", () => {
    const cl0 = liftCoefficient(0, 0, false);
    const cl1 = liftCoefficient(0.1, 0, false);
    expect(cl1).toBeGreaterThan(cl0);
  });

  it("clamps at CL_max", () => {
    const cl = liftCoefficient(0.5, 0, false);
    expect(cl).toBeLessThanOrEqual(AIRFRAME.CL_max);
  });

  it("flaps add lift", () => {
    const noFlap = liftCoefficient(0.05, 0, false);
    const fullFlap = liftCoefficient(0.05, 4, false);
    expect(fullFlap).toBeGreaterThan(noFlap);
  });

  it("post-stall lift drops", () => {
    const preStall = liftCoefficient(AIRFRAME.aoaCriticalRad - 0.01, 0, false);
    const postStall = liftCoefficient(AIRFRAME.aoaCriticalRad + 0.05, 0, true);
    expect(postStall).toBeLessThan(preStall);
  });
});

describe("dragCoefficient", () => {
  it("is always non-negative", () => {
    expect(dragCoefficient(0, 0, false)).toBeGreaterThanOrEqual(0);
    expect(dragCoefficient(1.2, 4, true)).toBeGreaterThanOrEqual(0);
  });
  it("flaps + gear add drag", () => {
    const clean = dragCoefficient(0.5, 0, false);
    const dirty = dragCoefficient(0.5, 4, true);
    expect(dirty).toBeGreaterThan(clean);
  });
});

describe("aerodynamicForces", () => {
  it("at rest → near-zero lift and drag", () => {
    const state = makeFlightState();
    const ctrl = makeControls();
    const axes = bodyAxes(state.attitude);
    const f = aerodynamicForces(state, ctrl, axes);
    expect(Math.hypot(f.lift.x, f.lift.y, f.lift.z)).toBeLessThan(1e-6);
    expect(Math.hypot(f.drag.x, f.drag.y, f.drag.z)).toBeLessThan(1e-6);
  });

  it("at cruise speed level → lift mostly upward", () => {
    const state = { ...makeFlightState(), velocity: { x: 0, y: 0, z: 50 }, position: { x: 0, y: 500, z: 0 } };
    const ctrl = { ...makeControls(), gearDown: false };
    const axes = bodyAxes(state.attitude);
    const f = aerodynamicForces(state, ctrl, axes);
    expect(f.lift.y).toBeGreaterThan(0);
    expect(Math.abs(f.lift.x)).toBeLessThan(Math.abs(f.lift.y));
  });

  it("drag opposes velocity", () => {
    const state = { ...makeFlightState(), velocity: { x: 0, y: 0, z: 40 }, position: { x: 0, y: 500, z: 0 } };
    const ctrl = makeControls();
    const axes = bodyAxes(state.attitude);
    const f = aerodynamicForces(state, ctrl, axes);
    expect(f.drag.z).toBeLessThan(0);
  });
});

describe("thrustForce", () => {
  it("zero rpm → zero thrust", () => {
    const state = makeFlightState();
    const axes = bodyAxes(state.attitude);
    const t = thrustForce(state, axes);
    expect(Math.hypot(t.x, t.y, t.z)).toBe(0);
  });
  it("full rpm → forward-aligned thrust", () => {
    const state = { ...makeFlightState(), rpm: 1 };
    const axes = bodyAxes(state.attitude);
    const t = thrustForce(state, axes);
    expect(t.z).toBeGreaterThan(0);
    expect(Math.abs(t.x)).toBeLessThan(1e-6);
    expect(Math.abs(t.y)).toBeLessThan(1e-6);
  });
});
