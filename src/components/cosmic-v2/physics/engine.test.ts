import { describe, it, expect } from "vitest";
import { PhysicsEngine, makeSolarSystem, createBody } from "./engine";

describe("PhysicsEngine", () => {
  it("builds a solar system with the expected body mix", () => {
    const bodies = makeSolarSystem({ moonCount: 8, cometCount: 2 });
    const core = bodies.filter(b => b.kind === "core");
    const planets = bodies.filter(b => b.kind === "planet");
    const moons = bodies.filter(b => b.kind === "moon");
    const comets = bodies.filter(b => b.kind === "comet");
    expect(core).toHaveLength(1);
    expect(planets.length).toBe(4);
    expect(moons).toHaveLength(8);
    expect(comets).toHaveLength(2);
    // moons must reference a planet parent
    for (const m of moons) {
      expect(planets.some(p => p.id === m.parentId)).toBe(true);
    }
  });

  it("raises orbitCross events as planets traverse", () => {
    const bodies = makeSolarSystem({ moonCount: 0, cometCount: 0 });
    const eng = new PhysicsEngine(bodies);
    let totalEvents = 0;
    // Sim for ~8 seconds at 60hz
    for (let i = 0; i < 60 * 8; i++) {
      eng.step(1 / 60, i * (1000 / 60));
      totalEvents += eng.drainEvents().length;
    }
    expect(totalEvents).toBeGreaterThan(0);
  });

  it("spawned sparks expire via ttl", () => {
    const bodies = [
      createBody({ kind: "core", pos: [0, 0, 0], mass: 1200, radius: 10, timbre: "drone", color: [1, 1, 1] }),
    ];
    const eng = new PhysicsEngine(bodies);
    eng.spawnSpark({ pos: [200, 0, 0], vel: [0, 0, 0], color: [1, 1, 1], scaleDegree: 0, octave: 5, ttlMs: 500 });
    expect(eng.getBodies()).toHaveLength(2);
    for (let i = 0; i < 60; i++) {
      eng.step(1 / 60, i * (1000 / 60));
    }
    expect(eng.getBodies().some(b => b.kind === "spark")).toBe(false);
  });

  it("respects per-body cooldown to prevent event storms", () => {
    const core = createBody({ kind: "core", pos: [0, 0, 0], mass: 1200, radius: 10, timbre: "drone", color: [1, 1, 1] });
    const eng = new PhysicsEngine([core]);
    // Manually register a planet near core that oscillates through phase zero rapidly
    const planet = createBody({
      kind: "planet",
      pos: [100, 0, 0],
      vel: [0, 0, 10],
      mass: 5,
      timbre: "pad",
      color: [1, 1, 1],
      scaleDegree: 0,
      octave: 3,
    });
    eng.getBodies().push(planet);
    let events = 0;
    for (let i = 0; i < 60 * 3; i++) {
      eng.step(1 / 60, i * (1000 / 60));
      events += eng.drainEvents().length;
    }
    // Cooldown of 80ms means at most ~12 events per second. 3 seconds → ≤ 36.
    expect(events).toBeLessThan(40);
  });
});
