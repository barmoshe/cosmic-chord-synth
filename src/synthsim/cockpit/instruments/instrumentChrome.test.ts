import { describe, expect, it } from "vitest";
import { arcPath, clamp, pad3, polar } from "./instrumentChrome";

const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

describe("polar", () => {
  it("0 deg → straight up (negative y)", () => {
    const p = polar(0, 0, 100, 0);
    expect(close(p.x, 0)).toBe(true);
    expect(close(p.y, -100)).toBe(true);
  });
  it("90 deg → right", () => {
    const p = polar(0, 0, 100, 90);
    expect(close(p.x, 100)).toBe(true);
    expect(close(p.y, 0)).toBe(true);
  });
  it("180 deg → down", () => {
    const p = polar(0, 0, 100, 180);
    expect(close(p.x, 0)).toBe(true);
    expect(close(p.y, 100)).toBe(true);
  });
  it("offsets honor cx/cy", () => {
    const p = polar(50, 50, 10, 90);
    expect(close(p.x, 60)).toBe(true);
    expect(close(p.y, 50)).toBe(true);
  });
});

describe("arcPath", () => {
  it("returns a valid SVG arc command", () => {
    const path = arcPath(0, 0, 100, 0, 90);
    expect(path).toMatch(/^M [-\d.]+ [-\d.]+ A 100 100 0 [01] [01] [-\d.]+ [-\d.]+$/);
  });
  it("uses the long-arc flag for sweeps over 180°", () => {
    const small = arcPath(0, 0, 100, 0, 90);
    const big = arcPath(0, 0, 100, 0, 270);
    expect(small).toContain(" 0 ");
    expect(big).toContain(" 1 ");
  });
});

describe("clamp", () => {
  it("clamps below", () => expect(clamp(-5, 0, 10)).toBe(0));
  it("clamps above", () => expect(clamp(15, 0, 10)).toBe(10));
  it("passthrough", () => expect(clamp(5, 0, 10)).toBe(5));
});

describe("pad3", () => {
  it("pads single digit", () => expect(pad3(7)).toBe("007"));
  it("pads two digits", () => expect(pad3(42)).toBe("042"));
  it("rounds", () => expect(pad3(89.7)).toBe("090"));
  it("wraps 360", () => expect(pad3(360)).toBe("000"));
  it("wraps over 360", () => expect(pad3(450)).toBe("090"));
  it("wraps negative", () => expect(pad3(-90)).toBe("270"));
});
