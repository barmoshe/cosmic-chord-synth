import type { ControlInputs } from "./types";

export function makeControls(): ControlInputs {
  return {
    throttle: 0,
    elevator: 0,
    aileron: 0,
    rudder: 0,
    flaps: 0,
    gearDown: true,
  };
}

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

export function clampControls(c: ControlInputs): ControlInputs {
  return {
    throttle: clamp(c.throttle, 0, 1),
    elevator: clamp(c.elevator, -1, 1),
    aileron: clamp(c.aileron, -1, 1),
    rudder: clamp(c.rudder, -1, 1),
    flaps: clamp(c.flaps, 0, 4),
    gearDown: c.gearDown,
  };
}
