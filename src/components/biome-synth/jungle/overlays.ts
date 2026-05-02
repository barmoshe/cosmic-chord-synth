let warpCache: { w: number; h: number; grad: CanvasGradient } | null = null;
function getWarpGradient(ctx: CanvasRenderingContext2D, W: number, H: number) {
  if (warpCache && warpCache.w === W && warpCache.h === H) return warpCache.grad;
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  g.addColorStop(0, "rgba(163,230,53,1)");
  g.addColorStop(0.6, "rgba(45,106,79,0.6)");
  g.addColorStop(1, "rgba(10,31,20,0)");
  warpCache = { w: W, h: H, grad: g };
  return g;
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
  ctx.save();
  ctx.globalAlpha = 0.25 + w * 0.5;
  ctx.fillStyle = getWarpGradient(ctx, W, H);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function drawFlash(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  flashIntensity: number,
): number {
  if (flashIntensity <= 0.01) return flashIntensity;
  ctx.save();
  ctx.globalAlpha = Math.min(0.7, flashIntensity);
  ctx.fillStyle = "#ffe14d";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  return flashIntensity * 0.9;
}

let vignetteCache: { w: number; h: number; grad: CanvasGradient } | null = null;
export function drawVignette(ctx: CanvasRenderingContext2D, W: number, H: number) {
  if (!vignetteCache || vignetteCache.w !== W || vignetteCache.h !== H) {
    const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.34, W / 2, H / 2, Math.max(W, H) * 0.72);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.65)");
    vignetteCache = { w: W, h: H, grad: vig };
  }
  ctx.fillStyle = vignetteCache.grad;
  ctx.fillRect(0, 0, W, H);
}
