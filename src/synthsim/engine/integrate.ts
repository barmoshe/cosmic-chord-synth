import { AIRFRAME, G } from "./airframe";
import {
  aerodynamicForces,
  airspeed,
  angleOfAttack,
  bodyAxes,
  thrustForce,
} from "./forces";
import type { ControlInputs, FlightState } from "./types";

export const FIXED_DT = 1 / 60;

const TAU = Math.PI * 2;
const RPM_TIME_CONSTANT_S = 1.5;

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

const wrapAngle = (a: number) => {
  const m = a % TAU;
  return m < 0 ? m + TAU : m;
};

export function makeFlightState(): FlightState {
  return {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    attitude: { pitch: 0, roll: 0, yaw: 0 },
    angVel: { pitch: 0, roll: 0, yaw: 0 },
    rpm: 0,
    fuel: 1,
    onGround: true,
  };
}

export function step(
  state: FlightState,
  ctrl: ControlInputs,
  dt: number = FIXED_DT,
): FlightState {
  const speed = airspeed(state.velocity);
  const speedFactor = Math.max(
    AIRFRAME.groundAuthorityFloor,
    Math.min(1, speed / 30),
  );
  const oldAxes = bodyAxes(state.attitude);
  const oldAoa = angleOfAttack(state.velocity, oldAxes);

  const pitchAccel =
    ctrl.elevator * AIRFRAME.pitchAuthority * speedFactor -
    AIRFRAME.pitchDamp * state.angVel.pitch -
    oldAoa * AIRFRAME.pitchStability * speedFactor;
  const rollAccel =
    ctrl.aileron * AIRFRAME.rollAuthority * speedFactor -
    AIRFRAME.rollDamp * state.angVel.roll -
    state.attitude.roll * AIRFRAME.rollStability * speedFactor;

  const turnFromBank =
    speed > 1 ? (Math.tan(state.attitude.roll) * G) / speed : 0;
  const yawAccel =
    ctrl.rudder * AIRFRAME.yawAuthority * speedFactor -
    AIRFRAME.yawDamp * (state.angVel.yaw - turnFromBank);

  const newAngVel = {
    pitch: state.angVel.pitch + pitchAccel * dt,
    roll: state.angVel.roll + rollAccel * dt,
    yaw: state.angVel.yaw + yawAccel * dt,
  };

  let nextPitch = state.attitude.pitch + newAngVel.pitch * dt;
  let nextRoll = state.attitude.roll + newAngVel.roll * dt;
  let nextYaw = state.attitude.yaw + newAngVel.yaw * dt;

  nextPitch = clamp(nextPitch, -AIRFRAME.pitchClampRad, AIRFRAME.pitchClampRad);
  nextRoll = clamp(nextRoll, -Math.PI / 2, Math.PI / 2);
  nextYaw = wrapAngle(nextYaw);

  const newAttitude = { pitch: nextPitch, roll: nextRoll, yaw: nextYaw };

  const axes = bodyAxes(newAttitude);
  const aero = aerodynamicForces({ ...state, attitude: newAttitude }, ctrl, axes);
  const thrust = thrustForce({ ...state, attitude: newAttitude }, axes);

  const fx = thrust.x + aero.lift.x + aero.drag.x;
  const fy = thrust.y + aero.lift.y + aero.drag.y - G * AIRFRAME.mass;
  const fz = thrust.z + aero.lift.z + aero.drag.z;

  const ax = fx / AIRFRAME.mass;
  const ay = fy / AIRFRAME.mass;
  const az = fz / AIRFRAME.mass;

  let nvx = state.velocity.x + ax * dt;
  let nvy = state.velocity.y + ay * dt;
  let nvz = state.velocity.z + az * dt;

  let nx = state.position.x + nvx * dt;
  let ny = state.position.y + nvy * dt;
  let nz = state.position.z + nvz * dt;

  let onGround = false;
  if (ny <= 0) {
    ny = 0;
    nvy = Math.max(0, nvy);
    onGround = true;
    const rolling = AIRFRAME.rollingFriction * (1 - ctrl.throttle * 0.5);
    const decay = Math.max(0, 1 - rolling * dt);
    nvx *= decay;
    nvz *= decay;
    if (newAttitude.pitch < 0) {
      newAttitude.pitch = 0;
      newAngVel.pitch = Math.max(0, newAngVel.pitch);
    }
    if (newAttitude.pitch > AIRFRAME.groundPitchMaxRad) {
      newAttitude.pitch = AIRFRAME.groundPitchMaxRad;
      newAngVel.pitch = Math.min(0, newAngVel.pitch);
    }
    newAttitude.roll *= Math.max(0, 1 - 4 * dt);
    newAngVel.roll = 0;
  }

  const speedClamped = Math.hypot(nvx, nvy, nvz);
  const speedCap = AIRFRAME.vNe * 1.3;
  if (speedClamped > speedCap) {
    const scale = speedCap / speedClamped;
    nvx *= scale;
    nvy *= scale;
    nvz *= scale;
  }

  const rpmTarget = ctrl.throttle;
  const rpm = state.rpm + (rpmTarget - state.rpm) * (dt / RPM_TIME_CONSTANT_S);

  const fuelDelta = (AIRFRAME.fuelBurnKgs * ctrl.throttle * dt) / AIRFRAME.fuelCapacityKg;
  const fuel = Math.max(0, state.fuel - fuelDelta);

  return {
    position: { x: nx, y: ny, z: nz },
    velocity: { x: nvx, y: nvy, z: nvz },
    attitude: newAttitude,
    angVel: newAngVel,
    rpm,
    fuel,
    onGround,
  };
}

export function stepN(
  state: FlightState,
  ctrl: ControlInputs,
  steps: number,
  dt: number = FIXED_DT,
): FlightState {
  let s = state;
  for (let i = 0; i < steps; i++) s = step(s, ctrl, dt);
  return s;
}
