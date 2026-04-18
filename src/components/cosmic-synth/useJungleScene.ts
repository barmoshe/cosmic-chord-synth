import { useEffect } from "react";
import * as Tone from "tone";
import { isMobile, PARTICLE_POOL, RIPPLE_POOL, DRUM_STARS, type DrumName } from "./constants";
import { clamp, haptic } from "./helpers";

type RGB = number[];

interface Firefly { x: number; y: number; vx: number; vy: number; hue: number; phase: number; speed: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; col: RGB; rot: number; vr: number; kind: 0 | 1; alive: boolean; }
interface Ripple { x: number; y: number; r: number; maxR: number; col: RGB; alpha: number; alive: boolean; }
interface DrumGlyph { name: DrumName; x: number; y: number; color: RGB; label: string; pulse: number; }
interface Tree { x: number; scale: number; seed: number; layer: number; sway: number; }

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function drawTree(ctx: CanvasRenderingContext2D, t: Tree, baseY: number, timeS: number, bassEnergy: number) {
  const h = 160 * t.scale;
  const w = 28 * t.scale;
  const bendPhase = Math.sin(timeS * 0.5 + t.seed * 7) * (0.4 + bassEnergy * 1.2);
  const alpha = t.layer === 0 ? 0.5 : t.layer === 1 ? 0.7 : t.layer === 2 ? 0.92 : 1.0;

  ctx.save();
  ctx.translate(t.x, baseY);
  ctx.globalAlpha = alpha;

  // trunk
  ctx.fillStyle = t.layer === 0 ? "#081a11" : t.layer === 1 ? "#0c2a1b" : t.layer === 2 ? "#143d28" : "#1a4d33";
  ctx.beginPath();
  ctx.moveTo(-w * 0.18, 0);
  ctx.quadraticCurveTo(bendPhase * 4, -h * 0.55, w * 0.14 + bendPhase * 6, -h);
  ctx.lineTo(w * 0.22 + bendPhase * 6, -h);
  ctx.quadraticCurveTo(bendPhase * 5, -h * 0.55, w * 0.22, 0);
  ctx.closePath();
  ctx.fill();

  // canopy blobs
  const canopyX = w * 0.2 + bendPhase * 6;
  const canopyY = -h - 4;
  const blobs = 5;
  for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2 + t.seed;
    const r = 22 * t.scale + Math.sin(timeS + i) * 2;
    ctx.beginPath();
    ctx.fillStyle = t.layer === 0 ? "#0e2617" : t.layer === 1 ? "#174a2d" : t.layer === 2 ? "#206d44" : "#2d8a58";
    ctx.arc(canopyX + Math.cos(a) * 18 * t.scale, canopyY + Math.sin(a) * 12 * t.scale, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // hanging banana cluster (mid/front layers only)
  if (t.layer >= 1) {
    const bx = canopyX + 12 * t.scale;
    const by = canopyY + 8 * t.scale;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(bendPhase * 0.3);
    ctx.fillStyle = "#ffe14d";
    ctx.strokeStyle = "#8b6914";
    ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      ctx.save();
      ctx.rotate((k - 1) * 0.25);
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.quadraticCurveTo(0, 10, 3, 14);
      ctx.quadraticCurveTo(6, 10, 3, -1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  ctx.restore();
}

export function useJungleScene(
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>,
  audioRef: React.MutableRefObject<any>,
  analysisRef: React.MutableRefObject<any>,
  _fftBuffer: React.MutableRefObject<Float32Array>,
  _scaleRef: React.MutableRefObject<string>,
  engineRef: React.MutableRefObject<any>,
  flashIntensity: React.MutableRefObject<number>,
  warpState: React.MutableRefObject<any>,
  frameCount: React.MutableRefObject<number>,
  rafRef: React.MutableRefObject<number | null>,
  analyze: () => void,
) {
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;

    const PR = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);
    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = Math.floor(W * PR);
      cv.height = Math.floor(H * PR);
      cv.style.width = W + "px";
      cv.style.height = H + "px";
      ctx.setTransform(PR, 0, 0, PR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Trees (4 parallax layers: 0=far, 1=mid, 2=near, 3=foreground) ──
    const trees: Tree[] = [];
    const layerCounts = isMobile ? [7, 6, 5, 2] : [12, 10, 7, 3];
    for (let layer = 0; layer < 4; layer++) {
      const count = layerCounts[layer];
      for (let i = 0; i < count; i++) {
        trees.push({
          x: rand(-60, W + 60),
          scale: layer === 0 ? rand(0.55, 0.8)
            : layer === 1 ? rand(0.9, 1.15)
            : layer === 2 ? rand(1.2, 1.55)
            : rand(1.5, 1.9),
          seed: Math.random() * 100,
          layer,
          sway: rand(0.5, 1.5),
        });
      }
    }

    // ── Offscreen mountain silhouette (cached) ──
    const mtCanvas = document.createElement("canvas");
    const buildMountains = () => {
      mtCanvas.width = Math.max(1, Math.floor(W * PR));
      mtCanvas.height = Math.max(1, Math.floor(H * 0.45 * PR));
      const mctx = mtCanvas.getContext("2d")!;
      mctx.setTransform(PR, 0, 0, PR, 0, 0);
      mctx.clearRect(0, 0, W, H * 0.45);
      // far range
      mctx.fillStyle = "#0c2a1b";
      mctx.beginPath();
      mctx.moveTo(0, H * 0.45);
      const peaks = 7;
      for (let i = 0; i <= peaks; i++) {
        const x = (i / peaks) * W;
        const noise = Math.sin(i * 1.7) * 0.5 + Math.cos(i * 0.9) * 0.3;
        const y = H * 0.45 - (H * 0.18 + noise * H * 0.08);
        mctx.lineTo(x, y);
      }
      mctx.lineTo(W, H * 0.45);
      mctx.closePath();
      mctx.fill();
      // closer range
      mctx.fillStyle = "#143d28";
      mctx.beginPath();
      mctx.moveTo(0, H * 0.45);
      for (let i = 0; i <= peaks + 2; i++) {
        const x = (i / (peaks + 2)) * W;
        const noise = Math.sin(i * 2.3 + 1) * 0.4;
        const y = H * 0.45 - (H * 0.1 + noise * H * 0.05);
        mctx.lineTo(x, y);
      }
      mctx.lineTo(W, H * 0.45);
      mctx.closePath();
      mctx.fill();
    };
    buildMountains();

    // ── Offscreen undergrowth (ferns + rocks, cached) ──
    const ugCanvas = document.createElement("canvas");
    const buildUndergrowth = () => {
      ugCanvas.width = Math.max(1, Math.floor(W * PR));
      ugCanvas.height = Math.max(1, Math.floor(H * 0.18 * PR));
      const uctx = ugCanvas.getContext("2d")!;
      uctx.setTransform(PR, 0, 0, PR, 0, 0);
      uctx.clearRect(0, 0, W, H * 0.18);
      const fernCount = isMobile ? 14 : 26;
      for (let i = 0; i < fernCount; i++) {
        const fx = (i / fernCount) * W + rand(-12, 12);
        const fy = H * 0.18 - rand(0, 8);
        const fh = rand(18, 36);
        uctx.save();
        uctx.translate(fx, fy);
        uctx.strokeStyle = "rgba(82,183,136,0.55)";
        uctx.lineWidth = 1.2;
        for (let b = -2; b <= 2; b++) {
          uctx.beginPath();
          uctx.moveTo(0, 0);
          uctx.quadraticCurveTo(b * 8, -fh * 0.5, b * 14, -fh);
          uctx.stroke();
        }
        uctx.restore();
      }
      const rockCount = isMobile ? 5 : 9;
      for (let i = 0; i < rockCount; i++) {
        const rx = rand(0, W);
        const ry = H * 0.18 - rand(0, 4);
        const rw = rand(14, 28);
        const rh = rw * 0.55;
        uctx.fillStyle = "rgba(14,38,23,0.9)";
        uctx.beginPath();
        uctx.ellipse(rx, ry, rw, rh, 0, Math.PI, Math.PI * 2);
        uctx.fill();
      }
    };
    buildUndergrowth();

    const rebuildOffscreens = () => { buildMountains(); buildUndergrowth(); };
    window.addEventListener("resize", rebuildOffscreens);

    // ── Mist bands (3 drifting horizontal layers) ──
    const mistBands = [
      { y: 0.42, speed: 0.018, alpha: 0.06, h: 80, off: 0 },
      { y: 0.55, speed: 0.028, alpha: 0.05, h: 110, off: 0 },
      { y: 0.70, speed: 0.012, alpha: 0.04, h: 140, off: 0 },
    ];

    // ── Fireflies ──
    const fireflyCount = isMobile ? 120 : 260;
    const fireflies: Firefly[] = [];
    for (let i = 0; i < fireflyCount; i++) {
      fireflies.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: rand(-0.25, 0.25),
        vy: rand(-0.4, -0.05),
        hue: Math.random() < 0.7 ? 80 : 52, // 80=lime, 52=banana
        phase: Math.random() * Math.PI * 2,
        speed: rand(1.2, 2.6),
      });
    }

    // ── Particle pool (leaves + banana bits) ──
    const particles: Particle[] = Array.from({ length: PARTICLE_POOL }, () => ({
      x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, col: [0, 0, 0], rot: 0, vr: 0, kind: 0, alive: false,
    }));
    let particleCursor = 0;

    // ── Ripple pool ──
    const ripples: Ripple[] = Array.from({ length: RIPPLE_POOL }, () => ({
      x: 0, y: 0, r: 0, maxR: 0, col: [0, 0, 0], alpha: 0, alive: false,
    }));
    let rippleCursor = 0;

    // ── Drum glyphs positioned in a ring around center ──
    const drums: DrumGlyph[] = DRUM_STARS.map((d) => ({
      name: d.name,
      x: 0,
      y: 0,
      color: d.color as unknown as RGB,
      label: d.label,
      pulse: 0,
    }));
    const layoutDrums = () => {
      const cx = W / 2;
      const cy = H / 2;
      const r = Math.min(W, H) * 0.28;
      drums.forEach((d, i) => {
        const a = DRUM_STARS[i].angle - Math.PI / 2;
        d.x = cx + Math.cos(a) * r;
        d.y = cy + Math.sin(a) * r;
      });
    };
    layoutDrums();
    window.addEventListener("resize", layoutDrums);

    // ── Engine interface ──
    function addRipple(x: number, y: number, _z: number, col: RGB, intensity = 1) {
      const r = ripples[rippleCursor];
      rippleCursor = (rippleCursor + 1) % ripples.length;
      r.x = x; r.y = y; r.r = 8; r.maxR = 120 + intensity * 60;
      r.col = col; r.alpha = 0.55 * intensity; r.alive = true;
    }
    function emitParticles(x: number, y: number, _z: number, col: RGB, count: number, vel: number) {
      // spiral burst — angles equally spaced, gentle outward + upward bias
      for (let i = 0; i < count; i++) {
        const p = particles[particleCursor];
        particleCursor = (particleCursor + 1) % particles.length;
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const s = rand(1.6, 3.2) * vel;
        p.x = x; p.y = y;
        p.vx = Math.cos(a) * s;
        p.vy = Math.sin(a) * s * 0.6 - rand(0.8, 2.0);
        p.maxLife = rand(70, 120);
        p.life = p.maxLife;
        p.col = col;
        p.rot = a;
        p.vr = (i % 2 === 0 ? 1 : -1) * rand(0.04, 0.14);
        p.kind = Math.random() < 0.55 ? 1 : 0; // more flowers/bananas, fewer leaves
        p.alive = true;
      }
    }
    function pickDrumStar(clientX: number, clientY: number): DrumName | null {
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
    function triggerDrum(name: DrumName, vel: number, auto = false, audioTime?: number) {
      const v = clamp(vel, 0, 1);
      const d = drums.find((g) => g.name === name);
      audioRef.current?.triggerDrum?.(name, v, audioTime);
      const run = () => {
        if (!d) return;
        d.pulse = Math.max(d.pulse, v * (auto ? 0.6 : 1.2));
        emitParticles(d.x, d.y, 0, d.color, auto ? 4 : 10, auto ? 0.4 : 0.9);
        addRipple(d.x, d.y, 0, d.color, auto ? 0.5 : 1.1);
        if (name === "kick") {
          const f = (auto ? 0.06 : 0.18) * v;
          if (f > flashIntensity.current) flashIntensity.current = f;
        }
      };
      if (audioTime !== undefined) Tone.Draw.schedule(run, audioTime);
      else run();
      if (!auto) haptic(name === "kick" ? 15 : 6);
    }
    function sectionTransition(col: RGB) {
      if (0.7 > flashIntensity.current) flashIntensity.current = 0.7;
      addRipple(W / 2, H / 2, 0, col, 2.4);
    }
    function flash(v: number) { if (v > flashIntensity.current) flashIntensity.current = v; }

    engineRef.current = {
      addRipple, emitParticles, pickDrumStar, triggerDrum, sectionTransition, flash,
      s2w: (x: number, y: number) => [x, y, 0] as [number, number, number],
    };

    // ── Animation loop ──
    let lastTs = performance.now();
    const frame = () => {
      rafRef.current = requestAnimationFrame(frame);
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      const tS = now / 1000;
      const fc = frameCount.current++;

      if (fc % 6 === 0) analyze();
      const a = analysisRef.current || {};
      const bass = a.bass ?? 0;
      const mid = a.mid ?? 0;
      const high = a.high ?? 0;

      // Three-stop sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#0a1f14");
      grad.addColorStop(0.45, "#143d28");
      grad.addColorStop(1, "#2d1b0a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Radial sun glow at 78% (stronger, warmer)
      const horizon = ctx.createRadialGradient(W * 0.5, H * 0.78, 20, W * 0.5, H * 0.78, H * 0.55);
      horizon.addColorStop(0, "rgba(245,158,11,0.28)");
      horizon.addColorStop(0.5, "rgba(180,90,20,0.12)");
      horizon.addColorStop(1, "rgba(245,158,11,0)");
      ctx.fillStyle = horizon;
      ctx.fillRect(0, 0, W, H);

      // Distant mountain silhouette (cached)
      ctx.drawImage(mtCanvas, 0, H * 0.30, W, H * 0.45);

      // Drifting mist bands (driven by mid-band FFT)
      for (const m of mistBands) {
        m.off += m.speed * (1 + mid * 0.6);
        const my = H * m.y;
        const mAlpha = m.alpha + mid * 0.04;
        const mg = ctx.createLinearGradient(0, my - m.h * 0.5, 0, my + m.h * 0.5);
        mg.addColorStop(0, `rgba(255,255,255,0)`);
        mg.addColorStop(0.5, `rgba(255,255,255,${mAlpha})`);
        mg.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.fillStyle = mg;
        ctx.fillRect(0, my - m.h * 0.5, W, m.h);
      }

      // Fireflies
      for (const f of fireflies) {
        f.x += f.vx + Math.sin(tS * 0.7 + f.phase) * 0.15;
        f.y += f.vy * (1 + mid * 0.8);
        if (f.y < -10) { f.y = H + 10; f.x = Math.random() * W; }
        if (f.x < -10) f.x = W + 10;
        if (f.x > W + 10) f.x = -10;
        const brightness = 0.5 + 0.5 * Math.sin(tS * f.speed + f.phase) + mid * 0.4;
        const size = 1.4 + brightness * 1.8;
        ctx.save();
        ctx.globalAlpha = Math.min(1, 0.3 + brightness * 0.8);
        ctx.fillStyle = f.hue === 80 ? "#a3e635" : "#ffe14d";
        ctx.shadowColor = ctx.fillStyle as string;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(f.x, f.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Tree layers back → front (4 layers, parallax)
      const groundY = H * 0.95;
      for (let layer = 0; layer < 4; layer++) {
        const parallax = (layer + 1) * 8;
        const offsetX = (tS * parallax * 0.1) % W;
        for (const t of trees) {
          if (t.layer !== layer) continue;
          const drawX = ((t.x - offsetX) % (W + 120) + W + 120) % (W + 120) - 60;
          drawTree(ctx, { ...t, x: drawX }, groundY + (3 - layer) * 6, tS, bass);
        }
      }

      // Ground strip
      const g2 = ctx.createLinearGradient(0, groundY, 0, H);
      g2.addColorStop(0, "#0e2617");
      g2.addColorStop(1, "#050d08");
      ctx.fillStyle = g2;
      ctx.fillRect(0, groundY, W, H - groundY);

      // Undergrowth (ferns + rocks, cached) — sits along ground
      ctx.drawImage(ugCanvas, 0, groundY - H * 0.18 + 12, W, H * 0.18);

      // Ripples
      for (const r of ripples) {
        if (!r.alive) continue;
        r.r += 2.6;
        r.alpha *= 0.962;
        if (r.r >= r.maxR || r.alpha < 0.02) { r.alive = false; continue; }
        ctx.save();
        ctx.strokeStyle = `rgba(${Math.floor(r.col[0] * 255)},${Math.floor(r.col[1] * 255)},${Math.floor(r.col[2] * 255)},${r.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Particles (leaves + banana bits)
      for (const p of particles) {
        if (!p.alive) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.vx *= 0.985;
        p.rot += p.vr;
        p.life -= 1;
        if (p.life <= 0) { p.alive = false; continue; }
        const t = p.life / p.maxLife;
        const alpha = Math.min(1, t * 1.3);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = alpha;
        if (p.kind === 1) {
          // banana bit
          ctx.fillStyle = "#ffe14d";
          ctx.strokeStyle = "#8b6914";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(-5, 0);
          ctx.quadraticCurveTo(0, -4, 6, -1);
          ctx.quadraticCurveTo(3, 3, -5, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // leaf
          ctx.fillStyle = `rgb(${Math.floor(p.col[0] * 255)},${Math.floor(p.col[1] * 255)},${Math.floor(p.col[2] * 255)})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, 5, 2.3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Drum glyphs — 5-petal tropical flowers (bass-bloom)
      for (const d of drums) {
        d.pulse *= 0.88;
        const bloom = 1 + bass * 0.35 + d.pulse * 0.5;
        const r = (16 + d.pulse * 14) * bloom + Math.sin(tS * 2) * 1.2;
        const cR = Math.floor(d.color[0] * 255);
        const cG = Math.floor(d.color[1] * 255);
        const cB = Math.floor(d.color[2] * 255);
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(tS * 0.15 + d.pulse * 0.6);
        ctx.shadowColor = `rgb(${cR},${cG},${cB})`;
        ctx.shadowBlur = 14 + d.pulse * 28;
        // 5 petals
        for (let pIdx = 0; pIdx < 5; pIdx++) {
          const ang = (pIdx / 5) * Math.PI * 2;
          ctx.save();
          ctx.rotate(ang);
          const grd = ctx.createRadialGradient(0, -r * 0.55, 1, 0, -r * 0.55, r * 0.65);
          grd.addColorStop(0, `rgba(${cR},${cG},${cB},0.95)`);
          grd.addColorStop(1, `rgba(${cR},${cG},${cB},0.25)`);
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.ellipse(0, -r * 0.55, r * 0.42, r * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        // center disk
        ctx.shadowBlur = 0;
        const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.35);
        cg.addColorStop(0, "#ffe14d");
        cg.addColorStop(1, "#b45309");
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
        ctx.fill();
        // label
        ctx.fillStyle = "#0a1f14";
        ctx.font = `bold ${Math.floor(r * 0.42)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(d.label, 0, 0);
        ctx.restore();
      }

      // Warp overlay
      if (warpState.current?.on) {
        warpState.current.t += dt;
        const w = Math.min(1, warpState.current.t / 2);
        const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
        g.addColorStop(0, `rgba(163,230,53,${0.25 + w * 0.5})`);
        g.addColorStop(0.6, `rgba(45,106,79,${0.15 + w * 0.3})`);
        g.addColorStop(1, "rgba(10,31,20,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      // Flash overlay (white-ish energy from section transitions / kick)
      if (flashIntensity.current > 0.01) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.7, flashIntensity.current);
        ctx.fillStyle = "#ffe14d";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        flashIntensity.current *= 0.9;
      }

      // Vignette (tighter)
      const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.34, W / 2, H / 2, Math.max(W, H) * 0.72);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.65)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", layoutDrums);
      window.removeEventListener("resize", rebuildOffscreens);
      engineRef.current = null;
      // dispose offscreen canvases
      mtCanvas.width = mtCanvas.height = 0;
      ugCanvas.width = ugCanvas.height = 0;
      // clear canvas so next scene (e.g. space) starts clean
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
