import type { Body, FieldImpulse, PhysicsEvent, Vec3 } from "./types";

// Per-body cooldown between note-triggering events (ms). Prevents event storms.
const BODY_EVENT_COOLDOWN_MS = 80;
// Global event ceiling per second — bridge drains this buffer each frame.
const GLOBAL_EVENT_CEILING = 24;

export interface PhysicsConfig {
  gravityStrength: number;
  dragFactor: number;
  softening: number;
  proximityThreshold: number;
  bounds: number;
}

export const DEFAULT_CONFIG: PhysicsConfig = {
  gravityStrength: 260,
  dragFactor: 0.998,
  // Larger softening kills close-approach force spikes that were popping
  // moons to huge velocities and making them teleport.
  softening: 10,
  proximityThreshold: 14,
  bounds: 620,
};

// Hard ceiling on per-body speed — prevents a single unlucky integration step
// from hurling a body across the scene in one frame.
const MAX_SPEED = 140;

let nextId = 1;

export function createBody(partial: Partial<Body> & Pick<Body, "kind" | "pos" | "timbre" | "color">): Body {
  return {
    id: nextId++,
    vel: [0, 0, 0],
    acc: [0, 0, 0],
    mass: 1,
    radius: 3,
    scaleDegree: 0,
    octave: 4,
    lastNoteAt: -Infinity,
    orbitPhase: 0,
    prevOrbitPhase: 0,
    age: 0,
    ...partial,
  };
}

export function makeSolarSystem(opts: {
  moonCount?: number;
  cometCount?: number;
}): Body[] {
  const { moonCount = 8, cometCount = 2 } = opts;
  const bodies: Body[] = [];

  // Core — stationary attractor (driven drone)
  bodies.push(createBody({
    kind: "core",
    pos: [0, 0, 0],
    mass: 1200,
    radius: 12,
    timbre: "drone",
    scaleDegree: 0,
    octave: 2,
    color: [0.98, 0.84, 0.32],
  }));

  // Planets — 4 in a spread of orbits
  const planetOrbits = [120, 180, 260, 340];
  const planetColors: Vec3[] = [
    [0.12, 0.78, 0.72],
    [0.35, 0.85, 0.93],
    [0.58, 0.55, 0.97],
    [0.98, 0.6, 0.4],
  ];
  for (let i = 0; i < planetOrbits.length; i++) {
    const r = planetOrbits[i];
    const angle = (i / planetOrbits.length) * Math.PI * 2 + Math.random() * 0.3;
    const v = Math.sqrt(DEFAULT_CONFIG.gravityStrength * 1200 / r);
    const planet = createBody({
      kind: "planet",
      pos: [Math.cos(angle) * r, (Math.random() - 0.5) * 20, Math.sin(angle) * r],
      vel: [-Math.sin(angle) * v, 0, Math.cos(angle) * v],
      mass: 10 + Math.random() * 20,
      radius: 5 + Math.random() * 3,
      scaleDegree: i % 5,
      octave: 3,
      timbre: i % 2 === 0 ? "pad" : "bass",
      color: planetColors[i],
    });
    bodies.push(planet);
  }

  // Moons — orbit random planets. Tight radii keep orbital periods short so
  // the bridge hears frequent orbit-cross events and the piece has a
  // continuous melodic layer.
  const planets = bodies.filter(b => b.kind === "planet");
  for (let i = 0; i < moonCount; i++) {
    const parent = planets[Math.floor(Math.random() * planets.length)];
    const r = 18 + Math.random() * 22;
    const angle = Math.random() * Math.PI * 2;
    const v = Math.sqrt(DEFAULT_CONFIG.gravityStrength * parent.mass / r);
    bodies.push(createBody({
      kind: "moon",
      pos: [parent.pos[0] + Math.cos(angle) * r, (Math.random() - 0.5) * 10, parent.pos[2] + Math.sin(angle) * r],
      vel: [parent.vel[0] - Math.sin(angle) * v, 0, parent.vel[2] + Math.cos(angle) * v],
      mass: 0.5 + Math.random() * 2,
      radius: 1.8 + Math.random() * 1.2,
      parentId: parent.id,
      scaleDegree: Math.floor(Math.random() * 5),
      octave: 4 + Math.floor(Math.random() * 2),
      timbre: Math.random() < 0.5 ? "lead" : "arp",
      color: [
        Math.min(1, parent.color[0] + 0.15),
        Math.min(1, parent.color[1] + 0.15),
        Math.min(1, parent.color[2] + 0.15),
      ],
    }));
  }

  // Comets — eccentric orbits
  for (let i = 0; i < cometCount; i++) {
    const r = 420 + Math.random() * 120;
    const angle = Math.random() * Math.PI * 2;
    const v = Math.sqrt(DEFAULT_CONFIG.gravityStrength * 1200 / r) * 0.55;
    bodies.push(createBody({
      kind: "comet",
      pos: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
      vel: [-Math.sin(angle) * v, 0, Math.cos(angle) * v],
      mass: 0.8,
      radius: 2,
      scaleDegree: 0,
      octave: 5,
      timbre: "arp",
      color: [0.96, 0.96, 0.98],
    }));
  }

  return bodies;
}

