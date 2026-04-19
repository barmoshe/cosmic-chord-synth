import { clamp } from "../helpers";

export function drawNeonGrid(
  ctx: CanvasRenderingContext2D,
  W: number, H: number, gy: number,
  mid: number, bass: number, gridOffset: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  // horizontal lines receding to horizon
  ctx.strokeStyle = `rgba(255,43,214,${0.35 + mid * 0.25})`;
  ctx.shadowColor = "rgba(255,43,214,0.7)";
  ctx.shadowBlur = 6;
  ctx.lineWidth = 1;
  for (let i = 1; i < 18; i++) {
    const t = (i + gridOffset / 48) / 18;
    const y = gy + t * t * (H - gy);
    if (y >= H) continue;
    ctx.globalAlpha = clamp(0.15 + (1 - t) * 0.65, 0, 0.9);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // vanishing vertical lines
  ctx.strokeStyle = `rgba(33,231,255,${0.4 + bass * 0.3})`;
  ctx.shadowColor = "rgba(33,231,255,0.7)";
  ctx.shadowBlur = 8;
  const vpX = W / 2;
  const vpY = gy - 6;
  ctx.globalAlpha = 0.7;
  for (let i = -12; i <= 12; i++) {
    const x = vpX + i * (W / 10);
    ctx.beginPath();
    ctx.moveTo(vpX, vpY);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  ctx.restore();
}
