import { isMobile } from "../constants";
import { rand } from "./utils";
import { sampleHeight, surfaceY, type WaveField } from "./wave";
import type { Bubble } from "./types";

export function makeBubbles(W: number, H: number): Bubble[] {
  const count = isMobile ? 40 : 80;
  return Array.from({ length: count }, () => ({
    x: rand(0, W),
    y: rand(surfaceY(H), H),
    r: rand(2, 6),
    vy: rand(0.3, 0.9),
    wobblePhase: rand(0, Math.PI * 2),
    alive: true,
  }));
}

export function drawBubbles(
  ctx: CanvasRenderingContext2D,
  bubbles: Bubble[],
  wave: WaveField,
  W: number, H: number, tS: number, mid: number,
) {
  for (const b of bubbles) {
    if (!b.alive) continue;
    b.y -= b.vy * (1 + mid * 1.2);
    b.x += Math.sin(tS * 1.4 + b.wobblePhase) * 0.4;
    const sh = sampleHeight(wave, b.x, W);
    const surfaceAtX = surfaceY(H) + sh;
    if (b.y < surfaceAtX + 4) {
      b.x = rand(0, W);
      b.y = rand(H * 0.6, H);
      b.r = rand(2, 6);
      b.vy = rand(0.3, 0.9);
      continue;
    }
    ctx.save();
    ctx.strokeStyle = "rgba(168,230,207,0.55)";
    ctx.fillStyle = "rgba(122,229,130,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
