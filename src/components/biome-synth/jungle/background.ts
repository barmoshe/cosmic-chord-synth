import { isMobile } from "../constants";
import { rand } from "./utils";
import type { MistBand } from "./types";

export function buildMountains(canvas: HTMLCanvasElement, W: number, H: number, PR: number) {
  canvas.width = Math.max(1, Math.floor(W * PR));
  canvas.height = Math.max(1, Math.floor(H * 0.45 * PR));
  const mctx = canvas.getContext("2d")!;
  mctx.setTransform(PR, 0, 0, PR, 0, 0);
  mctx.clearRect(0, 0, W, H * 0.45);
  // far range
  mctx.fillStyle = "#0c2a1b";
  mctx.beginPath();
  mctx.moveTo(0, H * 0.45);
  const peaks = 7;
  for (let i = 0; i <= peaks; i++) {
    const x = (i / peaks) * W;
    const noise = Math.sin(i * 1.7) * 0.5 + Math.cos(i * 0.9) * 0.3;
    const y = H * 0.45 - (H * 0.18 + noise * H * 0.08);
    mctx.lineTo(x, y);
  }
  mctx.lineTo(W, H * 0.45);
  mctx.closePath();
  mctx.fill();
  // closer range
  mctx.fillStyle = "#143d28";
  mctx.beginPath();
  mctx.moveTo(0, H * 0.45);
  for (let i = 0; i <= peaks + 2; i++) {
    const x = (i / (peaks + 2)) * W;
    const noise = Math.sin(i * 2.3 + 1) * 0.4;
    const y = H * 0.45 - (H * 0.1 + noise * H * 0.05);
    mctx.lineTo(x, y);
  }
  mctx.lineTo(W, H * 0.45);
  mctx.closePath();
  mctx.fill();
}

export function buildUndergrowth(canvas: HTMLCanvasElement, W: number, H: number, PR: number) {
  canvas.width = Math.max(1, Math.floor(W * PR));
  canvas.height = Math.max(1, Math.floor(H * 0.18 * PR));
  const uctx = canvas.getContext("2d")!;
  uctx.setTransform(PR, 0, 0, PR, 0, 0);
  uctx.clearRect(0, 0, W, H * 0.18);
  const fernCount = isMobile ? 14 : 26;
  for (let i = 0; i < fernCount; i++) {
    const fx = (i / fernCount) * W + rand(-12, 12);
    const fy = H * 0.18 - rand(0, 8);
    const fh = rand(18, 36);
    uctx.save();
    uctx.translate(fx, fy);
    uctx.strokeStyle = "rgba(82,183,136,0.55)";
    uctx.lineWidth = 1.2;
    for (let b = -2; b <= 2; b++) {
      uctx.beginPath();
      uctx.moveTo(0, 0);
      uctx.quadraticCurveTo(b * 8, -fh * 0.5, b * 14, -fh);
      uctx.stroke();
    }
    uctx.restore();
  }
  const rockCount = isMobile ? 5 : 9;
  for (let i = 0; i < rockCount; i++) {
    const rx = rand(0, W);
    const ry = H * 0.18 - rand(0, 4);
    const rw = rand(14, 28);
    const rh = rw * 0.55;
    uctx.fillStyle = "rgba(14,38,23,0.9)";
    uctx.beginPath();
    uctx.ellipse(rx, ry, rw, rh, 0, Math.PI, Math.PI * 2);
    uctx.fill();
  }
}

export function drawSky(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#0a1f14");
  grad.addColorStop(0.45, "#143d28");
  grad.addColorStop(1, "#2d1b0a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Radial sun glow at 78% (stronger, warmer)
  const horizon = ctx.createRadialGradient(W * 0.5, H * 0.78, 20, W * 0.5, H * 0.78, H * 0.55);
  horizon.addColorStop(0, "rgba(245,158,11,0.28)");
  horizon.addColorStop(0.5, "rgba(180,90,20,0.12)");
  horizon.addColorStop(1, "rgba(245,158,11,0)");
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 0, W, H);
}

export function drawGround(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const groundY = H * 0.95;
  const g2 = ctx.createLinearGradient(0, groundY, 0, H);
  g2.addColorStop(0, "#0e2617");
  g2.addColorStop(1, "#050d08");
  ctx.fillStyle = g2;
  ctx.fillRect(0, groundY, W, H - groundY);
}

export function createMistBands(): MistBand[] {
  return [
    { y: 0.42, speed: 0.018, alpha: 0.06, h: 80, off: 0 },
    { y: 0.55, speed: 0.028, alpha: 0.05, h: 110, off: 0 },
    { y: 0.70, speed: 0.012, alpha: 0.04, h: 140, off: 0 },
  ];
}

export function drawMistBands(ctx: CanvasRenderingContext2D, bands: MistBand[], W: number, H: number, mid: number) {
  for (const m of bands) {
    m.off += m.speed * (1 + mid * 0.6);
    const my = H * m.y;
    const mAlpha = m.alpha + mid * 0.04;
    const mg = ctx.createLinearGradient(0, my - m.h * 0.5, 0, my + m.h * 0.5);
    mg.addColorStop(0, `rgba(255,255,255,0)`);
    mg.addColorStop(0.5, `rgba(255,255,255,${mAlpha})`);
    mg.addColorStop(1, `rgba(255,255,255,0)`);
    ctx.fillStyle = mg;
    ctx.fillRect(0, my - m.h * 0.5, W, m.h);
  }
}
