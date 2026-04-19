export function drawScanlineGlitch(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  tS: number, flashIntensity: number,
) {
  if (flashIntensity <= 0.02) return;
  const bands = 3;
  for (let b = 0; b < bands; b++) {
    const bandY = ((tS * 220 + b * H / bands) % H);
    const bandH = 6 + flashIntensity * 14;
    ctx.save();
    ctx.globalAlpha = Math.min(0.45, flashIntensity * 0.5);
    ctx.fillStyle = b === 0 ? "#ff2bd6" : b === 1 ? "#21e7ff" : "#9d00ff";
    ctx.fillRect(0, bandY, W, bandH);
    ctx.restore();
  }
}

export function drawWarp(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  warpState: { on: boolean; t: number } | null | undefined,
  dt: number,
) {
  if (!warpState?.on) return;
  warpState.t += dt;
  const w = Math.min(1, warpState.t / 2);
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, `rgba(255,43,214,${0.3 + w * 0.5})`);
  g.addColorStop(0.5, `rgba(33,231,255,${0.2 + w * 0.3})`);
  g.addColorStop(1, "rgba(10,4,26,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export function drawFlash(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  flashIntensity: number,
): number {
  if (flashIntensity <= 0.01) return flashIntensity;
  ctx.save();
  ctx.globalAlpha = Math.min(0.55, flashIntensity);
  ctx.fillStyle = "#ff2bd6";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  return flashIntensity * 0.9;
}

export function drawVignette(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}
