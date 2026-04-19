import { rand } from "./utils";
import { surfaceY } from "./wave";
import type { LightRay } from "./types";

export function drawSky(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, surfaceY(H));
  skyGrad.addColorStop(0, "#0a1f2e");
  skyGrad.addColorStop(1, "#1a4d6e");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, surfaceY(H));
}

export function drawWaterBody(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const sy = surfaceY(H);
  const waterGrad = ctx.createLinearGradient(0, sy, 0, H);
  waterGrad.addColorStop(0, "#0a3a5e");
  waterGrad.addColorStop(0.45, "#063a52");
  waterGrad.addColorStop(1, "#021829");
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, sy - 4, W, H - sy + 4);
}

export function makeLightRays(W: number): LightRay[] {
  return Array.from({ length: 4 }, () => ({
    x: rand(0, W),
    width: rand(60, 140),
    speed: rand(0.05, 0.15),
  }));
}

export function drawLightRays(
  ctx: CanvasRenderingContext2D,
  rays: LightRay[],
  W: number, H: number, mid: number, flashIntensity: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const sy = surfaceY(H);
  for (const ray of rays) {
    ray.x += ray.speed * (1 + mid * 0.5);
    if (ray.x > W + ray.width) ray.x = -ray.width;
    const intensity = 0.08 + flashIntensity * 0.12 + mid * 0.05;
    const lg = ctx.createLinearGradient(ray.x, sy, ray.x + ray.width * 0.4, H);
    lg.addColorStop(0, `rgba(168,230,207,${intensity})`);
    lg.addColorStop(1, "rgba(168,230,207,0)");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(ray.x, sy);
    ctx.lineTo(ray.x + ray.width, sy);
    ctx.lineTo(ray.x + ray.width + 60, H);
    ctx.lineTo(ray.x - 30, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
