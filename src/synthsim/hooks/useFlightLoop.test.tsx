import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFlightLoop } from "./useFlightLoop";

let now = 0;
let pending: Array<{ id: number; cb: FrameRequestCallback }> = [];
let nextId = 1;

const advanceFrames = async (count: number) => {
  for (let i = 0; i < count; i++) {
    await act(async () => {
      now += 1000 / 60;
      const cur = pending;
      pending = [];
      for (const { cb } of cur) cb(now);
    });
  }
};

describe("useFlightLoop", () => {
  beforeEach(() => {
    now = 0;
    pending = [];
    nextId = 1;
    vi.stubGlobal("performance", { now: () => now });
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      const id = nextId++;
      pending.push({ id, cb });
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      pending = pending.filter((p) => p.id !== id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not advance state when running=false", async () => {
    const { result } = renderHook(() => useFlightLoop(false));
    const before = result.current.stateRef.current.position.y;
    await advanceFrames(20);
    expect(result.current.stateRef.current.position.y).toBe(before);
  });

  it("advances state when running=true (full throttle accelerates)", async () => {
    const { result } = renderHook(() => useFlightLoop(true));
    result.current.controlsRef.current.throttle = 1;
    result.current.controlsRef.current.elevator = 0.15;
    await advanceFrames(60 * 30);
    const speed = Math.hypot(
      result.current.stateRef.current.velocity.x,
      result.current.stateRef.current.velocity.y,
      result.current.stateRef.current.velocity.z,
    );
    expect(speed).toBeGreaterThan(20);
  });

  it("subscribers receive telemetry updates", async () => {
    const { result } = renderHook(() => useFlightLoop(true));
    const samples: number[] = [];
    const unsubscribe = result.current.subscribe((t) => samples.push(t.airspeedKt));
    result.current.controlsRef.current.throttle = 1;
    await advanceFrames(60 * 5);
    unsubscribe();
    expect(samples.length).toBeGreaterThan(5);
    expect(samples[samples.length - 1]).toBeGreaterThan(samples[0]);
  });

  it("unsubscribe stops new pushes", async () => {
    const { result } = renderHook(() => useFlightLoop(true));
    const seen: number[] = [];
    const unsubscribe = result.current.subscribe((t) => seen.push(t.airspeedKt));
    await advanceFrames(20);
    unsubscribe();
    const sizeAtUnsub = seen.length;
    await advanceFrames(60);
    expect(seen.length).toBe(sizeAtUnsub);
  });

  it("cleans up RAF on unmount", async () => {
    const { unmount } = renderHook(() => useFlightLoop(true));
    await advanceFrames(5);
    const before = pending.length;
    unmount();
    expect(pending.length).toBeLessThanOrEqual(before);
    await advanceFrames(20);
    // No further callbacks should be queued after unmount
    expect(pending.length).toBe(0);
  });
});
