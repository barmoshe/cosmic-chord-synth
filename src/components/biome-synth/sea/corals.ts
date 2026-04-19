import { isMobile } from "../shared/constants";
import { rand } from "./utils";
import type { Coral } from "./types";

const PALETTE = ["#ff6b9d", "#ff8e72", "#c77dff", "#ff5a8a", "#7ae582"];

export function buildCorals(W: number, H: number): Coral[] {
  const count = isMobile ? 5 : 9;
  const out: Coral[] = [];
  for (let i = 0; i < count; i++) {
    const baseX = (i + 0.5) / count * W + rand(-30, 30);
    const baseY = H * 0.96;
    const segCount = Math.floor(rand(4, 7));
    const segments = [];
    for (let s = 0; s < segCount; s++) {
      segments.push({
        len: rand(14, 26) * (1 - s * 0.08),
        angle: rand(-0.2, 0.2),
        angVel: 0,
        target: rand(-0.15, 0.15),
        w: 6 - s * 0.6,
      });
    }
    out.push({
      baseX, baseY, segments,
      hue: PALETTE[i % PALETTE.length],
      baseAngle: 0,
    });
  }
  return out;
}

export function drawCorals(ctx: CanvasRenderingContext2D, corals: Coral[], tS: number, bass: number) {
  for (const c of corals) {
    c.baseAngle = Math.sin(tS * 0.7) * 0.06 * (1 + bass * 0.8);
    for (const seg of c.segments) {
      const restore = (seg.target - seg.angle) * 0.03;
      seg.angVel += restore;
      seg.angVel *= 0.9;
      seg.angle += seg.angVel;
    }
    ctx.save();
    ctx.translate(c.baseX, c.baseY);
    ctx.rotate(c.baseAngle);
    ctx.strokeStyle = c.hue;
    ctx.shadowColor = c.hue;
    ctx.shadowBlur = 8;
    ctx.lineCap = "round";
    let x = 0, y = 0, ang = -Math.PI / 2;
    for (const seg of c.segments) {
      ang += seg.angle;
      const nx = x + Math.cos(ang) * seg.len;
      const ny = y + Math.sin(ang) * seg.len;
      ctx.lineWidth = seg.w;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      x = nx; y = ny;
    }
    ctx.fillStyle = c.hue;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function kickCoralsFrom(corals: Coral[], x: number, v: number) {
  for (const c of corals) {
    const dx = c.baseX - x;
    if (Math.abs(dx) < 240) {
      const sign = dx >= 0 ? 1 : -1;
      for (const seg of c.segments) {
        seg.angVel += sign * (0.04 + v * 0.06) / (1 + Math.abs(dx) * 0.005);
      }
    }
  }
}
