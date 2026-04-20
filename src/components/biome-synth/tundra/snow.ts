import { isMobile } from "../shared/constants";
import { rand } from "./utils";
import type { Snowflake } from "./types";

export function makeSnow(W: number, H: number): Snowflake[] {
  const count = isMobile ? 80 : 180;
  const out: Snowflake[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: rand(-0.2, 0.2),
      vy: rand(0.3, 1.1),
      size: rand(0.8, 2.4),
      phase: Math.random() * Math.PI * 2,
      spin: rand(0.004, 0.012),
    });
  }
  return out;
}

// Soft drifting snow. High-frequency FFT energy nudges vertical speed, giving
// the scene a visual shimmer that tracks hat/cymbal hits.
export function drawSnow(
  ctx: CanvasRenderingContext2D,
  flakes: Snowflake[],
  W: number, H: number, tS: number, high: number,
) {
  const fallBoost = 1 + high * 0.9;
  ctx.save();
  for (const f of flakes) {
    f.phase += f.spin;
    f.x += f.vx + Math.sin(f.phase + tS * 0.3) * 0.25;
    f.y += f.vy * fallBoost;
    if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; }
    if (f.x < -6) f.x = W + 6;
    if (f.x > W + 6) f.x = -6;
    const brightness = 0.55 + 0.45 * Math.sin(f.phase * 2 + tS);
    ctx.globalAlpha = Math.min(1, 0.35 + brightness * 0.55);
    ctx.fillStyle = "#eaf6ff";
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
