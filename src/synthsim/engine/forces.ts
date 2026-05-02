import { AIRFRAME, RHO_SL } from "./airframe";
import type { Attitude, ControlInputs, FlightState, Vec3 } from "./types";

export function airspeed(velocity: Vec3): number {
  return Math.hypot(velocity.x, velocity.y, velocity.z);
}

export interface BodyAxes {
  forward: Vec3;
  right: Vec3;
  up: Vec3;
}

export function bodyAxes(attitude: Attitude): BodyAxes {
  const cp = Math.cos(attitude.pitch), sp = Math.sin(attitude.pitch);
  const cy = Math.cos(attitude.yaw), sy = Math.sin(attitude.yaw);
  const cr = Math.cos(attitude.roll), sr = Math.sin(attitude.roll);

  const forward: Vec3 = { x: sy * cp, y: sp, z: cy * cp };

  const rightUnrolled: Vec3 = { x: cy, y: 0, z: -sy };
  const upUnrolled: Vec3 = { x: -sy * sp, y: cp, z: -cy * sp };

  const right: Vec3 = {
    x: rightUnrolled.x * cr + upUnrolled.x * sr,
    y: rightUnrolled.y * cr + upUnrolled.y * sr,
    z: rightUnrolled.z * cr + upUnrolled.z * sr,
  };
  const up: Vec3 = {
    x: -rightUnrolled.x * sr + upUnrolled.x * cr,
    y: -rightUnrolled.y * sr + upUnrolled.y * cr,
    z: -rightUnrolled.z * sr + upUnrolled.z * cr,
  };

  return { forward, right, up };
}

export function angleOfAttack(velocity: Vec3, axes: BodyAxes): number {
  const speed = airspeed(velocity);
  if (speed < 0.5) return 0;
  const vForward =
    velocity.x * axes.forward.x + velocity.y * axes.forward.y + velocity.z * axes.forward.z;
  const vUp =
    velocity.x * axes.up.x + velocity.y * axes.up.y + velocity.z * axes.up.z;
  return Math.atan2(-vUp, vForward);
}

export function liftCoefficient(aoa: number, flaps: number, stalled: boolean): number {
  let cl = AIRFRAME.CL0 + AIRFRAME.CL_alpha * aoa + flaps * AIRFRAME.flapsLiftBoost;
  if (stalled) {
    const overshoot = aoa - AIRFRAME.aoaCriticalRad;
    const dropFactor = Math.max(0.1, 0.6 - overshoot * 5);
    cl *= dropFactor;
  }
  if (cl > AIRFRAME.CL_max) cl = AIRFRAME.CL_max;
  if (cl < -AIRFRAME.CL_max) cl = -AIRFRAME.CL_max;
  return cl;
}

export function dragCoefficient(cl: number, flaps: number, gearDown: boolean): number {
  return (
    AIRFRAME.CD0 +
    AIRFRAME.k * cl * cl +
    flaps * AIRFRAME.flapsDragBoost +
    (gearDown ? AIRFRAME.gearDragBoost : 0)
  );
}

export interface AeroForces {
  lift: Vec3;
  drag: Vec3;
  cl: number;
  cd: number;
  aoa: number;
  stalled: boolean;
}

export function aerodynamicForces(
  state: FlightState,
  ctrl: ControlInputs,
  axes: BodyAxes,
): AeroForces {
  const speed = airspeed(state.velocity);
  const aoa = angleOfAttack(state.velocity, axes);
  const stalled = aoa > AIRFRAME.aoaCriticalRad;
  const cl = liftCoefficient(aoa, ctrl.flaps, stalled);
  const cd = dragCoefficient(cl, ctrl.flaps, ctrl.gearDown);

  const q = 0.5 * RHO_SL * speed * speed;
  const liftMag = q * AIRFRAME.wingArea * cl;
  const dragMag = q * AIRFRAME.wingArea * cd;

  let lift: Vec3 = { x: 0, y: 0, z: 0 };
  let drag: Vec3 = { x: 0, y: 0, z: 0 };

  if (speed > 0.5) {
    const inv = 1 / speed;
    const vx = state.velocity.x * inv;
    const vy = state.velocity.y * inv;
    const vz = state.velocity.z * inv;

    drag = { x: -vx * dragMag, y: -vy * dragMag, z: -vz * dragMag };

    // wind-frame right axis: vhat × bodyUp (perpendicular to airflow)
    const rwx = vy * axes.up.z - vz * axes.up.y;
    const rwy = vz * axes.up.x - vx * axes.up.z;
    const rwz = vx * axes.up.y - vy * axes.up.x;
    const rwLen = Math.hypot(rwx, rwy, rwz);

    if (rwLen > 1e-6) {
      const ir = 1 / rwLen;
      const rx = rwx * ir, ry = rwy * ir, rz = rwz * ir;
      // lift axis: rightWind × vhat — perpendicular to velocity, "up" relative to bank
      const ldx = ry * vz - rz * vy;
      const ldy = rz * vx - rx * vz;
      const ldz = rx * vy - ry * vx;
      lift = { x: ldx * liftMag, y: ldy * liftMag, z: ldz * liftMag };
    } else {
      lift = { x: axes.up.x * liftMag, y: axes.up.y * liftMag, z: axes.up.z * liftMag };
    }
  }

  return { lift, drag, cl, cd, aoa, stalled };
}

export function thrustForce(state: FlightState, axes: BodyAxes): Vec3 {
  const mag = AIRFRAME.thrustMax * state.rpm;
  return {
    x: axes.forward.x * mag,
    y: axes.forward.y * mag,
    z: axes.forward.z * mag,
  };
}
