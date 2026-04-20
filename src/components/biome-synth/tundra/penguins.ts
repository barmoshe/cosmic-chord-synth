import { isMobile } from "../shared/constants";
import { rand } from "./utils";
import type { Penguin } from "./types";

export function makePenguins(W: number, H: number): Penguin[] {
  const count = isMobile ? 4 : 6;
  const baseY = H * 0.84;
  const out: Penguin[] = [];
  for (let i = 0; i < count; i++) {
    const scale = rand(0.85, 1.35);
    const facing: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    out.push({
      x: rand(W * 0.08, W * 0.92),
      y: baseY + rand(-6, 10),
      baseY: baseY + rand(-6, 10),
      vx: facing * rand(0.15, 0.55),
      facing,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: rand(6, 9),
      scale,
      mood: Math.random(),
      sliding: false,
      slideTime: 0,
    });
  }
  return out;
}

export function layoutPenguins(penguins: Penguin[], W: number, H: number) {
  const baseY = H * 0.84;
  penguins.forEach((p, i) => {
    p.baseY = baseY + (i % 2 === 0 ? 0 : 8);
    p.y = p.baseY;
    if (p.x < 0 || p.x > W) p.x = ((i + 0.5) / penguins.length) * W;
  });
}

// React to a big drum hit — kicks trigger a belly-slide.
export function triggerPenguinReact(penguins: Penguin[], vel: number) {
  if (vel < 0.35 || penguins.length === 0) return;
  const p = penguins[Math.floor(Math.random() * penguins.length)];
  if (p.sliding) return;
  p.sliding = true;
  p.slideTime = 1.1 + Math.random() * 0.6;
  p.vx = p.facing * (1.6 + vel * 1.6);
}

