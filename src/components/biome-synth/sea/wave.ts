import { isMobile } from "../shared/constants";
import { clamp } from "../shared/helpers";
import { rand } from "./utils";

export const NSAMPLES = isMobile ? 96 : 160;
const C2 = 0.22;
const DAMP = 0.992;

export interface WaveField {
  h: Float32Array;
  hPrev: Float32Array;
  hNext: Float32Array;
  driveT: number;
}

export function createWaveField(): WaveField {
  return {
    h: new Float32Array(NSAMPLES),
    hPrev: new Float32Array(NSAMPLES),
    hNext: new Float32Array(NSAMPLES),
    driveT: 0,
  };
}

export const surfaceY = (H: number) => H * 0.18;
export const surfaceXAt = (i: number, W: number) => (i / (NSAMPLES - 1)) * W;

export function sampleHeight(wave: WaveField, px: number, W: number): number {
  const t = clamp(px / W, 0, 1);
  const f = t * (NSAMPLES - 1);
  const i = Math.floor(f);
  const frac = f - i;
  const a = wave.h[i];
  const b = wave.h[Math.min(NSAMPLES - 1, i + 1)];
  return a + (b - a) * frac;
}

export function injectWaveAt(wave: WaveField, px: number, amp: number, W: number) {
  const t = clamp(px / W, 0, 1);
  const center = Math.floor(t * (NSAMPLES - 1));
  const radius = 4;
  for (let i = -radius; i <= radius; i++) {
    const idx = center + i;
    if (idx < 1 || idx >= NSAMPLES - 1) continue;
    const falloff = (1 - Math.abs(i) / radius);
    wave.h[idx] -= amp * falloff;
  }
}

export function stepWave(wave: WaveField, dt: number, bass: number) {
  const c2 = C2 * (1 + bass * 0.5);
  wave.driveT += dt;
  const driveAmp = 0.12 + bass * 0.6;
  wave.h[2] += Math.sin(wave.driveT * 1.7) * driveAmp;
  wave.h[NSAMPLES - 3] += Math.sin(wave.driveT * 1.3 + 0.7) * driveAmp;
  if (Math.random() < 0.02) {
    const idx = Math.floor(rand(2, NSAMPLES - 3));
    wave.h[idx] -= rand(0.5, 2.0);
  }
  for (let i = 1; i < NSAMPLES - 1; i++) {
    wave.hNext[i] = (2 * wave.h[i] - wave.hPrev[i] + c2 * (wave.h[i - 1] - 2 * wave.h[i] + wave.h[i + 1])) * DAMP;
  }
  wave.hNext[0] = wave.hNext[1] * 0.5;
  wave.hNext[NSAMPLES - 1] = wave.hNext[NSAMPLES - 2] * 0.5;
  const tmp = wave.hPrev;
  wave.hPrev = wave.h;
  wave.h = wave.hNext;
  wave.hNext = tmp;
}

export function drawWaveSurface(
  ctx: CanvasRenderingContext2D,
  wave: WaveField,
  W: number, H: number,
  flashIntensity: number,
) {
  const sy = surfaceY(H);
  // transparent fill shape (kept so the silhouette is part of layering order)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, sy);
  for (let i = 0; i < NSAMPLES; i++) {
    ctx.lineTo(surfaceXAt(i, W), sy + wave.h[i]);
  }
  ctx.lineTo(W, sy);
  ctx.lineTo(W, 0);
  ctx.closePath();
  ctx.fillStyle = "rgba(10,31,46,0.0)";
  ctx.fill();
  ctx.restore();

  // surface highlight stroke
  ctx.save();
  ctx.strokeStyle = `rgba(168,230,207,${0.35 + flashIntensity * 0.4})`;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "rgba(168,230,207,0.5)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, sy + wave.h[0]);
  for (let i = 1; i < NSAMPLES; i++) {
    ctx.lineTo(surfaceXAt(i, W), sy + wave.h[i]);
  }
  ctx.stroke();
  ctx.restore();

  // sub-surface foam band
  ctx.save();
  ctx.fillStyle = "rgba(168,230,207,0.08)";
  ctx.beginPath();
  ctx.moveTo(0, sy + wave.h[0]);
  for (let i = 1; i < NSAMPLES; i++) {
    ctx.lineTo(surfaceXAt(i, W), sy + wave.h[i]);
  }
  ctx.lineTo(W, sy + 12);
  ctx.lineTo(0, sy + 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

let causticsCache: { w: number; h: number; grad: CanvasGradient } | null = null;
function getCausticsGradient(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const floorTop = H * 0.82;
  if (causticsCache && causticsCache.w === W && causticsCache.h === H) return causticsCache.grad;
  const grad = ctx.createLinearGradient(0, floorTop, 0, H);
  grad.addColorStop(0, "rgba(168,230,207,1)");
  grad.addColorStop(1, "rgba(168,230,207,0)");
  causticsCache = { w: W, h: H, grad };
  return grad;
}

export function drawCaustics(
  ctx: CanvasRenderingContext2D,
  wave: WaveField,
  W: number, H: number, mid: number,
) {
  const floorTop = H * 0.82;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = getCausticsGradient(ctx, W, H);
  for (let i = 1; i < NSAMPLES - 1; i++) {
    const slope = wave.h[i + 1] - wave.h[i - 1];
    const brightness = clamp(0.06 + Math.abs(slope) * 0.04 + mid * 0.05, 0, 0.35);
    const x = surfaceXAt(i, W);
    const x2 = surfaceXAt(i + 1, W);
    ctx.globalAlpha = brightness;
    ctx.fillRect(x - 1, floorTop, x2 - x + 2, H - floorTop);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
