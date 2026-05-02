import { isMobile } from "../shared/constants";
import { rand } from "./utils";
import type { StarDot } from "./types";

/* ── Sky ──
   A bright overcast arctic daylight. Top: pale mint `#E2FCFF`, middle: ice
   blue `#D4EFF2`, horizon: periwinkle `#B4DBF6`. No dark navy — a very
   different feeling from the Space biome.

   The sky never changes between frames, so we bake it into an offscreen canvas
   on first draw / resize and just blit it each frame. Saves three full-canvas
   gradient fillRects per frame. */
export function buildSky(canvas: HTMLCanvasElement, W: number, H: number, PR: number) {
  canvas.width = Math.max(1, Math.floor(W * PR));
  canvas.height = Math.max(1, Math.floor(H * PR));
  const g = canvas.getContext("2d")!;
  g.setTransform(PR, 0, 0, PR, 0, 0);

  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,    "#eaf8ff");
  grad.addColorStop(0.35, "#d8efff");
  grad.addColorStop(0.65, "#c3e4f7");
  grad.addColorStop(1,    "#aad4ef");
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  const sun = g.createRadialGradient(W * 0.78, H * 0.38, 10, W * 0.78, H * 0.38, Math.max(W, H) * 0.55);
  sun.addColorStop(0,    "rgba(255,248,224,0.45)");
  sun.addColorStop(0.35, "rgba(255,232,200,0.18)");
  sun.addColorStop(1,    "rgba(255,232,200,0)");
  g.fillStyle = sun;
  g.fillRect(0, 0, W, H);

  const bloom = g.createRadialGradient(W * 0.5, H * 0.58, 20, W * 0.5, H * 0.58, Math.max(W, H) * 0.7);
  bloom.addColorStop(0,    "rgba(240,250,255,0.35)");
  bloom.addColorStop(1,    "rgba(240,250,255,0)");
  g.fillStyle = bloom;
  g.fillRect(0, 0, W, H);
}

/* ── "Stars" ──
   In daylight there are no stars; we repurpose this as a shimmer field of
   tiny ice-crystals suspended high in the air (sparkle glints). Kept using
   the StarDot type for zero-friction interop with the scene hook. */
export function createStars(W: number, H: number): StarDot[] {
  const count = isMobile ? 60 : 120;
  const out: StarDot[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random() * W,
      y: Math.random() * (H * 0.55),
      base: rand(0.25, 0.7),
      phase: Math.random() * Math.PI * 2,
      speed: rand(0.8, 2.2),
    });
  }
  return out;
}

