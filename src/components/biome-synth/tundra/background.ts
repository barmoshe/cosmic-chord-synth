import { isMobile } from "../shared/constants";
import { rand, rgba } from "./utils";
import type { AuroraRibbon, StarDot } from "./types";

/* ── Sky ── */
export function drawSky(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#02050f");         // near-black zenith
  grad.addColorStop(0.45, "#081433");      // deep indigo
  grad.addColorStop(0.85, "#0f2350");      // lifted horizon
  grad.addColorStop(1, "#182a4a");         // pale reflective base
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Cold horizon haze — soft teal spill where the aurora dies into the ice.
  const horizon = ctx.createRadialGradient(W * 0.5, H * 0.82, 20, W * 0.5, H * 0.82, H * 0.55);
  horizon.addColorStop(0, "rgba(140,243,228,0.14)");
  horizon.addColorStop(0.6, "rgba(107,217,255,0.06)");
  horizon.addColorStop(1, "rgba(140,243,228,0)");
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 0, W, H);
}

/* ── Starfield ── */
export function createStars(W: number, H: number): StarDot[] {
  const count = isMobile ? 90 : 180;
  const out: StarDot[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random() * W,
      y: Math.random() * (H * 0.62),
      base: rand(0.25, 0.9),
      phase: Math.random() * Math.PI * 2,
      speed: rand(0.6, 1.8),
    });
  }
  return out;
}

export function drawStars(ctx: CanvasRenderingContext2D, stars: StarDot[], tS: number) {
  ctx.save();
  for (const s of stars) {
    const t = 0.5 + 0.5 * Math.sin(tS * s.speed + s.phase);
    const a = s.base * (0.5 + t * 0.5);
    ctx.globalAlpha = a;
    ctx.fillStyle = "#e8f1ff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, 0.9 + t * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ── Glacier silhouettes ── */
export function buildGlaciers(canvas: HTMLCanvasElement, W: number, H: number, PR: number) {
  canvas.width = Math.max(1, Math.floor(W * PR));
  canvas.height = Math.max(1, Math.floor(H * 0.5 * PR));
  const g = canvas.getContext("2d")!;
  g.setTransform(PR, 0, 0, PR, 0, 0);
  g.clearRect(0, 0, W, H * 0.5);
  // Far range — dusky cyan glaciers
  g.fillStyle = "#102545";
  g.beginPath();
  g.moveTo(0, H * 0.5);
  const peaks = 9;
  for (let i = 0; i <= peaks; i++) {
    const x = (i / peaks) * W;
    const noise = Math.sin(i * 1.9) * 0.5 + Math.cos(i * 1.1) * 0.3;
    const y = H * 0.5 - (H * 0.20 + noise * H * 0.06);
    g.lineTo(x, y);
  }
  g.lineTo(W, H * 0.5);
  g.closePath();
  g.fill();
  // Close range — icy teal
  g.fillStyle = "#17365a";
  g.beginPath();
  g.moveTo(0, H * 0.5);
  for (let i = 0; i <= peaks + 3; i++) {
    const x = (i / (peaks + 3)) * W;
    const noise = Math.sin(i * 2.5 + 0.7) * 0.45;
    const y = H * 0.5 - (H * 0.11 + noise * H * 0.045);
    g.lineTo(x, y);
  }
  g.lineTo(W, H * 0.5);
  g.closePath();
  g.fill();
  // Rim light — a pale cyan highlight on the leading edges
  g.strokeStyle = "rgba(168,230,207,0.35)";
  g.lineWidth = 1.2;
  g.beginPath();
  for (let i = 0; i <= peaks + 3; i++) {
    const x = (i / (peaks + 3)) * W;
    const noise = Math.sin(i * 2.5 + 0.7) * 0.45;
    const y = H * 0.5 - (H * 0.11 + noise * H * 0.045);
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.stroke();
}

export function drawIceFloor(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const iceY = H * 0.92;
  const g = ctx.createLinearGradient(0, iceY, 0, H);
  g.addColorStop(0, "#1e3a66");
  g.addColorStop(1, "#05101e");
  ctx.fillStyle = g;
  ctx.fillRect(0, iceY, W, H - iceY);
  // pale fracture line
  ctx.strokeStyle = "rgba(168,230,207,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, iceY);
  ctx.lineTo(W, iceY);
  ctx.stroke();
}

/* ── Aurora ribbons ── */
export function createAuroraBands(): AuroraRibbon[] {
  return [
    { y: 0.18, amp: 0.055, freq: 1.3, phase: 0,   speed: 0.15, hue: [0.37, 0.92, 0.83], alpha: 0.35, thickness: 110 },
    { y: 0.28, amp: 0.045, freq: 1.7, phase: 1.2, speed: 0.22, hue: [0.13, 0.83, 0.93], alpha: 0.28, thickness: 90 },
    { y: 0.38, amp: 0.065, freq: 1.1, phase: 0.4, speed: 0.11, hue: [0.71, 0.55, 0.98], alpha: 0.30, thickness: 130 },
    { y: 0.46, amp: 0.035, freq: 2.2, phase: 2.3, speed: 0.28, hue: [0.55, 0.90, 0.80], alpha: 0.22, thickness: 70 },
  ];
}

// Three-layer aurora: a soft wide base, a brighter thin core, and an additive
// shimmer pass tied to mid-band audio energy.
export function drawAuroraBands(
  ctx: CanvasRenderingContext2D,
  bands: AuroraRibbon[],
  W: number, H: number,
  dt: number, mid: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const pulse = 1 + mid * 0.9;
  for (const b of bands) {
    b.phase += b.speed * dt * (0.6 + mid * 0.8);
    const midY = H * b.y;
    const half = b.thickness * 0.5;
    const step = 6;
    // Paint the ribbon as a series of vertical gradients following a sine path.
    for (let x = 0; x <= W; x += step) {
      const u = x / W;
      const wave = Math.sin(u * Math.PI * 2 * b.freq + b.phase) * b.amp * H;
      const y = midY + wave;
      const grad = ctx.createLinearGradient(0, y - half, 0, y + half);
      grad.addColorStop(0,   rgba(b.hue, 0));
      grad.addColorStop(0.5, rgba(b.hue, b.alpha * pulse));
      grad.addColorStop(1,   rgba(b.hue, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(x, y - half, step + 1, b.thickness);
    }
  }
  ctx.restore();
}
