export const AIRFRAME = {
  mass: 757,
  wingArea: 14.9,
  CL_alpha: 5.5,
  CL0: 0.50,
  CL_max: 1.7,
  CD0: 0.027,
  k: 0.054,
  thrustMax: 2400,
  fuelCapacityKg: 50,
  fuelBurnKgs: 0.0028,
  pitchAuthority: 0.6,
  rollAuthority: 1.6,
  yawAuthority: 0.4,
  pitchDamp: 2.4,
  rollDamp: 2.4,
  yawDamp: 1.2,
  pitchStability: 3.0,
  rollStability: 2.0,
  flapsLiftBoost: 0.18,
  flapsDragBoost: 0.012,
  gearDragBoost: 0.012,
  rollingFriction: 0.05,
  vStall: 22,
  vNe: 87,
  pitchClampRad: 1.48,
  groundPitchMaxRad: 0.22,
  aoaCriticalRad: 0.30,
  groundAuthorityFloor: 0.25,
} as const;

export const RHO_SL = 1.225;
export const G = 9.81;
export const FT_PER_M = 3.28084;
export const KT_PER_MPS = 1.94384;
