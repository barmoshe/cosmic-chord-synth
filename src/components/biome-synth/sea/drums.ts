import { DRUM_STARS, type DrumName } from "../shared/constants";
import { rand } from "./utils";
import type { DrumGlyph, RGB, Bubble } from "./types";

export function createDrums(): DrumGlyph[] {
  return DRUM_STARS.map((d) => ({
    name: d.name,
    x: 0,
    y: 0,
    color: d.color as unknown as RGB,
    label: d.label,
    pulse: 0,
  }));
}

export function layoutDrums(drums: DrumGlyph[], W: number, H: number) {
  const isNarrow = W <= 640;
  const groundReserve = isNarrow ? 138 : 122;
  const y = H - groundReserve;
  const xs = [0.14, 0.38, 0.62, 0.86];
  drums.forEach((d, i) => {
    d.x = W * xs[i];
    d.y = y;
  });
}

export function pickDrumStar(drums: DrumGlyph[], clientX: number, clientY: number): DrumName | null {
  let best: DrumGlyph | null = null;
  let bestD = 52 * 52;
  for (const d of drums) {
    const dx = clientX - d.x;
    const dy = clientY - d.y;
    const dd = dx * dx + dy * dy;
    if (dd < bestD) { bestD = dd; best = d; }
  }
  return best ? best.name : null;
}

export function burstFloorBubbles(bubbles: Bubble[], x: number, H: number, n: number) {
  for (let i = 0; i < n; i++) {
    const b = bubbles[Math.floor(Math.random() * bubbles.length)];
    b.x = x + rand(-30, 30);
    b.y = H - rand(8, 20);
    b.r = rand(3, 7);
    b.vy = rand(0.6, 1.4);
    b.alive = true;
  }
}

export function drawDrums(ctx: CanvasRenderingContext2D, drums: DrumGlyph[], bass: number, tS: number) {
  for (const d of drums) {
    d.pulse *= 0.88;
    const bloom = 1 + bass * 0.3 + d.pulse * 0.55;
    const r = (24 + d.pulse * 16) * bloom;
    const cR = Math.floor(d.color[0] * 255);
    const cG = Math.floor(d.color[1] * 255);
    const cB = Math.floor(d.color[2] * 255);

    ctx.save();
    ctx.translate(d.x, d.y);

    // base disk (rock anchor)
    ctx.fillStyle = "rgba(10,30,50,0.85)";
    ctx.beginPath();
    ctx.ellipse(0, r * 0.55, r * 1.1, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // tentacles
    const tentN = 14;
    const tentLen = r * (0.9 + d.pulse * 0.7);
    ctx.strokeStyle = `rgba(${cR},${cG},${cB},0.85)`;
    ctx.shadowColor = `rgba(${cR},${cG},${cB},0.9)`;
    ctx.shadowBlur = 10 + d.pulse * 22;
    ctx.lineCap = "round";
    ctx.lineWidth = 2.4;
    for (let i = 0; i < tentN; i++) {
      const a = (i / tentN) * Math.PI * 2;
      const wig = Math.sin(tS * 2 + i) * 4;
      const ex = Math.cos(a) * tentLen + Math.cos(a + Math.PI / 2) * wig * 0.3;
      const ey = Math.sin(a) * tentLen * 0.8 + Math.sin(a + Math.PI / 2) * wig * 0.3 - r * 0.1;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.1);
      ctx.quadraticCurveTo(Math.cos(a) * tentLen * 0.5, Math.sin(a) * tentLen * 0.4 - r * 0.1, ex, ey);
      ctx.stroke();
    }

    // pulsing core
    ctx.shadowBlur = 0;
    const cg = ctx.createRadialGradient(0, -r * 0.1, 0, 0, -r * 0.1, r * 0.55);
    cg.addColorStop(0, `rgba(255,240,245,0.95)`);
    cg.addColorStop(0.6, `rgba(${cR},${cG},${cB},0.9)`);
    cg.addColorStop(1, `rgba(${Math.floor(cR * 0.4)},${Math.floor(cG * 0.4)},${Math.floor(cB * 0.4)},0.7)`);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // label
    ctx.fillStyle = "#04101a";
    ctx.font = `bold ${Math.floor(r * 0.42)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(d.label, 0, -r * 0.1);
    ctx.restore();
  }
}
