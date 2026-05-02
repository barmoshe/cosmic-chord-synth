import { describe, expect, it } from "vitest";
import { DRUM_PATTERNS, PATTERN_STEPS, type DrumPatternKey } from "./drumPatterns";

const allKeys: DrumPatternKey[] = [
  "silence",
  "tick",
  "build",
  "fourFloor",
  "pulse",
  "filtered",
  "tight",
  "impact",
];

describe("DRUM_PATTERNS", () => {
  it("provides 8 patterns covering every DrumPatternKey", () => {
    for (const key of allKeys) {
      expect(DRUM_PATTERNS[key]).toBeDefined();
      expect(DRUM_PATTERNS[key].key).toBe(key);
    }
  });

  it("each pattern has 16 kick + 16 hat steps", () => {
    for (const key of allKeys) {
      const p = DRUM_PATTERNS[key];
      expect(p.kick).toHaveLength(PATTERN_STEPS);
      expect(p.hat).toHaveLength(PATTERN_STEPS);
    }
  });

  it("velocities are clamped to 0..1", () => {
    for (const key of allKeys) {
      const p = DRUM_PATTERNS[key];
      for (const v of [...p.kick, ...p.hat]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("silence is all zeros", () => {
    const s = DRUM_PATTERNS.silence;
    expect(s.kick.every((v) => v === 0)).toBe(true);
    expect(s.hat.every((v) => v === 0)).toBe(true);
  });

  it("tick has hat-only on offbeats", () => {
    const t = DRUM_PATTERNS.tick;
    expect(t.kick.every((v) => v === 0)).toBe(true);
    expect(t.hat.filter((v) => v > 0).length).toBe(4);
    expect(t.hat[2]).toBeGreaterThan(0);
    expect(t.hat[6]).toBeGreaterThan(0);
    expect(t.hat[10]).toBeGreaterThan(0);
    expect(t.hat[14]).toBeGreaterThan(0);
  });

  it("fourFloor places kicks at 0,4,8,12", () => {
    const f = DRUM_PATTERNS.fourFloor;
    [0, 4, 8, 12].forEach((p) => expect(f.kick[p]).toBeGreaterThan(0));
    [1, 2, 3, 5, 6, 7].forEach((p) => expect(f.kick[p]).toBe(0));
  });

  it("impact has a single big kick on step 0", () => {
    const i = DRUM_PATTERNS.impact;
    expect(i.kick[0]).toBeGreaterThan(0);
    for (let s = 1; s < PATTERN_STEPS; s++) {
      expect(i.kick[s]).toBe(0);
    }
  });

  it("tight has hats on every even step", () => {
    const t = DRUM_PATTERNS.tight;
    [0, 2, 4, 6, 8, 10, 12, 14].forEach((p) => expect(t.hat[p]).toBeGreaterThan(0));
  });

  it("pulse has kicks only on 0 and 8 (downbeats)", () => {
    const p = DRUM_PATTERNS.pulse;
    expect(p.kick[0]).toBeGreaterThan(0);
    expect(p.kick[8]).toBeGreaterThan(0);
    expect(p.kick.filter((v) => v > 0).length).toBe(2);
  });
});