function addAcc(a: Vec3, dx: number, dy: number, dz: number) {
  a[0] += dx; a[1] += dy; a[2] += dz;
}

export interface SpawnSparkOpts {
  pos: Vec3;
  vel: Vec3;
  color: Vec3;
  scaleDegree: number;
  octave: number;
  ttlMs?: number;
}

export class PhysicsEngine {
  bodies: Body[];
  private fields: FieldImpulse[] = [];
  private events: PhysicsEvent[] = [];
  private globalBias: Vec3 = [0, 0, 0];
  private lastGlobalEventWindowStart = 0;
  private eventsInWindow = 0;
  private bodiesInNebula: Set<number> = new Set();
  private config: PhysicsConfig;

  constructor(initial: Body[], config: Partial<PhysicsConfig> = {}) {
    this.bodies = initial;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getBodies() { return this.bodies; }
  drainEvents(): PhysicsEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  setGravityBias(x: number, y: number, z: number) {
    this.globalBias[0] = x;
    this.globalBias[1] = y;
    this.globalBias[2] = z;
  }

  addField(field: FieldImpulse) {
    this.fields.push(field);
  }

  spawnSpark(opts: SpawnSparkOpts): Body {
    const body = createBody({
      kind: "spark",
      pos: [...opts.pos] as Vec3,
      vel: [...opts.vel] as Vec3,
      mass: 0.1,
      radius: 1.2,
      scaleDegree: opts.scaleDegree,
      octave: opts.octave,
      timbre: "arp",
      color: opts.color,
      ttl: (opts.ttlMs ?? 8000) / 1000,
    });
    this.bodies.push(body);
    return body;
  }

  step(dt: number, now: number) {
    const G = this.config.gravityStrength;
    const soft = this.config.softening;
    const bias = this.globalBias;
    const bounds = this.config.bounds;

    // Reset acc + apply global bias (gyro)
    for (const b of this.bodies) {
      b.acc[0] = bias[0];
      b.acc[1] = bias[1];
      b.acc[2] = bias[2];
    }

    // Gravity: every non-core body pulled to core and parent (if any)
    const core = this.bodies[0];
    for (let i = 1; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      // Attract to core
      const dx = core.pos[0] - b.pos[0];
      const dy = core.pos[1] - b.pos[1];
      const dz = core.pos[2] - b.pos[2];
      const r2 = dx * dx + dy * dy + dz * dz + soft * soft;
      const inv = 1 / Math.sqrt(r2);
      const a = (G * core.mass) / r2;
      addAcc(b.acc, dx * inv * a, dy * inv * a, dz * inv * a);

      // Attract to parent (for moons)
      if (b.parentId !== undefined) {
        const parent = this.bodies.find(p => p.id === b.parentId);
        if (parent) {
          const pdx = parent.pos[0] - b.pos[0];
          const pdy = parent.pos[1] - b.pos[1];
          const pdz = parent.pos[2] - b.pos[2];
          const pr2 = pdx * pdx + pdy * pdy + pdz * pdz + soft * soft;
          const pinv = 1 / Math.sqrt(pr2);
          const pa = (G * parent.mass * 0.7) / pr2;
          addAcc(b.acc, pdx * pinv * pa, pdy * pinv * pa, pdz * pinv * pa);
        }
      }
    }

    // Touch fields
    for (let f = this.fields.length - 1; f >= 0; f--) {
      const field = this.fields[f];
      field.age += dt;
      if (field.age >= field.ttl) {
        this.fields.splice(f, 1);
        continue;
      }
      const falloff = 1 - field.age / field.ttl;
      const sign = field.mode === "attract" ? 1 : -1;
      for (const b of this.bodies) {
        if (b.kind === "core") continue;
        const dx = field.pos[0] - b.pos[0];
        const dy = field.pos[1] - b.pos[1];
        const dz = field.pos[2] - b.pos[2];
        const r2 = dx * dx + dy * dy + dz * dz + soft * soft;
        if (r2 > field.radius * field.radius) continue;
        const inv = 1 / Math.sqrt(r2);
        const a = sign * field.strength * falloff;
        addAcc(b.acc, dx * inv * a, dy * inv * a, dz * inv * a);
      }
    }

    // Integrate + detect orbit-cross events
    const drag = this.config.dragFactor;
    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      if (b.kind === "core") { b.age += dt; continue; }

      b.vel[0] = (b.vel[0] + b.acc[0] * dt) * drag;
      b.vel[1] = (b.vel[1] + b.acc[1] * dt) * drag;
      b.vel[2] = (b.vel[2] + b.acc[2] * dt) * drag;

      // Clamp per-body speed so a force spike can't teleport the body.
      const sp2 = b.vel[0] * b.vel[0] + b.vel[1] * b.vel[1] + b.vel[2] * b.vel[2];
      if (sp2 > MAX_SPEED * MAX_SPEED) {
        const s = MAX_SPEED / Math.sqrt(sp2);
        b.vel[0] *= s; b.vel[1] *= s; b.vel[2] *= s;
      }

      b.pos[0] += b.vel[0] * dt;
      b.pos[1] += b.vel[1] * dt;
      b.pos[2] += b.vel[2] * dt;

      b.age += dt;

      // Soft bounds — apply a radial spring when the body overshoots instead
      // of hard-reflecting, which was visibly popping the position each tick.
      const distSq = b.pos[0] * b.pos[0] + b.pos[1] * b.pos[1] + b.pos[2] * b.pos[2];
      if (distSq > bounds * bounds) {
        const d = Math.sqrt(distSq);
        const overshoot = d - bounds;
        const nx = b.pos[0] / d, ny = b.pos[1] / d, nz = b.pos[2] / d;
        // Pull acceleration back toward origin, scaled by how far past bounds.
        const pull = 8 * overshoot;
        b.vel[0] -= nx * pull * dt;
        b.vel[1] -= ny * pull * dt;
        b.vel[2] -= nz * pull * dt;
        // Damp outward component to bleed energy without a discontinuity.
        const vdotn = b.vel[0] * nx + b.vel[1] * ny + b.vel[2] * nz;
        if (vdotn > 0) {
          b.vel[0] -= vdotn * nx * 0.4;
          b.vel[1] -= vdotn * ny * 0.4;
          b.vel[2] -= vdotn * nz * 0.4;
        }
      }

      // Orbit phase (XZ plane) — fires on angle crossing 0 or π (2 notes/orbit)
      const ref = b.parentId !== undefined
        ? this.bodies.find(p => p.id === b.parentId) ?? core
        : core;
      const lx = b.pos[0] - ref.pos[0];
      const lz = b.pos[2] - ref.pos[2];
      b.prevOrbitPhase = b.orbitPhase;
      b.orbitPhase = Math.atan2(lz, lx);

      const prev = b.prevOrbitPhase, cur = b.orbitPhase;
      const crossedZero = (prev < 0 && cur >= 0) || (prev >= 0 && cur < 0 && Math.abs(prev - cur) > Math.PI);
      const crossedPi = Math.sign(prev) !== Math.sign(cur) && Math.abs(prev) > Math.PI / 2 && Math.abs(cur) > Math.PI / 2;

      if ((crossedZero || crossedPi) && b.age > 0.5) {
        const speed = Math.hypot(b.vel[0], b.vel[1], b.vel[2]);
        this.raiseEvent({ kind: "orbitCross", time: now, body: b, speed });
      }

      // Comet perihelion — lowest distance in a sweep
      if (b.kind === "comet") {
        const d = Math.hypot(lx, lz);
        if (d < 120 && (now - b.lastNoteAt) > 3500) {
          this.raiseEvent({ kind: "perihelion", time: now, body: b, speed: Math.hypot(b.vel[0], b.vel[2]) });
        }
      }
    }

    // Proximity + collisions (only check moons↔sparks to save cycles)
    for (let i = 1; i < this.bodies.length; i++) {
      const a = this.bodies[i];
      if (a.kind === "core") continue;
      for (let j = i + 1; j < this.bodies.length; j++) {
        const c = this.bodies[j];
        if (c.kind === "core") continue;
        // Skip same-parent moons (too busy) unless one is spark
        if (a.parentId && a.parentId === c.parentId && a.kind !== "spark" && c.kind !== "spark") continue;

        const dx = a.pos[0] - c.pos[0];
        const dy = a.pos[1] - c.pos[1];
        const dz = a.pos[2] - c.pos[2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const touchDist = a.radius + c.radius;

        if (d < touchDist) {
          const rv = Math.hypot(a.vel[0] - c.vel[0], a.vel[1] - c.vel[1], a.vel[2] - c.vel[2]);
          this.raiseEvent({ kind: "collision", time: now, body: a, otherId: c.id, speed: rv, distance: d });
          // Absorb sparks on collision
          if (a.kind === "spark") a.ttl = 0;
          if (c.kind === "spark") c.ttl = 0;
        } else if (d < touchDist + this.config.proximityThreshold) {
          if (now - a.lastNoteAt > 1400 && now - c.lastNoteAt > 1400) {
            this.raiseEvent({ kind: "proximity", time: now, body: a, otherId: c.id, distance: d });
          }
        }
      }
    }

    // TTL cleanup
    for (let i = this.bodies.length - 1; i >= 0; i--) {
      const b = this.bodies[i];
      if (b.ttl !== undefined && b.age > b.ttl) {
        this.bodies.splice(i, 1);
      }
    }
  }

  private raiseEvent(ev: PhysicsEvent) {
    const now = ev.time;
    // Per-body cooldown
    if (now - ev.body.lastNoteAt < BODY_EVENT_COOLDOWN_MS) return;
    // Global ceiling (rolling 1s window)
    if (now - this.lastGlobalEventWindowStart > 1000) {
      this.lastGlobalEventWindowStart = now;
      this.eventsInWindow = 0;
    }
    if (this.eventsInWindow >= GLOBAL_EVENT_CEILING) {
      // Keep collisions; drop everything else at the ceiling
      if (ev.kind !== "collision") return;
    }
    ev.body.lastNoteAt = now;
    this.eventsInWindow++;
    this.events.push(ev);
  }
}
