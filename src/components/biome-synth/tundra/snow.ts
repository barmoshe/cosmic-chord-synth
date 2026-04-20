import { isMobile } from "../shared/constants";
import { rand } from "./utils";
import type { Snowflake } from "./types";

export function makeSnow(W: number, H: number): Snowflake[] {
  const count = isMobile ? 110 : 240;
  const out: Snowflake[] = [];
  for (let i = 0; i < count; i++) {
    const r = rand(0.9, 3.2);
    out.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r,
      vy: rand(0.35, 1.2) + r * 0.18,
      drift: rand(18, 48),
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: rand(0.4, 1.4),
      opacity: rand(0.55, 1),
      spin: rand(-0.03, 0.03),
      angle: Math.random() * Math.PI * 2,
      kind: r > 2 ? 1 : 0,
    });
  }
  return out;
}

// Heavier, larger flakes. Each carries its own sin-based horizontal drift so
// the field never looks uniform. High-band FFT energy nudges vertical speed
// so cymbal/hat strikes shimmer the snow.
export function drawSnow(
  ctx: CanvasRenderingContext2D,
  flakes: Snowflake[],
  W: number, H: number, tS: number, high: number,
) {
  const fallBoost = 1 + high * 1.1;
  ctx.save();
  for (const f of flakes) {
    const drift = Math.sin(f.phase + tS * f.phaseSpeed) * f.drift * 0.02;
    f.x += drift;
    f.y += f.vy * fallBoost;
    f.angle += f.spin;
    if (f.y > H + 6) { f.y = -6; f.x = Math.random() * W; }
    if (f.x < -10) f.x = W + 10;
    if (f.x > W + 10) f.x = -10;

    ctx.globalAlpha = f.opacity;

    if (f.kind === 0) {
      // Small round pellet — fastest path: just a filled circle.
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Larger 6-point flake — three crossed bars.
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(0.8, f.r * 0.45);
      ctx.lineCap = "round";
      const len = f.r * 1.4;
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI;
        const cx = Math.cos(a) * len;
        const cy = Math.sin(a) * len;
        ctx.beginPath();
        ctx.moveTo(-cx, -cy);
        ctx.lineTo(cx, cy);
        ctx.stroke();
      }
      // bright center dot
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0.7, f.r * 0.35), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}
