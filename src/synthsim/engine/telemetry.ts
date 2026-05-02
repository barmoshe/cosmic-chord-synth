import { FT_PER_M, KT_PER_MPS, AIRFRAME } from "./airframe";
import { airspeed, angleOfAttack, bodyAxes } from "./forces";
import type { ControlInputs, FlightState, Telemetry } from "./types";

const RAD_TO_DEG = 180 / Math.PI;

export function stateToTelemetry(state: FlightState, ctrl: ControlInputs): Telemetry {
  const speed = airspeed(state.velocity);
  const axes = bodyAxes(state.attitude);
  const aoa = angleOfAttack(state.velocity, axes);

  const headingRad = state.attitude.yaw;
  const headingDeg = ((headingRad * RAD_TO_DEG) % 360 + 360) % 360;

  return {
    airspeedKt: speed * KT_PER_MPS,
    altitudeFt: state.position.y * FT_PER_M,
    verticalSpeedFpm: state.velocity.y * FT_PER_M * 60,
    pitchDeg: state.attitude.pitch * RAD_TO_DEG,
    rollDeg: state.attitude.roll * RAD_TO_DEG,
    headingDeg,
    yawRateDps: state.angVel.yaw * RAD_TO_DEG,
    throttle: ctrl.throttle,
    rpm: state.rpm,
    flaps: ctrl.flaps,
    gearDown: ctrl.gearDown,
    stallWarning: aoa > AIRFRAME.aoaCriticalRad && speed > 1,
    overspeed: speed > AIRFRAME.vNe,
    onGround: state.onGround,
    fuel: state.fuel,
  };
}
