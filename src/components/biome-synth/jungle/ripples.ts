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
  r.r = 8;
  r.maxR = 120 + intensity * 60;
  r.col = col;
  r.colRgb = `rgb(${Math.floor(col[0] * 255)},${Math.floor(col[1] * 255)},${Math.floor(col[2] * 255)})`;
  r.alpha = 0.55 * intensity;
  r.alive = true;
}

export function drawRipples(ctx: CanvasRenderingContext2D, pool: Ripple[]) {
  for (const r of pool) {
    if (!r.alive) continue;
    r.r += 2.6;
    r.alpha *= 0.962;
    if (r.r >= r.maxR || r.alpha < 0.02) { r.alive = false; continue; }
    ctx.save();
    ctx.globalAlpha = r.alpha;
    ctx.strokeStyle = r.colRgb;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
