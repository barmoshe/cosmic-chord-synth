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
      col: [0, 0, 0], rot: 0, vr: 0,
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
  for (let i = 0; i < count; i++) {
    const p = pp.pool[pp.cursor];
    pp.cursor = (pp.cursor + 1) % pp.pool.length;
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const s = rand(1.6, 3.2) * vel;
    p.x = x; p.y = y;
    p.vx = Math.cos(a) * s;
    p.vy = Math.sin(a) * s * 0.6 - rand(0.8, 2.0);
    p.maxLife = rand(70, 120);
    p.life = p.maxLife;
    p.col = col;
    p.rot = a;
    p.vr = (i % 2 === 0 ? 1 : -1) * rand(0.04, 0.14);
    p.kind = Math.random() < 0.55 ? 1 : 0; // more petals, fewer leaves
    p.alive = true;
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, pool: Particle[], high: number) {
  const hiBoost = 1 + high * 0.6;
  for (const p of pool) {
    if (!p.alive) continue;
    p.x += p.vx * hiBoost;
    p.y += p.vy * hiBoost;
    p.vy += 0.08; // gravity
    p.vx *= 0.985;
    p.rot += p.vr;
    p.life -= 1;
    if (p.life <= 0) { p.alive = false; continue; }
    const t = p.life / p.maxLife;
    const alpha = Math.min(1, t * 1.3);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = alpha;
    if (p.kind === 1) {
      // flower petal
      ctx.fillStyle = `rgb(${Math.floor(p.col[0] * 255)},${Math.floor(p.col[1] * 255)},${Math.floor(p.col[2] * 255)})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // leaf
      ctx.fillStyle = `rgb(${Math.floor(p.col[0] * 255)},${Math.floor(p.col[1] * 255)},${Math.floor(p.col[2] * 255)})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 2.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
