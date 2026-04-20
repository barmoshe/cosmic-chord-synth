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
    const s = rand(1.4, 2.8) * vel;
    p.x = x; p.y = y;
    p.vx = Math.cos(a) * s;
    p.vy = Math.sin(a) * s * 0.7 - rand(0.3, 1.2);
    p.maxLife = rand(80, 140);
    p.life = p.maxLife;
    p.col = col;
    p.rot = a;
    p.vr = (i % 2 === 0 ? 1 : -1) * rand(0.05, 0.16);
    p.kind = Math.random() < 0.5 ? 1 : 0; // 1 = shard, 0 = glint
    p.alive = true;
  }
}

// Ice shards + bright glints — additive blend for a cold, crystalline shower.
export function drawParticles(ctx: CanvasRenderingContext2D, pool: Particle[], high: number) {
  const hiBoost = 1 + high * 0.5;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of pool) {
    if (!p.alive) continue;
    p.x += p.vx * hiBoost;
    p.y += p.vy * hiBoost;
    p.vy += 0.05; // gentler gravity — snow-fall feel
    p.vx *= 0.985;
    p.rot += p.vr;
    p.life -= 1;
    if (p.life <= 0) { p.alive = false; continue; }
    const t = p.life / p.maxLife;
    const alpha = Math.min(1, t * 1.3);
    const cR = Math.floor(p.col[0] * 255);
    const cG = Math.floor(p.col[1] * 255);
    const cB = Math.floor(p.col[2] * 255);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = alpha;
    if (p.kind === 1) {
      // thin ice shard — vertical spike
      ctx.fillStyle = `rgba(${cR},${cG},${cB},${alpha})`;
      ctx.shadowColor = `rgb(${cR},${cG},${cB})`;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(1.5, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-1.5, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      // bright round glint
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.shadowColor = `rgb(${cR},${cG},${cB})`;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}
