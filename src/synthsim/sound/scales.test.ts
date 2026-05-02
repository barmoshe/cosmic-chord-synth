import { describe, expect, it } from "vitest";
import {
  SCALES,
  SCALE_NAMES_BY_OCTANT,
  headingToScale,
  scaleStepToMidi,
} from "./scales";

describe("SCALES", () => {
  it("has all 8 scales", () => {
    expect(Object.keys(SCALES)).toHaveLength(8);
  });

  it("each scale has between 5 and 7 valid steps within an octave", () => {
    for (const s of Object.values(SCALES)) {
      expect(s.steps.length).toBeGreaterThanOrEqual(5);
      expect(s.steps.length).toBeLessThanOrEqual(7);
      expect(s.steps[0]).toBe(0);
      for (const step of s.steps) {
        expect(step).toBeGreaterThanOrEqual(0);
        expect(step).toBeLessThan(12);
      }
    }
  });

  it("octant order has 8 unique scale names", () => {
    expect(new Set(SCALE_NAMES_BY_OCTANT).size).toBe(8);
  });
});

describe("headingToScale", () => {
  it("0° → first octant scale", () => {
    expect(headingToScale(0)).toBe(SCALE_NAMES_BY_OCTANT[0]);
  });

  it("44° → first octant", () => {
    expect(headingToScale(44.99)).toBe(SCALE_NAMES_BY_OCTANT[0]);
  });

  it("45° → second octant", () => {
    expect(headingToScale(45)).toBe(SCALE_NAMES_BY_OCTANT[1]);
  });

  it("180° → fifth octant", () => {
    expect(headingToScale(180)).toBe(SCALE_NAMES_BY_OCTANT[4]);
  });

  it("359.9° → eighth octant", () => {
    expect(headingToScale(359.9)).toBe(SCALE_NAMES_BY_OCTANT[7]);
  });

  it("wraps 360° to 0°", () => {
    expect(headingToScale(360)).toBe(SCALE_NAMES_BY_OCTANT[0]);
  });

  it("wraps negative input", () => {
    expect(headingToScale(-1)).toBe(SCALE_NAMES_BY_OCTANT[7]);
  });
});

describe("scaleStepToMidi", () => {
  it("step 0 returns root midi at offset 0", () => {
    expect(scaleStepToMidi(SCALES.minorPentatonic, 0, 60, 0)).toBe(60);
  });

  it("octave offset shifts result by 12 semitones", () => {
    expect(scaleStepToMidi(SCALES.minorPentatonic, 0, 60, 1)).toBe(72);
    expect(scaleStepToMidi(SCALES.minorPentatonic, 0, 60, -1)).toBe(48);
  });

  it("step 4 of minor pentatonic = root + 10", () => {
    expect(scaleStepToMidi(SCALES.minorPentatonic, 4, 60, 0)).toBe(70);
  });

  it("step beyond length wraps within scale", () => {
    expect(scaleStepToMidi(SCALES.minorPentatonic, 5, 60, 0))
      .toBe(scaleStepToMidi(SCALES.minorPentatonic, 0, 60, 0));
  });

  it("negative step wraps within scale", () => {
    expect(scaleStepToMidi(SCALES.minorPentatonic, -1, 60, 0))
      .toBe(scaleStepToMidi(SCALES.minorPentatonic, 4, 60, 0));
  });
});
