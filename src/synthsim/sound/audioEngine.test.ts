import { beforeEach, describe, expect, it, vi } from "vitest";

const { made, transport } = vi.hoisted(() => ({
  made: {} as Record<string, any[]>,
  transport: {
    bpm: { value: 0, rampTo: vi.fn() },
    scheduleRepeat: vi.fn(() => 0),
    schedule: vi.fn(() => 0),
    start: vi.fn(),
    stop: vi.fn(),
    clear: vi.fn(),
  },
}));

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
      volume: { value: 0, rampTo: v.fn() },
      frequency: param(),
      pan: param(),
      wet: param(),
    };
    node.connect = v.fn(() => node);
    node.chain = v.fn(() => node);
    node.toDestination = v.fn(() => node);
    node.start = v.fn(() => node);
    (made[kind] ||= []).push(node);
    return node;
  };
  const Ctor = (kind: string) => v.fn().mockImplementation(() => makeNode(kind));
  const destination = makeNode("Destination");
  let id = 1;
  transport.scheduleRepeat = v.fn(() => id++);
  transport.schedule = v.fn(() => id++);

  return {
    PolySynth: Ctor("PolySynth"),
    Synth: Ctor("Synth"),
    MembraneSynth: Ctor("MembraneSynth"),
    MetalSynth: Ctor("MetalSynth"),
    Filter: Ctor("Filter"),
    Freeverb: Ctor("Freeverb"),
    FeedbackDelay: Ctor("FeedbackDelay"),
    Chorus: Ctor("Chorus"),
    Compressor: Ctor("Compressor"),
    Limiter: Ctor("Limiter"),
    LFO: Ctor("LFO"),
    Volume: Ctor("Volume"),
    Panner: Ctor("Panner"),
    Distortion: Ctor("Distortion"),
    BitCrusher: Ctor("BitCrusher"),
    Vibrato: Ctor("Vibrato"),
    getDestination: () => destination,
    Transport: transport,
    Frequency: (n: number) => ({ toFrequency: () => 440 * Math.pow(2, (n - 69) / 12) }),
    start: v.fn(async () => undefined),
    now: () => 0,
  };
});

import { createSoundEngine } from "./audioEngine";

const last = (kind: string) => {
  const list = made[kind];
  if (!list || list.length === 0) throw new Error(`no mock node of kind ${kind}`);
  return list[list.length - 1];
};

beforeEach(() => {
  Object.keys(made).forEach((k) => (made[k].length = 0));
  transport.bpm.value = 0;
  transport.bpm.rampTo = vi.fn();
  transport.scheduleRepeat = vi.fn((..._args: unknown[]) => Math.random());
  transport.start = vi.fn();
  transport.stop = vi.fn();
  transport.clear = vi.fn();
});

describe("createSoundEngine — lazy init", () => {
  it("does not build any Tone nodes until start() is called", () => {
    createSoundEngine();
    expect(made.PolySynth ?? []).toHaveLength(0);
    expect(made.Freeverb ?? []).toHaveLength(0);
  });

  it("isReady() is false before start()", () => {
    const eng = createSoundEngine();
    expect(eng.isReady()).toBe(false);
  });
});

describe("createSoundEngine — start()", () => {
  it("constructs the full graph: every voice + FX node + master path", async () => {
    const eng = createSoundEngine();
    await eng.start();
    expect(made.PolySynth).toHaveLength(1);
    expect(made.MembraneSynth).toHaveLength(1);
    expect(made.MetalSynth).toHaveLength(1);
    expect(made.Filter?.length).toBeGreaterThanOrEqual(2);
    expect(made.Freeverb).toHaveLength(1);
    expect(made.FeedbackDelay).toHaveLength(1);
    expect(made.Chorus).toHaveLength(1);
    expect(made.Vibrato).toHaveLength(1);
    expect(made.Distortion).toHaveLength(1);
    expect(made.BitCrusher).toHaveLength(1);
    expect(made.Compressor).toHaveLength(1);
    expect(made.Limiter).toHaveLength(1);
    expect(made.Panner).toHaveLength(1);
    expect(made.Volume?.length).toBeGreaterThanOrEqual(3);
    expect(eng.isReady()).toBe(true);
  });

  it("schedules three Transport repeats (kick, hat, lead arp) and starts Transport", async () => {
    const eng = createSoundEngine();
    await eng.start();
    expect(transport.scheduleRepeat).toHaveBeenCalledTimes(3);
    expect(transport.start).toHaveBeenCalled();
  });

  it("triggers sustained drone + sub voices on start", async () => {
    const eng = createSoundEngine();
    await eng.start();
    const synths = made.Synth ?? [];
    const triggered = synths.filter((n) => (n.triggerAttack as any).mock.calls.length > 0);
    expect(triggered.length).toBeGreaterThanOrEqual(2);
  });
});

