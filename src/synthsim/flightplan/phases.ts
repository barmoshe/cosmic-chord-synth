import type { Telemetry } from "../engine/types";
import { DRUM_PATTERNS, type DrumPatternKey } from "./drumPatterns";

export type PhaseName =
  | "PREFLIGHT"
  | "TAXI"
  | "TAKEOFF"
  | "CLIMB"
  | "CRUISE"
  | "DESCENT"
  | "APPROACH"
  | "LANDING"
  | "SHUTDOWN";

export interface PhaseRecord {
  name: PhaseName;
  energy: number;
  drumPatternKey: DrumPatternKey;
  minDwellSec: number;
}

export const PHASES: Record<PhaseName, PhaseRecord> = {
  PREFLIGHT: { name: "PREFLIGHT", energy: 0.05, drumPatternKey: "silence",   minDwellSec: 0 },
  TAXI:      { name: "TAXI",      energy: 0.15, drumPatternKey: "tick",      minDwellSec: 2 },
  TAKEOFF:   { name: "TAKEOFF",   energy: 0.85, drumPatternKey: "build",     minDwellSec: 4 },
  CLIMB:     { name: "CLIMB",     energy: 0.7,  drumPatternKey: "fourFloor", minDwellSec: 6 },
  CRUISE:    { name: "CRUISE",    energy: 0.6,  drumPatternKey: "pulse",     minDwellSec: 8 },
  DESCENT:   { name: "DESCENT",   energy: 0.65, drumPatternKey: "filtered",  minDwellSec: 6 },
  APPROACH:  { name: "APPROACH",  energy: 0.8,  drumPatternKey: "tight",     minDwellSec: 4 },
  LANDING:   { name: "LANDING",   energy: 0.95, drumPatternKey: "impact",    minDwellSec: 2 },
  SHUTDOWN:  { name: "SHUTDOWN",  energy: 0.05, drumPatternKey: "silence",   minDwellSec: 4 },
};

export interface Transition {
  from: PhaseName;
  to: PhaseName;
  predicate: (t: Telemetry) => boolean;
  sustainSec: number;
}

export const TRANSITIONS: Transition[] = [
  { from: "PREFLIGHT", to: "TAXI",
    predicate: (t) => t.throttle > 0.05 || t.rpm > 0.05,
    sustainSec: 0.5 },
  { from: "TAXI", to: "TAKEOFF",
    predicate: (t) => t.throttle > 0.7 && t.onGround,
    sustainSec: 2 },
  { from: "TAKEOFF", to: "CLIMB",
    predicate: (t) => !t.onGround && t.airspeedKt > 50,
    sustainSec: 0 },
  { from: "CLIMB", to: "CRUISE",
    predicate: (t) => Math.abs(t.verticalSpeedFpm) < 200,
    sustainSec: 4 },
  { from: "CRUISE", to: "DESCENT",
    predicate: (t) => t.throttle < 0.4 && t.verticalSpeedFpm < -200,
    sustainSec: 3 },
  { from: "DESCENT", to: "APPROACH",
    predicate: (t) => t.altitudeFt < 2000,
    sustainSec: 0 },
  { from: "APPROACH", to: "LANDING",
    predicate: (t) => t.altitudeFt < 100 || t.onGround,
    sustainSec: 0 },
  { from: "LANDING", to: "SHUTDOWN",
    predicate: (t) => t.airspeedKt < 5 && t.onGround,
    sustainSec: 3 },
];

export const phasePattern = (phase: PhaseName) => DRUM_PATTERNS[PHASES[phase].drumPatternKey];

export const PHASE_ORDER: PhaseName[] = [
  "PREFLIGHT", "TAXI", "TAKEOFF", "CLIMB", "CRUISE",
  "DESCENT", "APPROACH", "LANDING", "SHUTDOWN",
];
