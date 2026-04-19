import { isMobile } from "../shared/constants";
import { rand } from "./utils";
import type { Firefly } from "./types";

export function makeFireflies(W: number, H: number): Firefly[] {
  const count = isMobile ? 120 : 260;
  const out: Firefly[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: rand(-0.25, 0.25),
      vy: rand(-0.4, -0.05),
      hue: Math.random() < 0.7 ? 80 : 52, // 80=lime, 52=amber
      phase: Math.random() * Math.PI * 2,
      speed: rand(1.2, 2.6),
    });
  }
  return out;
}

export function drawFireflies(
  ctx: CanvasRenderingContext2D,
  fireflies: Firefly[],
  W: number, H: number, tS: number, mid: number,
) {
  for (const f of fireflies) {
    f.x += f.vx + Math.sin(tS * 0.7 + f.phase) * 0.15;
    f.y += f.vy * (1 + mid * 0.8);
    if (f.y < -10) { f.y = H + 10; f.x = Math.random() * W; }
    if (f.x < -10) f.x = W + 10;
    if (f.x > W + 10) f.x = -10;
    const brightness = 0.5 + 0.5 * Math.sin(tS * f.speed + f.phase) + mid * 0.4;
    const size = 1.4 + brightness * 1.8;
    ctx.save();
    ctx.globalAlpha = Math.min(1, 0.3 + brightness * 0.8);
    ctx.fillStyle = f.hue === 80 ? "#a3e635" : "#ffe14d";
    ctx.shadowColor = ctx.fillStyle as string;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(f.x, f.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
