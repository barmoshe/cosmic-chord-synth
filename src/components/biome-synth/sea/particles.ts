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
      alive: false, kind: 0,
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
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const s = rand(1.0, 2.5) * vel;
    p.x = x; p.y = y;
    p.vx = Math.cos(a) * s * 0.5;
    p.vy = Math.sin(a) * s * 0.4 - rand(1.2, 2.6);
    p.maxLife = rand(60, 110);
    p.life = p.maxLife;
    p.col = col;
    p.rot = a;
    p.vr = rand(-0.05, 0.05);
    p.kind = Math.random() < 0.6 ? 1 : 0;
    p.alive = true;
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, pool: Particle[]) {
  for (const p of pool) {
    if (!p.alive) continue;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04;
    p.vx *= 0.985;
    p.rot += p.vr;
    p.life -= 1;
    if (p.life <= 0) { p.alive = false; continue; }
    const t = p.life / p.maxLife;
    const alpha = Math.min(1, t * 1.3);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgb(${Math.floor(p.col[0] * 255)},${Math.floor(p.col[1] * 255)},${Math.floor(p.col[2] * 255)})`;
    if (p.kind === 1) {
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, 1.4, p.rot, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
