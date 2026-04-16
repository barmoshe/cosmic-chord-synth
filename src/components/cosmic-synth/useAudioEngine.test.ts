import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ---------- Tone.js mock ----------
// Shared state is declared with vi.hoisted so it's available inside the
// hoisted vi.mock factory. Each constructor pushes the created mock into
// `made[kind]` so tests can assert on trigger* calls.
const { made } = vi.hoisted(() => ({ made: {} as Record<string, any[]> }));

vi.mock("tone", async () => {
  const { vi: v } = await import("vitest");
  const param = () => ({ value: 0, rampTo: v.fn() });
  const makeNode = (kind: string) => {
    const node: any = {
      kind,
      triggerAttack: v.fn(),
      triggerRelease: v.fn(),
      triggerAttackRelease: v.fn(),
      releaseAll: v.fn(),
      set: v.fn(),
      dispose: v.fn(),
      volume: param(),
      frequency: param(),
      wet: param(),
      ready: Promise.resolve(),
      getValue: v.fn(() => new Float32Array(128)),
    };
    node.connect = v.fn(() => node);
    node.toDestination = v.fn(() => node);
    node.start = v.fn(() => node);
    (made[kind] ||= []).push(node);
    return node;
  };
  const Ctor = (kind: string) => v.fn().mockImplementation(() => makeNode(kind));
  const destination = makeNode("Destination");
  return {
    PolySynth: Ctor("PolySynth"),
    Synth: v.fn(),
    MembraneSynth: Ctor("MembraneSynth"),
    NoiseSynth: Ctor("NoiseSynth"),
    MetalSynth: Ctor("MetalSynth"),
    Filter: Ctor("Filter"),
    Reverb: Ctor("Reverb"),
    PingPongDelay: Ctor("PingPongDelay"),
    Chorus: Ctor("Chorus"),
    Compressor: Ctor("Compressor"),
    Limiter: Ctor("Limiter"),
    FFT: Ctor("FFT"),
    LFO: Ctor("LFO"),
    getDestination: () => destination,
    now: () => 0,
  };
});

import { useAudioEngine } from "./useAudioEngine";
import { m2f } from "./helpers";

function last(kind: string): any {
  const list = made[kind];
  if (!list || list.length === 0) throw new Error(`no mock node of kind ${kind}`);
  return list[list.length - 1];
}

function allOf(kind: string): any[] {
  return made[kind] || [];
}

beforeEach(() => {
  Object.keys(made).forEach(k => (made[k].length = 0));
  Object.defineProperty(window, "innerWidth", { value: 1000, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: 1000, configurable: true });
});

describe("useAudioEngine", () => {
  it("start() builds the graph and isReady() becomes true", async () => {
    const { result } = renderHook(() => useAudioEngine());
    expect(result.current.engine.current?.isReady()).toBe(false);
    await act(async () => {
      const ok = await result.current.engine.current!.start();
      expect(ok).toBe(true);
    });
    expect(result.current.engine.current?.isReady()).toBe(true);
    // 6 PolySynths: lead, sub, pad, bass, arp, drone
    expect(allOf("PolySynth")).toHaveLength(6);
    // 1 reverb, 1 ping-pong delay
    expect(allOf("Reverb")).toHaveLength(1);
    expect(allOf("PingPongDelay")).toHaveLength(1);
  });

  it("noteOn(60, 0.7) triggers lead + sub with correct frequencies", async () => {
    const { result } = renderHook(() => useAudioEngine());
    await act(async () => { await result.current.engine.current!.start(); });
    const [lead, sub] = allOf("PolySynth");
    act(() => { result.current.engine.current!.noteOn(60, 0.7, 100, 100); });
    expect(lead.triggerAttack).toHaveBeenCalledWith(m2f(60), expect.any(Number), 0.7);
    expect(sub.triggerAttack).toHaveBeenCalledWith(m2f(48), expect.any(Number), 0.35);
  });

  it("noteOff(60) releases the attached lead/sub voice", async () => {
    const { result } = renderHook(() => useAudioEngine());
    await act(async () => { await result.current.engine.current!.start(); });
    const [lead, sub] = allOf("PolySynth");
    act(() => {
      result.current.engine.current!.noteOn(60, 0.7, 100, 100);
      result.current.engine.current!.noteOff(60);
    });
    expect(lead.triggerRelease).toHaveBeenCalledWith(m2f(60), expect.any(Number));
    expect(sub.triggerRelease).toHaveBeenCalledWith(m2f(48), expect.any(Number));
  });

  it("triggerDrum dispatches with per-instrument signatures", async () => {
    const { result } = renderHook(() => useAudioEngine());
    await act(async () => { await result.current.engine.current!.start(); });
    const kick = last("MembraneSynth");
    const [snare, clap] = allOf("NoiseSynth");
    const hihat = last("MetalSynth");

    act(() => {
      result.current.engine.current!.triggerDrum("kick", 0.9);
      result.current.engine.current!.triggerDrum("snare", 0.8);
      result.current.engine.current!.triggerDrum("hat", 1.0);
      result.current.engine.current!.triggerDrum("clap", 0.6);
    });

    expect(kick.triggerAttackRelease).toHaveBeenCalledWith("C1", "8n", undefined, 0.9);
    expect(snare.triggerAttackRelease).toHaveBeenCalledWith("16n", undefined, 0.8);
    expect(hihat.triggerAttackRelease).toHaveBeenCalledWith("C2", "32n", undefined, 0.6);
    expect(clap.triggerAttackRelease).toHaveBeenCalledWith("16n", undefined, 0.6);
  });

  it("triggerPadChord releases then re-attacks pad", async () => {
    const { result } = renderHook(() => useAudioEngine());
    await act(async () => { await result.current.engine.current!.start(); });
    const [, , pad] = allOf("PolySynth");
    act(() => { result.current.engine.current!.triggerPadChord([60, 64, 67], 5, 0.3); });
    expect(pad.releaseAll).toHaveBeenCalledWith(5);
    expect(pad.triggerAttack).toHaveBeenCalledWith([m2f(60), m2f(64), m2f(67)], 5, 0.3);
  });

  it("dispose() disposes every created node and flips isReady to false", async () => {
    const { result } = renderHook(() => useAudioEngine());
    await act(async () => { await result.current.engine.current!.start(); });
    const snapshot = Object.values(made).flat();
    act(() => { result.current.engine.current!.dispose(); });
    for (const n of snapshot) {
      expect(n.dispose).toHaveBeenCalled();
    }
    expect(result.current.engine.current?.isReady()).toBe(false);
  });
});
