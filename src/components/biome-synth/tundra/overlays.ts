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
  g.addColorStop(0, `rgba(255,255,255,${0.35 + w * 0.5})`);
  g.addColorStop(0.5, `rgba(212,239,242,${0.22 + w * 0.3})`);
  g.addColorStop(1, "rgba(212,239,242,0)");
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
  ctx.globalAlpha = Math.min(0.6, flashIntensity);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  return flashIntensity * 0.9;
}

// Pale edge softening — bright scene stays readable, just kisses the corners.
export function drawVignette(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.44, W / 2, H / 2, Math.max(W, H) * 0.78);
  vig.addColorStop(0, "rgba(180,219,246,0)");
  vig.addColorStop(1, "rgba(120,160,200,0.22)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}
