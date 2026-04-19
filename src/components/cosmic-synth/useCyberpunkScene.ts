import { useEffect } from "react";
import * as Tone from "tone";
import { isMobile, PARTICLE_POOL, RIPPLE_POOL, DRUM_STARS, type DrumName } from "./constants";
import { clamp, haptic } from "./helpers";

type RGB = number[];

interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; col: RGB; rot: number; vr: number; alive: boolean; kind: 0 | 1; }
interface Ripple { x: number; y: number; r: number; maxR: number; col: RGB; alpha: number; alive: boolean; }
interface DrumGlyph { name: DrumName; x: number; y: number; color: RGB; label: string; pulse: number; }

interface RainStreak {
  x: number; y: number; speed: number; len: number; hue: number; alpha: number;
}

interface Building {
  x: number; w: number; h: number; color: string; stripe: string;
  windowRows: number; windowCols: number; windowSeed: number;
  lightPhase: number; bandIdx: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function useCyberpunkScene(
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>,
  audioRef: React.MutableRefObject<any>,
  analysisRef: React.MutableRefObject<any>,
  fftBuffer: React.MutableRefObject<Float32Array>,
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

    // ── Background cached layers (regenerated on resize) ──
    const horizonY = () => H * 0.62;
    const bgCanvas = document.createElement("canvas");
    const buildBg = () => {
      bgCanvas.width = Math.max(1, Math.floor(W * PR));
      bgCanvas.height = Math.max(1, Math.floor(H * PR));
      const bctx = bgCanvas.getContext("2d")!;
      bctx.setTransform(PR, 0, 0, PR, 0, 0);
      // Night sky vertical gradient
      const sky = bctx.createLinearGradient(0, 0, 0, horizonY());
      sky.addColorStop(0, "#07021a");
      sky.addColorStop(0.55, "#12062e");
      sky.addColorStop(1, "#2a0a3f");
      bctx.fillStyle = sky;
      bctx.fillRect(0, 0, W, horizonY());
      // Horizon neon band
      const band = bctx.createLinearGradient(0, horizonY() - 40, 0, horizonY() + 8);
      band.addColorStop(0, "rgba(157, 0, 255, 0)");
      band.addColorStop(0.6, "rgba(255, 43, 214, 0.35)");
      band.addColorStop(1, "rgba(33, 231, 255, 0.55)");
      bctx.fillStyle = band;
      bctx.fillRect(0, horizonY() - 40, W, 50);
      // Ground base
      bctx.fillStyle = "#05020f";
      bctx.fillRect(0, horizonY(), W, H - horizonY());
    };
    buildBg();
    window.addEventListener("resize", buildBg);

    // ── Skyline buildings (data model — canvas draws every frame with FFT) ──
    const makeBuildings = (): Building[] => {
      const count = isMobile ? 10 : 16;
      const minH = H * 0.18;
      const maxH = H * 0.42;
      const spacing = W / count;
      const out: Building[] = [];
      for (let i = 0; i < count; i++) {
        const w = rand(spacing * 0.55, spacing * 0.95);
        const h = rand(minH, maxH);
        const x = i * spacing + (spacing - w) * 0.5;
        const cool = Math.random() < 0.55;
        out.push({
          x, w, h,
          color: cool ? "#0d0624" : "#180a2e",
          stripe: cool ? "#21e7ff" : "#ff2bd6",
          windowRows: Math.max(6, Math.floor(h / 18)),
          windowCols: Math.max(3, Math.floor(w / 10)),
          windowSeed: Math.floor(rand(0, 10000)),
          lightPhase: rand(0, Math.PI * 2),
          bandIdx: i,
        });
      }
      return out;
    };
    let buildings = makeBuildings();
    const rebuildBuildings = () => { buildings = makeBuildings(); };
    window.addEventListener("resize", rebuildBuildings);

    // ── Rain streaks ──
    const rainCount = isMobile ? 180 : 360;
    const rain: RainStreak[] = Array.from({ length: rainCount }, () => ({
      x: rand(0, W),
      y: rand(-H, H),
      speed: rand(5, 11),
      len: rand(14, 34),
      hue: Math.random() < 0.18 ? 0 : Math.random() < 0.35 ? 1 : 2, // 0 magenta, 1 purple, 2 cyan
      alpha: rand(0.25, 0.8),
    }));

    // ── Particle pool (sparks/glitch shards) ──
    const particles: Particle[] = Array.from({ length: PARTICLE_POOL }, () => ({
      x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, col: [0, 0, 0], rot: 0, vr: 0, alive: false, kind: 0,
    }));
    let particleCursor = 0;

    // ── Ripple pool (circular shockwaves on drum hits) ──
    const ripples: Ripple[] = Array.from({ length: RIPPLE_POOL }, () => ({
      x: 0, y: 0, r: 0, maxR: 0, col: [0, 0, 0], alpha: 0, alive: false,
    }));
    let rippleCursor = 0;

    // ── Drum holo-cards ──
    const drums: DrumGlyph[] = DRUM_STARS.map((d) => ({
      name: d.name,
      x: 0,
      y: 0,
      color: d.color as unknown as RGB,
      label: d.label,
      pulse: 0,
    }));
    const layoutDrums = () => {
      const isNarrow = W <= 640;
      const groundReserve = isNarrow ? 138 : 122;
      const y = H - groundReserve;
      const xs = [0.14, 0.38, 0.62, 0.86];
      drums.forEach((d, i) => {
        d.x = W * xs[i];
        d.y = y;
      });
    };
    layoutDrums();
    window.addEventListener("resize", layoutDrums);

    // ── Engine interface ──
    function addRipple(x: number, y: number, _z: number, col: RGB, intensity = 1) {
      const r = ripples[rippleCursor];
      rippleCursor = (rippleCursor + 1) % ripples.length;
      r.x = x; r.y = y; r.r = 10; r.maxR = 120 + intensity * 70;
      r.col = col; r.alpha = 0.6 * intensity; r.alive = true;
    }
    function emitParticles(x: number, y: number, _z: number, col: RGB, count: number, vel: number) {
      for (let i = 0; i < count; i++) {
        const p = particles[particleCursor];
        particleCursor = (particleCursor + 1) % particles.length;
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const s = rand(1.6, 3.2) * vel;
        p.x = x; p.y = y;
        p.vx = Math.cos(a) * s;
        p.vy = Math.sin(a) * s - rand(0.4, 1.2);
        p.maxLife = rand(50, 90);
        p.life = p.maxLife;
        p.col = col;
        p.rot = a;
        p.vr = rand(-0.2, 0.2);
        p.kind = Math.random() < 0.5 ? 1 : 0;
        p.alive = true;
      }
    }
    function pickDrumStar(clientX: number, clientY: number): DrumName | null {
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
    function triggerDrum(name: DrumName, vel: number, auto = false, audioTime?: number) {
      const v = clamp(vel, 0, 1);
      const d = drums.find((g) => g.name === name);
      audioRef.current?.triggerDrum?.(name, v, audioTime);
      const run = () => {
        if (!d) return;
        d.pulse = Math.max(d.pulse, v * (auto ? 0.6 : 1.2));
        emitParticles(d.x, d.y, 0, d.color, auto ? 5 : 14, auto ? 0.6 : 1.1);
        addRipple(d.x, d.y, 0, d.color, auto ? 0.55 : 1.2);
        if (name === "kick") {
          const f = (auto ? 0.1 : 0.28) * v;
          if (f > flashIntensity.current) flashIntensity.current = f;
        }
      };
      if (audioTime !== undefined) Tone.Draw.schedule(run, audioTime);
      else run();
      if (!auto) haptic(name === "kick" ? 15 : 6);
    }
    function sectionTransition(col: RGB) {
      if (0.75 > flashIntensity.current) flashIntensity.current = 0.75;
      addRipple(W / 2, H / 2, 0, col, 2.5);
    }
    function flash(v: number) { if (v > flashIntensity.current) flashIntensity.current = v; }

    engineRef.current = {
      addRipple, emitParticles, pickDrumStar, triggerDrum, sectionTransition, flash,
      s2w: (x: number, y: number) => [x, y, 0] as [number, number, number],
    };

    // ── Animation loop ──
    let lastTs = performance.now();
    let gridOffset = 0;

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
      const vol = a.vol ?? 0;

      // ── Draw cached background ──
      ctx.drawImage(bgCanvas, 0, 0, W, H);

      // ── Neon grid floor (perspective) ──
      const gy = horizonY();
      gridOffset = (gridOffset + (0.8 + mid * 3.2) * dt * 60) % 48;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      // horizontal lines receding to horizon
      ctx.strokeStyle = `rgba(255,43,214,${0.35 + mid * 0.25})`;
      ctx.shadowColor = "rgba(255,43,214,0.7)";
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1;
      for (let i = 1; i < 18; i++) {
        const t = (i + gridOffset / 48) / 18;
        const y = gy + t * t * (H - gy);
        if (y >= H) continue;
        ctx.globalAlpha = clamp(0.15 + (1 - t) * 0.65, 0, 0.9);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      // vanishing vertical lines
      ctx.strokeStyle = `rgba(33,231,255,${0.4 + bass * 0.3})`;
      ctx.shadowColor = "rgba(33,231,255,0.7)";
      ctx.shadowBlur = 8;
      const vpX = W / 2;
      const vpY = gy - 6;
      ctx.globalAlpha = 0.7;
      for (let i = -12; i <= 12; i++) {
        const x = vpX + i * (W / 10);
        ctx.beginPath();
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      ctx.restore();

      // ── Distant skyline silhouette (behind buildings) ──
      ctx.save();
      ctx.fillStyle = "#070216";
      ctx.beginPath();
      ctx.moveTo(0, gy);
      let seed = 0;
      for (let x = 0; x <= W; x += 24) {
        seed = (seed * 9301 + 49297) % 233280;
        const n = (seed / 233280);
        const h = 14 + n * 42;
        ctx.lineTo(x, gy - h);
      }
      ctx.lineTo(W, gy);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // ── Buildings with FFT-reactive window lights ──
      const fft = fftBuffer.current;
      for (const b of buildings) {
        const bx = b.x;
        const by = gy - b.h;
        // Body
        ctx.fillStyle = b.color;
        ctx.fillRect(bx, by, b.w, b.h);
        // Outline stripe
        ctx.fillStyle = b.stripe;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(bx + b.w / 2 - 0.6, by + 6, 1.2, b.h - 10);
        ctx.globalAlpha = 1;
        // Antenna + neon tip
        if (b.h > H * 0.3) {
          ctx.strokeStyle = b.stripe;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bx + b.w / 2, by);
          ctx.lineTo(bx + b.w / 2, by - 18);
          ctx.stroke();
          ctx.fillStyle = b.stripe;
          ctx.beginPath();
          ctx.arc(bx + b.w / 2, by - 18, 2 + Math.sin(tS * 2 + b.lightPhase) * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        // Window grid — FFT-driven per-building band intensity
        // Map building index to a bin in the FFT buffer for pulse variation
        const bin = Math.min(fft.length - 1, Math.floor((b.bandIdx / buildings.length) * (fft.length * 0.5)));
        const fftVal = fft ? clamp((fft[bin] + 100) / 80, 0, 1) : 0; // dB → 0..1
        const lit = 0.45 + fftVal * 0.45 + Math.sin(tS * 1.4 + b.lightPhase) * 0.08;
        const cellW = b.w / b.windowCols;
        const cellH = b.h / b.windowRows;
        let s = b.windowSeed;
        for (let row = 0; row < b.windowRows; row++) {
          for (let col = 0; col < b.windowCols; col++) {
            s = (s * 9301 + 49297) % 233280;
            const on = (s / 233280) < 0.62;
            if (!on) continue;
            const wx = bx + col * cellW + 1.5;
            const wy = by + row * cellH + 2;
            const ww = Math.max(1, cellW - 3);
            const wh = Math.max(1, cellH - 4);
            // Flicker select a small portion each frame
            const flick = ((s + fc) % 97) < 5 ? 0.3 : 1;
            ctx.fillStyle = b.stripe;
            ctx.globalAlpha = clamp(lit * flick, 0, 1);
            ctx.fillRect(wx, wy, ww, wh);
          }
        }
        ctx.globalAlpha = 1;
        // Soft neon outline glow on pulse
        if (flashIntensity.current > 0.05) {
          ctx.save();
          ctx.strokeStyle = b.stripe;
          ctx.shadowColor = b.stripe;
          ctx.shadowBlur = 10 * flashIntensity.current;
          ctx.globalAlpha = flashIntensity.current * 0.7;
          ctx.lineWidth = 1;
          ctx.strokeRect(bx + 0.5, by + 0.5, b.w - 1, b.h - 1);
          ctx.restore();
        }
      }

      // ── Rain streaks ──
      const speedBoost = 1 + vol * 1.6 + high * 0.8;
      const hues = ["#ff2bd6", "#9d00ff", "#21e7ff"];
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (const r of rain) {
        r.y += r.speed * speedBoost;
        r.x += r.speed * 0.12; // slight slant
        if (r.y > H + 10 || r.x > W + 10) {
          r.x = rand(-20, W);
          r.y = -r.len - rand(0, 120);
        }
        const col = hues[r.hue];
        ctx.strokeStyle = col;
        ctx.globalAlpha = r.alpha;
        ctx.lineWidth = 1;
        ctx.shadowColor = col;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - r.len * 0.12, r.y - r.len);
        ctx.stroke();
      }
      ctx.restore();

      // ── Ripples (neon shockwaves) ──
      for (const r of ripples) {
        if (!r.alive) continue;
        r.r += 3.2;
        r.alpha *= 0.955;
        if (r.r >= r.maxR || r.alpha < 0.02) { r.alive = false; continue; }
        const cR = Math.floor(r.col[0] * 255);
        const cG = Math.floor(r.col[1] * 255);
        const cB = Math.floor(r.col[2] * 255);
        ctx.save();
        ctx.strokeStyle = `rgba(${cR},${cG},${cB},${r.alpha})`;
        ctx.shadowColor = `rgba(${cR},${cG},${cB},${r.alpha})`;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // ── Particles (neon sparks) ──
      for (const p of particles) {
        if (!p.alive) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.99;
        p.rot += p.vr;
        p.life -= 1;
        if (p.life <= 0) { p.alive = false; continue; }
        const t = p.life / p.maxLife;
        const alpha = Math.min(1, t * 1.4);
        const cR = Math.floor(p.col[0] * 255);
        const cG = Math.floor(p.col[1] * 255);
        const cB = Math.floor(p.col[2] * 255);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${cR},${cG},${cB})`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 6;
        if (p.kind === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.rotate(p.rot);
          ctx.fillRect(-3, -0.8, 6, 1.6);
        }
        ctx.restore();
      }

      // ── Drum holo-cards ──
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

      // ── Scanline glitch overlay (flash + flashIntensity) ──
      if (flashIntensity.current > 0.02) {
        const bands = 3;
        for (let b = 0; b < bands; b++) {
          const bandY = ((tS * 220 + b * H / bands) % H);
          const bandH = 6 + flashIntensity.current * 14;
          ctx.save();
          ctx.globalAlpha = Math.min(0.45, flashIntensity.current * 0.5);
          ctx.fillStyle = b === 0 ? "#ff2bd6" : b === 1 ? "#21e7ff" : "#9d00ff";
          ctx.fillRect(0, bandY, W, bandH);
          ctx.restore();
        }
      }

      // ── Warp overlay (neon wash on warp phase) ──
      if (warpState.current?.on) {
        warpState.current.t += dt;
        const w = Math.min(1, warpState.current.t / 2);
        const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
        g.addColorStop(0, `rgba(255,43,214,${0.3 + w * 0.5})`);
        g.addColorStop(0.5, `rgba(33,231,255,${0.2 + w * 0.3})`);
        g.addColorStop(1, "rgba(10,4,26,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Flash overlay ──
      if (flashIntensity.current > 0.01) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.55, flashIntensity.current);
        ctx.fillStyle = "#ff2bd6";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        flashIntensity.current *= 0.9;
      }

      // ── Vignette ──
      const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.75)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", layoutDrums);
      window.removeEventListener("resize", buildBg);
      window.removeEventListener("resize", rebuildBuildings);
      engineRef.current = null;
      bgCanvas.width = bgCanvas.height = 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
