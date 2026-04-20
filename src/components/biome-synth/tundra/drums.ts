import { DRUM_STARS, type DrumName } from "../shared/constants";
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
  // Drums rest on the ice-floor row just above the DJ panel.
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

// Ice-crystal drum stars — six-sided gem shape with a bright core and faceted
// outer points. Each drum tints the gem with its lane color so kick / hat /
// clap / snare stay visually distinct (warm-gold sparks over cold palette).
export function drawDrums(
  ctx: CanvasRenderingContext2D,
  drums: DrumGlyph[],
  bass: number, tS: number,
) {
  for (const d of drums) {
    d.pulse *= 0.88;
    const bloom = 1 + bass * 0.4 + d.pulse * 0.55;
    const r = (24 + d.pulse * 20) * bloom + Math.sin(tS * 2) * 1.4;
    const cR = Math.floor(d.color[0] * 255);
    const cG = Math.floor(d.color[1] * 255);
    const cB = Math.floor(d.color[2] * 255);
    const hiR = Math.min(255, cR + 70);
    const hiG = Math.min(255, cG + 70);
    const hiB = Math.min(255, cB + 70);

    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(tS * 0.12 + d.pulse * 0.4);

    // Outer glow
    ctx.shadowColor = `rgb(${cR},${cG},${cB})`;
    ctx.shadowBlur = 16 + d.pulse * 32;

    // Six-sided crystal — alternating long/short points for a faceted look.
    const points = 6;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const ang = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.52;
      const px = Math.cos(ang) * radius;
      const py = Math.sin(ang) * radius;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();

    const grd = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
    grd.addColorStop(0,   `rgba(${hiR},${hiG},${hiB},0.95)`);
    grd.addColorStop(0.55, `rgba(${cR},${cG},${cB},0.85)`);
    grd.addColorStop(1,   "rgba(8,20,51,0.75)");
    ctx.fillStyle = grd;
    ctx.fill();

    // Facet highlight — pale icy vertical streak.
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(234,246,255,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.lineTo(0, r * 0.9);
    ctx.stroke();

    // Core — icy white with the lane tint mixed in.
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.45);
    cg.addColorStop(0,   "#f4faff");
    cg.addColorStop(0.6, `rgba(${hiR},${hiG},${hiB},0.7)`);
    cg.addColorStop(1,   `rgba(${cR},${cG},${cB},0.2)`);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Stamen-like sparks bloom on strong hits.
    if (d.pulse > 0.2) {
      const sparkA = Math.min(1, (d.pulse - 0.2) / 0.6);
      ctx.fillStyle = `rgba(255,244,176,${sparkA})`;
      ctx.beginPath(); ctx.arc(-r * 0.18, -r * 0.12, r * 0.07, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc( r * 0.16, -r * 0.08, r * 0.07, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc( 0,         r * 0.15, r * 0.07, 0, Math.PI * 2); ctx.fill();
    }

    // Label (K/H/C/S).
    ctx.fillStyle = "#05122a";
    ctx.font = `bold ${Math.floor(r * 0.42)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(d.label, 0, 0);

    ctx.restore();
  }
}
