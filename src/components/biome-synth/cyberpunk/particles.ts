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
  const colRgb = `rgb(${Math.floor(col[0] * 255)},${Math.floor(col[1] * 255)},${Math.floor(col[2] * 255)})`;
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
    p.colRgb = colRgb;
    p.rot = a;
    p.vr = rand(-0.2, 0.2);
    p.kind = Math.random() < 0.5 ? 1 : 0;
    p.alive = true;
  }
}

// Drum hits drop ~10 colored particles; previously the inner loop set
// fillStyle/shadowColor/shadowBlur per particle, so on rapid drum presses
// up to ~300 alive particles all ran shadow blur — the dominant cause of
// drum-press lag. Shadow blur is now dropped (the cyberpunk "lighter"
// composite at the scene level still keeps them luminous), the per-frame
// rgb() string is pre-computed at spawn, and round particles draw inline
// without save/restore.
export function drawParticles(ctx: CanvasRenderingContext2D, pool: Particle[]) {
  ctx.save();
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
    ctx.globalAlpha = Math.min(1, t * 1.4);
    ctx.fillStyle = p.colRgb;
    if (p.kind === 1) {
      // Round particle — no rotation, no shadow.
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Rotated bar — needs transform; cheaper than the old shadow path.
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillRect(-3, -0.8, 6, 1.6);
      ctx.restore();
    }
  }
  ctx.restore();
}
