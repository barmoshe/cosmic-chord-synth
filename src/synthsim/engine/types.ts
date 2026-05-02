export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Attitude {
  pitch: number;
  roll: number;
  yaw: number;
}

export interface AngVel {
  pitch: number;
  roll: number;
  yaw: number;
}

export interface ControlInputs {
  throttle: number;
  elevator: number;
  aileron: number;
  rudder: number;
  flaps: number;
  gearDown: boolean;
}

export interface FlightState {
  position: Vec3;
  velocity: Vec3;
  attitude: Attitude;
  angVel: AngVel;
  rpm: number;
  fuel: number;
  onGround: boolean;
}

export interface Telemetry {
  airspeedKt: number;
  altitudeFt: number;
  verticalSpeedFpm: number;
  pitchDeg: number;
  rollDeg: number;
  headingDeg: number;
  yawRateDps: number;
  throttle: number;
  rpm: number;
  flaps: number;
  gearDown: boolean;
  stallWarning: boolean;
  overspeed: boolean;
  onGround: boolean;
  fuel: number;
}