export function drawStars(ctx: CanvasRenderingContext2D, stars: StarDot[], tS: number) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const s of stars) {
    const t = 0.5 + 0.5 * Math.sin(tS * s.speed + s.phase);
    ctx.globalAlpha = s.base * (0.35 + t * 0.65);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, 0.7 + t * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ── Glacier silhouettes ──
   Crisp, sunlit glaciers: a bright white face, a cool-blue shadow side, a
   pale-cyan rim light. Two depth layers so the horizon feels layered. */
export function buildGlaciers(canvas: HTMLCanvasElement, W: number, H: number, PR: number) {
  canvas.width = Math.max(1, Math.floor(W * PR));
  canvas.height = Math.max(1, Math.floor(H * 0.55 * PR));
  const g = canvas.getContext("2d")!;
  g.setTransform(PR, 0, 0, PR, 0, 0);
  g.clearRect(0, 0, W, H * 0.55);

  const lh = H * 0.55; // local height

  // Helper — build a jagged silhouette
  const peakPath = (count: number, baseYFrac: number, amp: number, seed: number) => {
    const pts: [number, number][] = [];
    pts.push([0, lh]);
    for (let i = 0; i <= count; i++) {
      const x = (i / count) * W;
      const n1 = Math.sin(i * 1.7 + seed) * 0.55;
      const n2 = Math.cos(i * 0.9 + seed * 1.3) * 0.35;
      const n3 = Math.sin(i * 3.1 + seed * 0.7) * 0.18;
      const y = lh - (baseYFrac * lh + (n1 + n2 + n3) * amp * lh);
      pts.push([x, y]);
    }
    pts.push([W, lh]);
    return pts;
  };

  const drawLayer = (
    pts: [number, number][],
    faceFill: string,
    shadowFill: string,
    rim: string,
  ) => {
    // face (lit)
    g.fillStyle = faceFill;
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    g.fill();

    // shadow faces — for each peak, paint a leftward triangle in cool shadow
    g.fillStyle = shadowFill;
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i];
      const [npx, npy] = pts[i + 1] ?? pts[i];
      const [ppx, ppy] = pts[i - 1] ?? pts[i];
      // only the "downward" slopes (peak → valley going right) get shadow
      if (py < npy) {
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(npx, npy);
        g.lineTo((px + npx) / 2, Math.max(py, ppy) + (npy - py) * 0.2);
        g.closePath();
        g.fill();
      }
    }

    // rim light — bright pale-cyan edge along the lit side
    g.strokeStyle = rim;
    g.lineWidth = 1.4;
    g.lineJoin = "round";
    g.beginPath();
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i];
      if (i === 1) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.stroke();
  };

  // Far range — pastel, hazy
  drawLayer(
    peakPath(11, 0.38, 0.16, 0.3),
    "#e7f3fb",
    "rgba(150,188,216,0.55)",
    "rgba(255,255,255,0.85)",
  );

  // Close range — crisper, brighter
  drawLayer(
    peakPath(13, 0.24, 0.13, 1.7),
    "#fafeff",
    "rgba(120,168,204,0.6)",
    "rgba(255,255,255,0.95)",
  );
}

/* ── Ice floor ──
   Snow-white foreground with a subtle blue shadow under the horizon line
   and small snowdrift ridges. Used as the "ground" penguins stand on.

   Both background gradients only depend on H — cache them across frames and
   rebuild only when the viewport height changes. */
let floorCache: { h: number; floor: CanvasGradient; horizon: CanvasGradient } | null = null;
function getFloorGradients(ctx: CanvasRenderingContext2D, H: number) {
  if (floorCache && floorCache.h === H) return floorCache;
  const iceY = H * 0.82;
  const floor = ctx.createLinearGradient(0, iceY, 0, H);
  floor.addColorStop(0, "#d5eaf4");
  floor.addColorStop(0.3, "#eef7fb");
  floor.addColorStop(1, "#ffffff");
  const horizon = ctx.createLinearGradient(0, iceY, 0, iceY + 24);
  horizon.addColorStop(0, "rgba(120,168,204,0.35)");
  horizon.addColorStop(1, "rgba(120,168,204,0)");
  floorCache = { h: H, floor, horizon };
  return floorCache;
}

export function drawIceFloor(ctx: CanvasRenderingContext2D, W: number, H: number, tS: number) {
  const iceY = H * 0.82;
  const grads = getFloorGradients(ctx, H);
  ctx.fillStyle = grads.floor;
  ctx.fillRect(0, iceY, W, H - iceY);

  // Soft horizon shadow
  ctx.fillStyle = grads.horizon;
  ctx.fillRect(0, iceY, W, 24);

  // Snowdrifts — soft bumps gently shifting with a tiny tS sway so the
  // foreground doesn't feel frozen.
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(170,210,235,0.5)";
  ctx.lineWidth = 1;
  const driftCount = isMobile ? 4 : 7;
  for (let i = 0; i < driftCount; i++) {
    const cx = ((i + 0.5) / driftCount) * W + Math.sin(tS * 0.15 + i) * 6;
    const cy = iceY + 14 + (i % 2 === 0 ? 4 : 10);
    const rx = 70 + (i * 13) % 60;
    const ry = 12 + (i % 3) * 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Crisp horizon line
  ctx.strokeStyle = "rgba(170,210,235,0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, iceY);
  ctx.lineTo(W, iceY);
  ctx.stroke();
}
