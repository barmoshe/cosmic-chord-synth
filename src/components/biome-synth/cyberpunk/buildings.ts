import { isMobile } from "../shared/constants";
import { clamp } from "../shared/helpers";
import { rand } from "./utils";
import type { Building } from "./types";

export function makeBuildings(W: number, H: number): Building[] {
  const count = isMobile ? 10 : 16;
  const minH = H * 0.18;
  const maxH = H * 0.42;
  const spacing = W / count;
  const out: Building[] = [];
  for (let i = 0; i < count; i++) {
    const w = rand(spacing * 0.55, spacing * 0.95);
    const h = rand(minH, maxH);
    const x = i * spacing + (spacing - w) * 0.5;
    const cool = Math.random() < 0.55;
    out.push({
      x, w, h,
      color: cool ? "#0d0624" : "#180a2e",
      stripe: cool ? "#21e7ff" : "#ff2bd6",
      windowRows: Math.max(6, Math.floor(h / 18)),
      windowCols: Math.max(3, Math.floor(w / 10)),
      windowSeed: Math.floor(rand(0, 10000)),
      lightPhase: rand(0, Math.PI * 2),
      bandIdx: i,
    });
  }
  return out;
}

export function drawDistantSkyline(ctx: CanvasRenderingContext2D, W: number, gy: number) {
  ctx.save();
  ctx.fillStyle = "#070216";
  ctx.beginPath();
  ctx.moveTo(0, gy);
  let seed = 0;
  for (let x = 0; x <= W; x += 24) {
    seed = (seed * 9301 + 49297) % 233280;
    const n = (seed / 233280);
    const h = 14 + n * 42;
    ctx.lineTo(x, gy - h);
  }
  ctx.lineTo(W, gy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawBuildings(
  ctx: CanvasRenderingContext2D,
  buildings: Building[],
  H: number, gy: number,
  fft: Float32Array,
  tS: number, fc: number,
  flashIntensity: number,
) {
  for (const b of buildings) {
    const bx = b.x;
    const by = gy - b.h;
    // Body
    ctx.fillStyle = b.color;
    ctx.fillRect(bx, by, b.w, b.h);
    // Outline stripe
    ctx.fillStyle = b.stripe;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(bx + b.w / 2 - 0.6, by + 6, 1.2, b.h - 10);
    ctx.globalAlpha = 1;
    // Antenna + neon tip
    if (b.h > H * 0.3) {
      ctx.strokeStyle = b.stripe;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + b.w / 2, by);
      ctx.lineTo(bx + b.w / 2, by - 18);
      ctx.stroke();
      ctx.fillStyle = b.stripe;
      ctx.beginPath();
      ctx.arc(bx + b.w / 2, by - 18, 2 + Math.sin(tS * 2 + b.lightPhase) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Window grid — FFT-driven per-building band intensity
    const bin = Math.min(fft.length - 1, Math.floor((b.bandIdx / buildings.length) * (fft.length * 0.5)));
    const fftVal = fft ? clamp((fft[bin] + 100) / 80, 0, 1) : 0; // dB → 0..1
    const lit = 0.45 + fftVal * 0.45 + Math.sin(tS * 1.4 + b.lightPhase) * 0.08;
    const cellW = b.w / b.windowCols;
    const cellH = b.h / b.windowRows;
    let s = b.windowSeed;
    for (let row = 0; row < b.windowRows; row++) {
      for (let col = 0; col < b.windowCols; col++) {
        s = (s * 9301 + 49297) % 233280;
        const on = (s / 233280) < 0.62;
        if (!on) continue;
        const wx = bx + col * cellW + 1.5;
        const wy = by + row * cellH + 2;
        const ww = Math.max(1, cellW - 3);
        const wh = Math.max(1, cellH - 4);
        const flick = ((s + fc) % 97) < 5 ? 0.3 : 1;
        ctx.fillStyle = b.stripe;
        ctx.globalAlpha = clamp(lit * flick, 0, 1);
        ctx.fillRect(wx, wy, ww, wh);
      }
    }
    ctx.globalAlpha = 1;
    // Soft neon outline glow on pulse
    if (flashIntensity > 0.05) {
      ctx.save();
      ctx.strokeStyle = b.stripe;
      ctx.shadowColor = b.stripe;
      ctx.shadowBlur = 10 * flashIntensity;
      ctx.globalAlpha = flashIntensity * 0.7;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, b.w - 1, b.h - 1);
      ctx.restore();
    }
  }
}