// Pure canvas penguin — chunky body, white belly, black back, orange beak/feet.
// Scaled-to-taste sizing parametrized off `scale`. Simple, readable, cute.
export function drawPenguin(
  ctx: CanvasRenderingContext2D,
  p: Penguin,
  tS: number,
) {
  const s = p.scale;
  const w = 28 * s;
  const h = 40 * s;
  const waddle = Math.sin(p.phase) * (p.sliding ? 0.06 : 0.15);
  const bob = p.sliding ? 0 : Math.abs(Math.sin(p.phase)) * 1.4 * s;
  const cx = p.x;
  const cy = p.y - bob;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(p.facing, 1);
  ctx.rotate(waddle);

  // Shadow on the ice
  ctx.save();
  ctx.translate(0, h * 0.5 + 4);
  ctx.scale(1, 0.35);
  ctx.fillStyle = "rgba(70,110,140,0.35)";
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (p.sliding) {
    // Belly-slide pose — horizontal oval body, flippers back
    ctx.save();
    ctx.rotate(-0.3);
    // belly (white underside facing camera)
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 1.1, h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    // back (dark over top)
    ctx.fillStyle = "#1a1f2a";
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.1, w * 1.05, h * 0.28, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // head
    ctx.fillStyle = "#1a1f2a";
    ctx.beginPath();
    ctx.arc(w * 0.9, -h * 0.18, h * 0.22, 0, Math.PI * 2);
    ctx.fill();
    // eye
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(w * 1.02, -h * 0.22, 2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0b0f18";
    ctx.beginPath();
    ctx.arc(w * 1.04, -h * 0.22, 1.1 * s, 0, Math.PI * 2);
    ctx.fill();
    // beak
    ctx.fillStyle = "#ff9a33";
    ctx.beginPath();
    ctx.moveTo(w * 1.12, -h * 0.12);
    ctx.lineTo(w * 1.28, -h * 0.08);
    ctx.lineTo(w * 1.12, -h * 0.04);
    ctx.closePath();
    ctx.fill();
    // motion lines
    ctx.strokeStyle = "rgba(160,200,230,0.7)";
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-w * 1.2 - i * 6, -4 + i * 3);
      ctx.lineTo(-w * 1.6 - i * 6, -4 + i * 3);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // Standing / waddling pose
    // Feet (toggle forward/back based on waddle phase)
    const footL = Math.sin(p.phase) * 3 * s;
    const footR = -footL;
    ctx.fillStyle = "#ff9a33";
    ctx.beginPath();
    ctx.ellipse(-w * 0.28, h * 0.5, w * 0.22, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse( w * 0.05 + footR, h * 0.5 + footL * 0.1, w * 0.22, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body — pear shaped (wider at bottom)
    ctx.fillStyle = "#1a1f2a"; // back/sides
    ctx.beginPath();
    ctx.moveTo(-w * 0.55, -h * 0.05);
    ctx.bezierCurveTo(-w * 0.65, h * 0.25, -w * 0.55, h * 0.52, -w * 0.18, h * 0.52);
    ctx.lineTo( w * 0.18, h * 0.52);
    ctx.bezierCurveTo( w * 0.55, h * 0.52,  w * 0.65, h * 0.25,  w * 0.55, -h * 0.05);
    ctx.bezierCurveTo( w * 0.5, -h * 0.3,   w * 0.25, -h * 0.42, 0, -h * 0.42);
    ctx.bezierCurveTo(-w * 0.25, -h * 0.42, -w * 0.5, -h * 0.3, -w * 0.55, -h * 0.05);
    ctx.closePath();
    ctx.fill();

    // Belly (bright white)
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(-w * 0.32, -h * 0.1);
    ctx.bezierCurveTo(-w * 0.42, h * 0.18, -w * 0.32, h * 0.46, 0, h * 0.46);
    ctx.bezierCurveTo( w * 0.32, h * 0.46,  w * 0.42, h * 0.18,  w * 0.32, -h * 0.1);
    ctx.bezierCurveTo( w * 0.25, -h * 0.28, -w * 0.25, -h * 0.28, -w * 0.32, -h * 0.1);
    ctx.closePath();
    ctx.fill();

    // Head (small bump on top-front; the body already covers most of it)
    ctx.fillStyle = "#1a1f2a";
    ctx.beginPath();
    ctx.arc(0, -h * 0.38, w * 0.36, 0, Math.PI * 2);
    ctx.fill();

    // Cheek (a soft pale arc under the eye — personality)
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.ellipse(w * 0.05, -h * 0.34, w * 0.18, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(w * 0.1, -h * 0.4, 2.4 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0b0f18";
    ctx.beginPath();
    ctx.arc(w * 0.13 + Math.sin(tS * 0.5 + p.mood * 3) * 0.6, -h * 0.4, 1.3 * s, 0, Math.PI * 2);
    ctx.fill();

    // Beak — small orange triangle
    ctx.fillStyle = "#ff9a33";
    ctx.beginPath();
    ctx.moveTo(w * 0.22, -h * 0.36);
    ctx.lineTo(w * 0.4,  -h * 0.32);
    ctx.lineTo(w * 0.22, -h * 0.28);
    ctx.closePath();
    ctx.fill();
    // beak ridge
    ctx.strokeStyle = "rgba(180,90,10,0.6)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(w * 0.22, -h * 0.32);
    ctx.lineTo(w * 0.4,  -h * 0.32);
    ctx.stroke();

    // Flippers — one tucked back, one swinging
    const flip = Math.sin(p.phase + Math.PI) * 0.6;
    ctx.fillStyle = "#1a1f2a";
    ctx.save();
    ctx.translate(-w * 0.5, -h * 0.05);
    ctx.rotate(flip * 0.3 - 0.1);
    ctx.beginPath();
    ctx.ellipse(0, h * 0.15, w * 0.12, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(w * 0.5, -h * 0.05);
    ctx.rotate(-flip * 0.3 + 0.1);
    ctx.beginPath();
    ctx.ellipse(0, h * 0.15, w * 0.12, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

export function updatePenguins(penguins: Penguin[], W: number, dt: number) {
  for (const p of penguins) {
    p.phase += p.phaseSpeed * dt * (p.sliding ? 1.8 : 1);
    if (p.sliding) {
      p.slideTime -= dt;
      p.x += p.vx;
      p.vx *= 0.985;
      if (p.slideTime <= 0) {
        p.sliding = false;
        p.vx = p.facing * rand(0.15, 0.55);
      }
    } else {
      p.x += p.vx;
      // occasionally flip direction
      if (Math.random() < 0.001) {
        p.facing = (p.facing === 1 ? -1 : 1) as 1 | -1;
        p.vx = p.facing * Math.abs(p.vx);
      }
    }
    // wrap at horizontal edges with a small turnaround margin
    if (p.x < -30) {
      p.facing = 1;
      p.vx = Math.abs(p.vx);
      p.x = -28;
    } else if (p.x > W + 30) {
      p.facing = -1;
      p.vx = -Math.abs(p.vx);
      p.x = W + 28;
    }
    // gentle vertical bob — tracks baseY
    p.y = p.baseY;
    // ignore W in dt not directly; we just needed bounds
  }
}

export function drawPenguins(
  ctx: CanvasRenderingContext2D,
  penguins: Penguin[],
  tS: number,
) {
  // Depth sort — farther penguins (lower y first? higher y = closer) painted later.
  const sorted = [...penguins].sort((a, b) => a.y - b.y);
  for (const p of sorted) drawPenguin(ctx, p, tS);
}
