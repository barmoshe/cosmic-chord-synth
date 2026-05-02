import { isMobile } from "../shared/constants";
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

// Streaks are drawn batched by (hue, alpha-bucket) so that each batch issues
// one strokeStyle/shadow/alpha set + one beginPath + one stroke instead of
// hundreds. Alpha is quantized to 4 levels — visually indistinguishable.
const ALPHA_BUCKETS = [0.3, 0.5, 0.65, 0.8];
function alphaBucket(a: number): number {
  if (a < 0.4) return 0;
  if (a < 0.575) return 1;
  if (a < 0.725) return 2;
  return 3;
}

export function drawRain(
  ctx: CanvasRenderingContext2D,
  rain: RainStreak[],
  W: number, H: number,
  vol: number, high: number,
) {
  const speedBoost = 1 + vol * 1.6 + high * 0.8;

  // Step physics in one pass.
  for (const r of rain) {
    r.y += r.speed * speedBoost;
    r.x += r.speed * 0.12;
    if (r.y > H + 10 || r.x > W + 10) {
      r.x = rand(-20, W);
      r.y = -r.len - rand(0, 120);
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineWidth = 1;
  ctx.shadowBlur = 4;

  // Draw in 3 hues × 4 alpha buckets = up to 12 batched paths.
  for (let h = 0; h < HUES.length; h++) {
    const col = HUES[h];
    let styleSet = false;
    for (let b = 0; b < ALPHA_BUCKETS.length; b++) {
      let started = false;
      for (const r of rain) {
        if (r.hue !== h) continue;
        if (alphaBucket(r.alpha) !== b) continue;
        if (!started) {
          if (!styleSet) {
            ctx.strokeStyle = col;
            ctx.shadowColor = col;
            styleSet = true;
          }
          ctx.globalAlpha = ALPHA_BUCKETS[b];
          ctx.beginPath();
          started = true;
        }
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - r.len * 0.12, r.y - r.len);
      }
      if (started) ctx.stroke();
    }
  }
  ctx.restore();
}
