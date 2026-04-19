import { isMobile } from "../constants";
import { rand } from "./utils";
import { surfaceY } from "./wave";
import type { Fish } from "./types";

export function makeFish(W: number, H: number): Fish[] {
  const count = isMobile ? 18 : 38;
  return Array.from({ length: count }, () => ({
    x: rand(0, W),
    y: rand(H * 0.25, H * 0.85),
    vx: rand(-1.2, 1.2),
    vy: rand(-0.4, 0.4),
    hue: Math.random() < 0.5 ? 175 : 195, // teal / cyan
    size: rand(6, 11),
    phase: rand(0, Math.PI * 2),
  }));
}

export function drawFish(
  ctx: CanvasRenderingContext2D,
  fish: Fish[],
  W: number, H: number, tS: number, high: number,
) {
  const speedBoost = 1 + high * 0.8;
  for (let i = 0; i < fish.length; i++) {
    const f = fish[i];
    let cohX = 0, cohY = 0, sepX = 0, sepY = 0, aliX = 0, aliY = 0, n = 0;
    for (let j = 0; j < fish.length; j++) {
      if (i === j) continue;
      const o = fish[j];
      const dx = o.x - f.x;
      const dy = o.y - f.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 80 * 80) {
        cohX += o.x; cohY += o.y;
        aliX += o.vx; aliY += o.vy;
        n++;
        if (d2 < 26 * 26) {
          const d = Math.sqrt(d2) + 0.001;
          sepX -= dx / d; sepY -= dy / d;
        }
      }
    }
    if (n > 0) {
      cohX = cohX / n - f.x;
      cohY = cohY / n - f.y;
      aliX = aliX / n - f.vx;
      aliY = aliY / n - f.vy;
      f.vx += cohX * 0.0012 + aliX * 0.04 + sepX * 0.05;
      f.vy += cohY * 0.0012 + aliY * 0.04 + sepY * 0.05;
    }
    const topBound = surfaceY(H) + 30;
    const botBound = H * 0.86;
    if (f.y < topBound) f.vy += 0.06;
    if (f.y > botBound) f.vy -= 0.06;
    const sp = Math.hypot(f.vx, f.vy);
    const maxSp = 1.6;
    if (sp > maxSp) { f.vx = (f.vx / sp) * maxSp; f.vy = (f.vy / sp) * maxSp; }
    f.vx *= 0.99; f.vy *= 0.99;
    f.x += f.vx * speedBoost;
    f.y += f.vy * speedBoost;
    if (f.x < -20) f.x = W + 20;
    if (f.x > W + 20) f.x = -20;
    const ang = Math.atan2(f.vy, f.vx);
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(ang);
    const wig = Math.sin(tS * 8 + f.phase) * 0.6;
    ctx.fillStyle = f.hue === 175 ? "rgba(122,229,130,0.85)" : "rgba(108,217,255,0.85)";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(0, 0, f.size, f.size * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-f.size, 0);
    ctx.lineTo(-f.size - 6, -3 + wig);
    ctx.lineTo(-f.size - 6, 3 + wig);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.beginPath();
    ctx.arc(f.size * 0.55, -f.size * 0.12, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function scatterFishFrom(fish: Fish[], x: number, y: number, strength: number) {
  for (const f of fish) {
    const dx = f.x - x;
    const dy = f.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
    if (dist < 200) {
      const force = (1 - dist / 200) * strength;
      f.vx += (dx / dist) * force;
      f.vy += (dy / dist) * force;
    }
  }
}
