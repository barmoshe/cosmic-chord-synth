import { DRUM_STARS, type DrumName } from "../constants";
import type { DrumGlyph, RGB } from "./types";

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
  let bestD = 56 * 56;
  for (const d of drums) {
    const dx = clientX - d.x;
    const dy = clientY - d.y;
    const dd = dx * dx + dy * dy;
    if (dd < bestD) { bestD = dd; best = d; }
  }
  return best ? best.name : null;
}

export function drawDrums(
  ctx: CanvasRenderingContext2D,
  drums: DrumGlyph[],
  bass: number, tS: number,
) {
  for (const d of drums) {
    d.pulse *= 0.9;
    const bloom = 1 + bass * 0.35 + d.pulse * 0.6;
    const r = (26 + d.pulse * 18) * bloom;
    const cR = Math.floor(d.color[0] * 255);
    const cG = Math.floor(d.color[1] * 255);
    const cB = Math.floor(d.color[2] * 255);

    ctx.save();
    ctx.translate(d.x, d.y);

    // Outer hex holo frame
    ctx.strokeStyle = `rgba(${cR},${cG},${cB},0.85)`;
    ctx.shadowColor = `rgba(${cR},${cG},${cB},0.9)`;
    ctx.shadowBlur = 14 + d.pulse * 24;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const hx = Math.cos(ang) * r;
      const hy = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner scanline-filled disk
    ctx.shadowBlur = 0;
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.82);
    cg.addColorStop(0, `rgba(${cR},${cG},${cB},0.9)`);
    cg.addColorStop(0.7, `rgba(${Math.floor(cR * 0.5)},${Math.floor(cG * 0.5)},${Math.floor(cB * 0.5)},0.45)`);
    cg.addColorStop(1, "rgba(8,2,22,0.1)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    ctx.fill();

    // Scanline overlay inside the hex
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = `rgba(255,255,255,${0.12 + d.pulse * 0.2})`;
    ctx.lineWidth = 0.8;
    for (let sy = -r; sy < r; sy += 3) {
      ctx.beginPath();
      ctx.moveTo(-r, sy + (tS * 18) % 3);
      ctx.lineTo(r, sy + (tS * 18) % 3);
      ctx.stroke();
    }
    ctx.restore();

    // Label
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = `rgba(${cR},${cG},${cB},0.95)`;
    ctx.shadowBlur = 8;
    ctx.font = `bold ${Math.floor(r * 0.5)}px 'Orbitron', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(d.label, 0, 0);
    ctx.restore();
  }
}
