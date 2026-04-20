import { RIPPLE_POOL } from "../shared/constants";
import type { Ripple, RGB } from "./types";

export interface RipplePool {
  pool: Ripple[];
  cursor: number;
}

export function createRipplePool(): RipplePool {
  return {
    pool: Array.from({ length: RIPPLE_POOL }, () => ({
      x: 0, y: 0, r: 0, maxR: 0,
      col: [0, 0, 0], alpha: 0, alive: false,
    })),
    cursor: 0,
  };
}

export function spawnRipple(
  rp: RipplePool,
  x: number, y: number,
  col: RGB, intensity = 1,
) {
  const r = rp.pool[rp.cursor];
  rp.cursor = (rp.cursor + 1) % rp.pool.length;
  r.x = x; r.y = y;
  r.r = 6;
  r.maxR = 140 + intensity * 70;
  r.col = col;
  r.alpha = 0.6 * intensity;
  r.alive = true;
}

// Hexagonal snowflake ripple — six radial arms each branching into two side
// prongs. Expanding outward, softly fading, drawn with an additive glow so the
// flake catches the aurora light above.
export function drawRipples(ctx: CanvasRenderingContext2D, pool: Ripple[]) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const r of pool) {
    if (!r.alive) continue;
    r.r += 2.4;
    r.alpha *= 0.965;
    if (r.r >= r.maxR || r.alpha < 0.02) { r.alive = false; continue; }
    const cR = Math.floor(r.col[0] * 255);
    const cG = Math.floor(r.col[1] * 255);
    const cB = Math.floor(r.col[2] * 255);
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.strokeStyle = `rgba(${cR},${cG},${cB},${r.alpha})`;
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    ctx.shadowColor = `rgb(${cR},${cG},${cB})`;
    ctx.shadowBlur = 8;
    const arm = r.r;
    const branch = arm * 0.32;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const cx = Math.cos(ang);
      const cy = Math.sin(ang);
      const ex = cx * arm;
      const ey = cy * arm;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      // two angled prongs near the tip
      const bAx = Math.cos(ang + 0.6) * branch;
      const bAy = Math.sin(ang + 0.6) * branch;
      const bBx = Math.cos(ang - 0.6) * branch;
      const bBy = Math.sin(ang - 0.6) * branch;
      const midX = cx * arm * 0.65;
      const midY = cy * arm * 0.65;
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX + bAx, midY + bAy);
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX + bBx, midY + bBy);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}
