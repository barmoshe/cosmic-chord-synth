import { isMobile } from "../constants";
import { rand } from "./utils";
import type { RainStreak } from "./types";

const HUES = ["#ff2bd6", "#9d00ff", "#21e7ff"];

export function makeRain(W: number, H: number): RainStreak[] {
  const rainCount = isMobile ? 180 : 360;
  return Array.from({ length: rainCount }, () => ({
    x: rand(0, W),
    y: rand(-H, H),
    speed: rand(5, 11),
    len: rand(14, 34),
    hue: Math.random() < 0.18 ? 0 : Math.random() < 0.35 ? 1 : 2, // 0 magenta, 1 purple, 2 cyan
    alpha: rand(0.25, 0.8),
  }));
}

export function drawRain(
  ctx: CanvasRenderingContext2D,
  rain: RainStreak[],
  W: number, H: number,
  vol: number, high: number,
) {
  const speedBoost = 1 + vol * 1.6 + high * 0.8;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const r of rain) {
    r.y += r.speed * speedBoost;
    r.x += r.speed * 0.12; // slight slant
    if (r.y > H + 10 || r.x > W + 10) {
      r.x = rand(-20, W);
      r.y = -r.len - rand(0, 120);
    }
    const col = HUES[r.hue];
    ctx.strokeStyle = col;
    ctx.globalAlpha = r.alpha;
    ctx.lineWidth = 1;
    ctx.shadowColor = col;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y);
    ctx.lineTo(r.x - r.len * 0.12, r.y - r.len);
    ctx.stroke();
  }
  ctx.restore();
}
