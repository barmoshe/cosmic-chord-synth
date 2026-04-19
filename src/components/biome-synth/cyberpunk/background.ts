export const horizonY = (H: number) => H * 0.62;

export function buildBgCanvas(bgCanvas: HTMLCanvasElement, W: number, H: number, PR: number) {
  bgCanvas.width = Math.max(1, Math.floor(W * PR));
  bgCanvas.height = Math.max(1, Math.floor(H * PR));
  const bctx = bgCanvas.getContext("2d")!;
  bctx.setTransform(PR, 0, 0, PR, 0, 0);
  const gy = horizonY(H);
  // Night sky vertical gradient
  const sky = bctx.createLinearGradient(0, 0, 0, gy);
  sky.addColorStop(0, "#07021a");
  sky.addColorStop(0.55, "#12062e");
  sky.addColorStop(1, "#2a0a3f");
  bctx.fillStyle = sky;
  bctx.fillRect(0, 0, W, gy);
  // Horizon neon band
  const band = bctx.createLinearGradient(0, gy - 40, 0, gy + 8);
  band.addColorStop(0, "rgba(157, 0, 255, 0)");
  band.addColorStop(0.6, "rgba(255, 43, 214, 0.35)");
  band.addColorStop(1, "rgba(33, 231, 255, 0.55)");
  bctx.fillStyle = band;
  bctx.fillRect(0, gy - 40, W, 50);
  // Ground base
  bctx.fillStyle = "#05020f";
  bctx.fillRect(0, gy, W, H - gy);
}