describe("createSoundEngine — continuous setters ramp", () => {
  it("setMasterGainDb ramps masterVolume.volume", async () => {
    const eng = createSoundEngine();
    await eng.start();
    eng.setMasterGainDb(-12, 0.1);
    const masterVol = (made.Volume ?? []).at(-1);
    expect(masterVol?.volume.rampTo).toHaveBeenCalledWith(-12, 0.1);
  });

  it("setMasterPan ramps panner.pan", async () => {
    const eng = createSoundEngine();
    await eng.start();
    eng.setMasterPan(0.5, 0.08);
    expect(last("Panner").pan.rampTo).toHaveBeenCalledWith(0.5, 0.08);
  });

  it("setLeadFilterCutoff ramps the lead filter", async () => {
    const eng = createSoundEngine();
    await eng.start();
    eng.setLeadFilterCutoff(2400, 0.08);
    const filters = made.Filter ?? [];
    const calls = filters.flatMap((f) => (f.frequency.rampTo as any).mock.calls);
    expect(calls).toContainEqual([2400, 0.08]);
  });

  it("setReverbWet ramps reverb.wet", async () => {
    const eng = createSoundEngine();
    await eng.start();
    eng.setReverbWet(0.45, 0.2);
    expect(last("Freeverb").wet.rampTo).toHaveBeenCalledWith(0.45, 0.2);
  });

  it("setDelayWet ramps delay.wet", async () => {
    const eng = createSoundEngine();
    await eng.start();
    eng.setDelayWet(0.14, 0.2);
    expect(last("FeedbackDelay").wet.rampTo).toHaveBeenCalledWith(0.14, 0.2);
  });

  it("setVibratoRate ramps vibrato.frequency", async () => {
    const eng = createSoundEngine();
    await eng.start();
    eng.setVibratoRate(6, 0.1);
    expect(last("Vibrato").frequency.rampTo).toHaveBeenCalledWith(6, 0.1);
  });

  it("setDistortionWet ramps distortion.wet", async () => {
    const eng = createSoundEngine();
    await eng.start();
    eng.setDistortionWet(0.7, 0.08);
    expect(last("Distortion").wet.rampTo).toHaveBeenCalledWith(0.7, 0.08);
  });

  it("setBitcrusherWet ramps bitcrusher.wet", async () => {
    const eng = createSoundEngine();
    await eng.start();
    eng.setBitcrusherWet(0.6, 0.08);
    expect(last("BitCrusher").wet.rampTo).toHaveBeenCalledWith(0.6, 0.08);
  });

  it("setBpm ramps Transport.bpm", async () => {
    const eng = createSoundEngine();
    await eng.start();
    eng.setBpm(120, 0.2);
    expect(transport.bpm.rampTo).toHaveBeenCalledWith(120, 0.2);
  });

  it("ramping setters are no-ops before start()", () => {
    const eng = createSoundEngine();
    expect(() => eng.setMasterGainDb(-20, 0.1)).not.toThrow();
    expect(() => eng.setReverbWet(0.5, 0.2)).not.toThrow();
  });
});

describe("createSoundEngine — discrete state setters", () => {
  it("setLeadOctaveOffset and setLeadScale do not throw before or after start", async () => {
    const eng = createSoundEngine();
    eng.setLeadOctaveOffset(2);
    eng.setLeadScale("dorian");
    await eng.start();
    eng.setLeadOctaveOffset(3);
    eng.setLeadScale("ionian");
  });
});

describe("createSoundEngine — dispose()", () => {
  it("calls dispose on every node and stops Transport", async () => {
    const eng = createSoundEngine();
    await eng.start();
    eng.dispose();
    const everyNode = ([] as any[]).concat(
      ...Object.entries(made)
        .filter(([k]) => k !== "Destination")
        .map(([, list]) => list),
    );
    for (const node of everyNode) {
      expect(node.dispose).toHaveBeenCalled();
    }
    expect(transport.stop).toHaveBeenCalled();
    expect(eng.isReady()).toBe(false);
  });

  it("dispose() clears scheduled Transport events", async () => {
    const eng = createSoundEngine();
    await eng.start();
    eng.dispose();
    expect(transport.clear).toHaveBeenCalledTimes(3);
  });

  it("dispose() before start is a no-op", () => {
    const eng = createSoundEngine();
    expect(() => eng.dispose()).not.toThrow();
    expect(eng.isReady()).toBe(false);
  });
});
