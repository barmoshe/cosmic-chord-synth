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
  // Ground-row layout: drums bloom from the jungle floor in a horizontal band
  // above the DJ panel. On mobile the panel is taller, so drums lift higher.
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
  let bestD = 48 * 48;
  for (const d of drums) {
    const dx = clientX - d.x;
    const dy = clientY - d.y;
    const dd = dx * dx + dy * dy;
    if (dd < bestD) { bestD = dd; best = d; }
  }
  return best ? best.name : null;
}

// Drum buttons — hibiscus-style flowers with a stem and side leaves, matching
// the decorative ground flowers in JumpingMonkeys + /public/flowers.svg. Each
// drum keeps its own warm-palette tint so the lanes stay visually distinct
// (kick=gold, hat=amber, clap=coral, snare=rose).
export function drawDrums(
  ctx: CanvasRenderingContext2D,
  drums: DrumGlyph[],
  bass: number, tS: number,
) {
  for (const d of drums) {
    d.pulse *= 0.88;
    const bloom = 1 + bass * 0.35 + d.pulse * 0.5;
    const r = (26 + d.pulse * 18) * bloom + Math.sin(tS * 2) * 1.6;
    const cR = Math.floor(d.color[0] * 255);
    const cG = Math.floor(d.color[1] * 255);
    const cB = Math.floor(d.color[2] * 255);
    // Tonal stops for the petal gradient.
    const hiR = Math.min(255, cR + 60);
    const hiG = Math.min(255, cG + 60);
    const hiB = Math.min(255, cB + 60);
    const loR = Math.max(0, Math.floor(cR * 0.45));
    const loG = Math.max(0, Math.floor(cG * 0.45));
    const loB = Math.max(0, Math.floor(cB * 0.45));

    ctx.save();
    ctx.translate(d.x, d.y);

    // Stem drawn in local frame so it stays planted while the flower rotates.
    const stemLen = r * 2.4;
    const stemTopY = r * 0.45;
    const stemBotY = stemTopY + stemLen;
    ctx.save();
    ctx.strokeStyle = "#2d6a4f";
    ctx.lineWidth = Math.max(2, r * 0.12);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, stemBotY);
    ctx.bezierCurveTo(
      -r * 0.22, stemBotY - stemLen * 0.4,
      r * 0.18, stemTopY + stemLen * 0.4,
      0, stemTopY
    );
    ctx.stroke();
    const leafY = (stemTopY + stemBotY) / 2;
    ctx.fillStyle = "#206d44";
    ctx.beginPath();
    ctx.ellipse(-r * 0.5, leafY, r * 0.5, r * 0.22, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2d8f5a";
    ctx.beginPath();
    ctx.ellipse(r * 0.55, leafY - r * 0.45, r * 0.45, r * 0.2, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Flower head — rotates with time + pulse.
    ctx.save();
    ctx.rotate(tS * 0.15 + d.pulse * 0.6);
    ctx.shadowColor = `rgb(${cR},${cG},${cB})`;
    ctx.shadowBlur = 14 + d.pulse * 28;
    for (let pIdx = 0; pIdx < 5; pIdx++) {
      const ang = (pIdx / 5) * Math.PI * 2;
      ctx.save();
      ctx.rotate(ang);
      const grd = ctx.createRadialGradient(0, -r * 0.2, 1, 0, -r * 0.9, r * 0.85);
      grd.addColorStop(0,    `rgba(${hiR},${hiG},${hiB},0.95)`);
      grd.addColorStop(0.55, `rgba(${cR},${cG},${cB},0.92)`);
      grd.addColorStop(1,    `rgba(${loR},${loG},${loB},0.55)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.58, r * 0.42, r * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Amber core.
    ctx.shadowBlur = 0;
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.38);
    cg.addColorStop(0,   "#fef3c7");
    cg.addColorStop(0.7, "#fbbf24");
    cg.addColorStop(1,   "#b45309");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
    // Stamens appear as the flower blooms.
    if (d.pulse > 0.2) {
      const stamenA = Math.min(1, (d.pulse - 0.2) / 0.6);
      ctx.fillStyle = `rgba(255,240,133,${stamenA})`;
      ctx.beginPath(); ctx.arc(-r * 0.09, -r * 0.08, r * 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc( r * 0.10, -r * 0.05, r * 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc( 0,         r * 0.10, r * 0.06, 0, Math.PI * 2); ctx.fill();
    }
    // Letter label (K/H/C/S).
    ctx.fillStyle = "#0a1f14";
    ctx.font = `bold ${Math.floor(r * 0.42)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(d.label, 0, 0);
    ctx.restore();
    ctx.restore();
  }
}
