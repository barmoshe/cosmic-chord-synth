import { describe, expect, it } from "vitest";
import {
  PHASES,
  PHASE_ORDER,
  TRANSITIONS,
  phasePattern,
  type PhaseName,
} from "./phases";
import { DRUM_PATTERNS } from "./drumPatterns";
import type { Telemetry } from "../engine/types";

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

describe("PHASES", () => {
  it("contains exactly 9 phases in canonical order", () => {
    expect(PHASE_ORDER).toEqual([
      "PREFLIGHT", "TAXI", "TAKEOFF", "CLIMB", "CRUISE",
      "DESCENT", "APPROACH", "LANDING", "SHUTDOWN",
    ]);
    for (const p of PHASE_ORDER) expect(PHASES[p]).toBeDefined();
  });

  it("each phase points at a real drum pattern", () => {
    for (const p of PHASE_ORDER) {
      const key = PHASES[p].drumPatternKey;
      expect(DRUM_PATTERNS[key]).toBeDefined();
    }
  });

  it("energy values are 0..1", () => {
    for (const p of PHASE_ORDER) {
      expect(PHASES[p].energy).toBeGreaterThanOrEqual(0);
      expect(PHASES[p].energy).toBeLessThanOrEqual(1);
    }
  });

  it("anti-flicker dwell is non-negative", () => {
    for (const p of PHASE_ORDER) {
      expect(PHASES[p].minDwellSec).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("phasePattern", () => {
  it("resolves PREFLIGHT to silence", () => {
    expect(phasePattern("PREFLIGHT")).toBe(DRUM_PATTERNS.silence);
  });
  it("resolves CLIMB to fourFloor", () => {
    expect(phasePattern("CLIMB")).toBe(DRUM_PATTERNS.fourFloor);
  });
});

describe("TRANSITIONS — chain coverage", () => {
  it("forms a connected chain from PREFLIGHT to SHUTDOWN with no gaps", () => {
    const visited = new Set<PhaseName>(["PREFLIGHT"]);
    const adj = new Map<PhaseName, PhaseName[]>();
    for (const tr of TRANSITIONS) {
      if (!adj.has(tr.from)) adj.set(tr.from, []);
      adj.get(tr.from)!.push(tr.to);
    }
    let current: PhaseName | undefined = "PREFLIGHT";
    while (current && current !== "SHUTDOWN") {
      const nexts = adj.get(current);
      expect(nexts, `no transition out of ${current}`).toBeDefined();
      const next = nexts![0];
      visited.add(next);
      current = next;
    }
    expect(visited.has("SHUTDOWN")).toBe(true);
  });

  it("every from-phase except SHUTDOWN has at least one outgoing transition", () => {
    for (const p of PHASE_ORDER) {
      if (p === "SHUTDOWN") continue;
      const out = TRANSITIONS.filter((tr) => tr.from === p);
      expect(out.length, `${p} has no outgoing transition`).toBeGreaterThan(0);
    }
  });

  it("sustainSec is non-negative", () => {
    for (const tr of TRANSITIONS) {
      expect(tr.sustainSec).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("TRANSITIONS — predicate behaviour", () => {
  const findTransition = (from: PhaseName, to: PhaseName) => {
    const tr = TRANSITIONS.find((x) => x.from === from && x.to === to);
    if (!tr) throw new Error(`no transition ${from} → ${to}`);
    return tr;
  };

  it("PREFLIGHT → TAXI fires once throttle is bumped", () => {
    const tr = findTransition("PREFLIGHT", "TAXI");
    expect(tr.predicate(baseTelemetry)).toBe(false);
    expect(tr.predicate({ ...baseTelemetry, throttle: 0.1 })).toBe(true);
    expect(tr.predicate({ ...baseTelemetry, rpm: 0.1 })).toBe(true);
  });

  it("TAXI → TAKEOFF requires firewalled throttle on the ground", () => {
    const tr = findTransition("TAXI", "TAKEOFF");
    expect(tr.predicate({ ...baseTelemetry, throttle: 0.5, onGround: true })).toBe(false);
    expect(tr.predicate({ ...baseTelemetry, throttle: 0.8, onGround: false })).toBe(false);
    expect(tr.predicate({ ...baseTelemetry, throttle: 0.8, onGround: true })).toBe(true);
  });

  it("TAKEOFF → CLIMB fires when airborne and above 50 kt", () => {
    const tr = findTransition("TAKEOFF", "CLIMB");
    expect(tr.predicate({ ...baseTelemetry, onGround: true, airspeedKt: 60 })).toBe(false);
    expect(tr.predicate({ ...baseTelemetry, onGround: false, airspeedKt: 30 })).toBe(false);
    expect(tr.predicate({ ...baseTelemetry, onGround: false, airspeedKt: 60 })).toBe(true);
  });

  it("CLIMB → CRUISE fires when |VS| settles below 200 fpm", () => {
    const tr = findTransition("CLIMB", "CRUISE");
    expect(tr.predicate({ ...baseTelemetry, verticalSpeedFpm: 1000 })).toBe(false);
    expect(tr.predicate({ ...baseTelemetry, verticalSpeedFpm: -250 })).toBe(false);
    expect(tr.predicate({ ...baseTelemetry, verticalSpeedFpm: 50 })).toBe(true);
  });

  it("CRUISE → DESCENT requires power off + sinking", () => {
    const tr = findTransition("CRUISE", "DESCENT");
    expect(tr.predicate({ ...baseTelemetry, throttle: 0.6, verticalSpeedFpm: -500 })).toBe(false);
    expect(tr.predicate({ ...baseTelemetry, throttle: 0.2, verticalSpeedFpm: 50 })).toBe(false);
    expect(tr.predicate({ ...baseTelemetry, throttle: 0.2, verticalSpeedFpm: -500 })).toBe(true);
  });

  it("DESCENT → APPROACH at altitude < 2000 ft", () => {
    const tr = findTransition("DESCENT", "APPROACH");
    expect(tr.predicate({ ...baseTelemetry, altitudeFt: 5000 })).toBe(false);
    expect(tr.predicate({ ...baseTelemetry, altitudeFt: 1500 })).toBe(true);
  });

  it("APPROACH → LANDING fires when low or on ground", () => {
    const tr = findTransition("APPROACH", "LANDING");
    expect(tr.predicate({ ...baseTelemetry, altitudeFt: 500, onGround: false })).toBe(false);
    expect(tr.predicate({ ...baseTelemetry, altitudeFt: 50, onGround: false })).toBe(true);
    expect(tr.predicate({ ...baseTelemetry, onGround: true, altitudeFt: 2500 })).toBe(true);
  });

  it("LANDING → SHUTDOWN fires when stopped on the ground", () => {
    const tr = findTransition("LANDING", "SHUTDOWN");
    expect(tr.predicate({ ...baseTelemetry, airspeedKt: 20, onGround: true })).toBe(false);
    expect(tr.predicate({ ...baseTelemetry, airspeedKt: 3, onGround: true })).toBe(true);
    expect(tr.predicate({ ...baseTelemetry, airspeedKt: 3, onGround: false })).toBe(false);
  });
});
