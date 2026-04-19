export function drawWarp(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  warpState: { on: boolean; t: number } | null | undefined,
  dt: number,
) {
  if (!warpState?.on) return;
  warpState.t += dt;
  const w = Math.min(1, warpState.t / 2);
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  g.addColorStop(0, `rgba(108,217,255,${0.25 + w * 0.5})`);
  g.addColorStop(0.5, `rgba(122,229,130,${0.18 + w * 0.3})`);
  g.addColorStop(1, "rgba(4,26,46,0)");
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
  ctx.globalAlpha = Math.min(0.65, flashIntensity);
  ctx.fillStyle = "#a8e6cf";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  return flashIntensity * 0.9;
}

export function drawVignette(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.34, W / 2, H / 2, Math.max(W, H) * 0.72);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}
