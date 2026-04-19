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
    const s = rand(1.6, 3.2) * vel;
    p.x = x; p.y = y;
    p.vx = Math.cos(a) * s;
    p.vy = Math.sin(a) * s - rand(0.4, 1.2);
    p.maxLife = rand(50, 90);
    p.life = p.maxLife;
    p.col = col;
    p.rot = a;
    p.vr = rand(-0.2, 0.2);
    p.kind = Math.random() < 0.5 ? 1 : 0;
    p.alive = true;
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, pool: Particle[]) {
  for (const p of pool) {
    if (!p.alive) continue;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.06;
    p.vx *= 0.99;
    p.rot += p.vr;
    p.life -= 1;
    if (p.life <= 0) { p.alive = false; continue; }
    const t = p.life / p.maxLife;
    const alpha = Math.min(1, t * 1.4);
    const cR = Math.floor(p.col[0] * 255);
    const cG = Math.floor(p.col[1] * 255);
    const cB = Math.floor(p.col[2] * 255);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgb(${cR},${cG},${cB})`;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 6;
    if (p.kind === 1) {
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.rotate(p.rot);
      ctx.fillRect(-3, -0.8, 6, 1.6);
    }
    ctx.restore();
  }
}
