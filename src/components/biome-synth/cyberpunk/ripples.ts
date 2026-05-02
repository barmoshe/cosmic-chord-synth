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
      col: [0, 0, 0], colRgb: "rgb(0,0,0)", alpha: 0, alive: false,
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
  r.r = 10;
  r.maxR = 120 + intensity * 70;
  r.col = col;
  r.colRgb = `rgb(${Math.floor(col[0] * 255)},${Math.floor(col[1] * 255)},${Math.floor(col[2] * 255)})`;
  r.alpha = 0.6 * intensity;
  r.alive = true;
}

export function drawRipples(ctx: CanvasRenderingContext2D, pool: Ripple[]) {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.shadowBlur = 10;
  for (const r of pool) {
    if (!r.alive) continue;
    r.r += 3.2;
    r.alpha *= 0.955;
    if (r.r >= r.maxR || r.alpha < 0.02) { r.alive = false; continue; }
    ctx.globalAlpha = r.alpha;
    ctx.strokeStyle = r.colRgb;
    ctx.shadowColor = r.colRgb;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}
