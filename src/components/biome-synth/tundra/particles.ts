import { PARTICLE_POOL } from "../shared/constants";
import { rand } from "./utils";
import type { Particle, RGB } from "./types";

export interface ParticlePool {
  pool: Particle[];
  cursor: number;
}

export function createParticlePool(): ParticlePool {
  return {
    pool: Array.from({ length: PARTICLE_POOL }, () => ({
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 1,
      col: [0, 0, 0], colRgb: "rgb(0,0,0)", rot: 0, vr: 0,
      kind: 0, alive: false,
    })),
    cursor: 0,
  };
}

export function spawnParticles(
  pp: ParticlePool,
  x: number, y: number,
  col: RGB, count: number, vel: number,
) {
  const colRgb = `rgb(${Math.floor(col[0] * 255)},${Math.floor(col[1] * 255)},${Math.floor(col[2] * 255)})`;
  for (let i = 0; i < count; i++) {
    const p = pp.pool[pp.cursor];
    pp.cursor = (pp.cursor + 1) % pp.pool.length;
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const s = rand(1.6, 3.2) * vel;
    p.x = x; p.y = y;
    p.vx = Math.cos(a) * s;
    p.vy = Math.sin(a) * s * 0.7 - rand(0.4, 1.4);
    p.maxLife = rand(70, 130);
    p.life = p.maxLife;
    p.col = col;
    p.colRgb = colRgb;
    p.rot = a;
    p.vr = (i % 2 === 0 ? 1 : -1) * rand(0.05, 0.18);
    p.kind = Math.random() < 0.55 ? 1 : 0; // 1 = flake, 0 = spark
    p.alive = true;
  }
}

// White sparkles + mini flakes. Two-pass batched render: sparks first as a
// single fill path (one beginPath/fill per alpha bucket), flakes second with
// rotation. Shadow blur is dropped — bright white on the cool sky reads
// without it, and shadowBlur per particle was the dominant per-frame cost
// when many particles were alive after rapid drum hits.
const ALPHA_LEVELS = [0.25, 0.45, 0.65, 0.85];
function bucketAlpha(a: number): number {
  if (a < 0.35) return 0;
  if (a < 0.55) return 1;
  if (a < 0.75) return 2;
  return 3;
}

export function drawParticles(ctx: CanvasRenderingContext2D, pool: Particle[], high: number) {
  const hiBoost = 1 + high * 0.5;

  // Step physics + cull dead in one pass.
  for (const p of pool) {
    if (!p.alive) continue;
    p.x += p.vx * hiBoost;
    p.y += p.vy * hiBoost;
    p.vy += 0.05;
    p.vx *= 0.988;
    p.rot += p.vr;
    p.life -= 1;
    if (p.life <= 0) p.alive = false;
  }

  ctx.save();
  ctx.fillStyle = "#ffffff";

  // Pass 1 — sparks (kind 0) as filled circles, batched by alpha bucket.
  for (let b = 0; b < ALPHA_LEVELS.length; b++) {
    let started = false;
    for (const p of pool) {
      if (!p.alive || p.kind !== 0) continue;
      const t = p.life / p.maxLife;
      const a = Math.min(1, t * 1.3);
      if (bucketAlpha(a) !== b) continue;
      if (!started) {
        ctx.globalAlpha = ALPHA_LEVELS[b];
        ctx.beginPath();
        started = true;
      }
      ctx.moveTo(p.x + 1.8, p.y);
      ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
    }
    if (started) ctx.fill();
  }

  // Pass 2 — flakes (kind 1) with three crossed strokes; batched by alpha.
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  for (let b = 0; b < ALPHA_LEVELS.length; b++) {
    let started = false;
    for (const p of pool) {
      if (!p.alive || p.kind !== 1) continue;
      const t = p.life / p.maxLife;
      const a = Math.min(1, t * 1.3);
      if (bucketAlpha(a) !== b) continue;
      if (!started) {
        ctx.globalAlpha = ALPHA_LEVELS[b];
        ctx.beginPath();
        started = true;
      }
      const r = 4;
      const c = Math.cos(p.rot), s = Math.sin(p.rot);
      // three crossed strokes spaced by 60°: rotations rot, rot+60°, rot+120°.
      // Precompute via angle-add identities to avoid 3x trig per particle.
      const c60 = 0.5,    s60 = 0.8660254;
      const c120 = -0.5,  s120 = 0.8660254;
      const x0 = c * r,             y0 = s * r;
      const x1 = (c * c60 - s * s60) * r,   y1 = (s * c60 + c * s60) * r;
      const x2 = (c * c120 - s * s120) * r, y2 = (s * c120 + c * s120) * r;
      ctx.moveTo(p.x - x0, p.y - y0); ctx.lineTo(p.x + x0, p.y + y0);
      ctx.moveTo(p.x - x1, p.y - y1); ctx.lineTo(p.x + x1, p.y + y1);
      ctx.moveTo(p.x - x2, p.y - y2); ctx.lineTo(p.x + x2, p.y + y2);
    }
    if (started) ctx.stroke();
  }

  ctx.restore();
}
