import { useEffect } from "react";
import * as Tone from "tone";
import { isMobile, PARTICLE_POOL, RIPPLE_POOL, DRUM_STARS, type DrumName } from "./constants";
import { clamp, haptic } from "./helpers";

type RGB = number[];

interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; col: RGB; rot: number; vr: number; alive: boolean; kind: 0 | 1; }
interface Ripple { x: number; y: number; r: number; maxR: number; col: RGB; alpha: number; alive: boolean; }
interface DrumGlyph { name: DrumName; x: number; y: number; color: RGB; label: string; pulse: number; }

interface Bubble {
  x: number; y: number; r: number; vy: number; wobblePhase: number;
  alive: boolean;
}

interface Fish {
  x: number; y: number; vx: number; vy: number;
  hue: number; size: number; phase: number;
}

interface Coral {
  baseX: number; baseY: number;
  segments: { len: number; angle: number; angVel: number; target: number; w: number }[];
  hue: string;
  baseAngle: number;
}

interface LightRay {
  x: number; width: number; speed: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function useSeaScene(
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

    // ── Wave heightfield (1D wave equation) ──
    const NSAMPLES = isMobile ? 96 : 160;
    const surfaceY = () => H * 0.18; // wave rest line
    let h = new Float32Array(NSAMPLES);
    let hPrev = new Float32Array(NSAMPLES);
    let hNext = new Float32Array(NSAMPLES);
    const C2 = 0.22; // wave propagation coefficient
    const DAMP = 0.992;

    const surfaceXAt = (i: number) => (i / (NSAMPLES - 1)) * W;
    const sampleHeight = (px: number) => {
      const t = clamp(px / W, 0, 1);
      const f = t * (NSAMPLES - 1);
      const i = Math.floor(f);
      const frac = f - i;
      const a = h[i];
      const b = h[Math.min(NSAMPLES - 1, i + 1)];
      return a + (b - a) * frac;
    };

    // ── Seafloor offscreen (cached) ──
    const floorCanvas = document.createElement("canvas");
    const buildFloor = () => {
      const fh = Math.floor(H * 0.18);
      floorCanvas.width = Math.max(1, Math.floor(W * PR));
      floorCanvas.height = Math.max(1, Math.floor(fh * PR));
      const fctx = floorCanvas.getContext("2d")!;
      fctx.setTransform(PR, 0, 0, PR, 0, 0);
      fctx.clearRect(0, 0, W, fh);
      // sand gradient
      const g = fctx.createLinearGradient(0, 0, 0, fh);
      g.addColorStop(0, "#1a3a52");
      g.addColorStop(0.5, "#2c5470");
      g.addColorStop(1, "#0a1f2e");
      fctx.fillStyle = g;
      fctx.fillRect(0, 0, W, fh);
      // dunes
      fctx.fillStyle = "rgba(10,30,50,0.55)";
      for (let i = 0; i < 5; i++) {
        const cx = (i / 4) * W + rand(-30, 30);
        fctx.beginPath();
        fctx.ellipse(cx, fh - 6, rand(60, 110), rand(10, 18), 0, Math.PI, Math.PI * 2);
        fctx.fill();
      }
      // rocks
      const rocks = isMobile ? 4 : 8;
      for (let i = 0; i < rocks; i++) {
        const rx = rand(0, W);
        const ry = fh - rand(2, 10);
        const rw = rand(10, 26);
        fctx.fillStyle = "rgba(5,20,32,0.85)";
        fctx.beginPath();
        fctx.ellipse(rx, ry, rw, rw * 0.55, 0, Math.PI, Math.PI * 2);
        fctx.fill();
      }
    };
    buildFloor();
    const onResizeFloor = () => buildFloor();
    window.addEventListener("resize", onResizeFloor);

    // ── Bubbles ──
    const bubbleCount = isMobile ? 40 : 80;
    const bubbles: Bubble[] = Array.from({ length: bubbleCount }, () => ({
      x: rand(0, W),
      y: rand(surfaceY(), H),
      r: rand(2, 6),
      vy: rand(0.3, 0.9),
      wobblePhase: rand(0, Math.PI * 2),
      alive: true,
    }));

    // ── Fish (boids) ──
    const fishCount = isMobile ? 18 : 38;
    const fish: Fish[] = Array.from({ length: fishCount }, () => ({
      x: rand(0, W),
      y: rand(H * 0.25, H * 0.85),
      vx: rand(-1.2, 1.2),
      vy: rand(-0.4, 0.4),
      hue: Math.random() < 0.5 ? 175 : 195, // teal / cyan
      size: rand(6, 11),
      phase: rand(0, Math.PI * 2),
    }));

    // ── Corals (almogs) ──
    const coralCount = isMobile ? 5 : 9;
    const corals: Coral[] = [];
    const buildCorals = () => {
      corals.length = 0;
      const palettes = ["#ff6b9d", "#ff8e72", "#c77dff", "#ff5a8a", "#7ae582"];
      for (let i = 0; i < coralCount; i++) {
        const baseX = (i + 0.5) / coralCount * W + rand(-30, 30);
        const baseY = H * 0.96;
        const segCount = Math.floor(rand(4, 7));
        const segments = [];
        for (let s = 0; s < segCount; s++) {
          segments.push({
            len: rand(14, 26) * (1 - s * 0.08),
            angle: rand(-0.2, 0.2),
            angVel: 0,
            target: rand(-0.15, 0.15),
            w: 6 - s * 0.6,
          });
        }
        corals.push({
          baseX, baseY, segments,
          hue: palettes[i % palettes.length],
          baseAngle: 0,
        });
      }
    };
    buildCorals();
    window.addEventListener("resize", buildCorals);

    // ── Light rays ──
    const rays: LightRay[] = Array.from({ length: 4 }, () => ({
      x: rand(0, W),
      width: rand(60, 140),
      speed: rand(0.05, 0.15),
    }));

    // ── Particle pool ──
    const particles: Particle[] = Array.from({ length: PARTICLE_POOL }, () => ({
      x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, col: [0, 0, 0], rot: 0, vr: 0, alive: false, kind: 0,
    }));
    let particleCursor = 0;

    // ── Ripple pool ──
    const ripples: Ripple[] = Array.from({ length: RIPPLE_POOL }, () => ({
      x: 0, y: 0, r: 0, maxR: 0, col: [0, 0, 0], alpha: 0, alive: false,
    }));
    let rippleCursor = 0;

    // ── Drum glyphs (sea anemones along seafloor) ──
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

    // ── Inject impulse into wave heightfield ──
    function injectWaveAt(px: number, amp: number) {
      const t = clamp(px / W, 0, 1);
      const center = Math.floor(t * (NSAMPLES - 1));
      const radius = 4;
      for (let i = -radius; i <= radius; i++) {
        const idx = center + i;
        if (idx < 1 || idx >= NSAMPLES - 1) continue;
        const falloff = (1 - Math.abs(i) / radius);
        h[idx] -= amp * falloff;
      }
    }

    // ── Engine interface ──
    function addRipple(x: number, y: number, _z: number, col: RGB, intensity = 1) {
      const r = ripples[rippleCursor];
      rippleCursor = (rippleCursor + 1) % ripples.length;
      r.x = x; r.y = y; r.r = 8; r.maxR = 110 + intensity * 60;
      r.col = col; r.alpha = 0.5 * intensity; r.alive = true;
      // also drive a real wave
      injectWaveAt(x, 4 + intensity * 6);
    }
    function emitParticles(x: number, y: number, _z: number, col: RGB, count: number, vel: number) {
      // upward bubble-like burst
      for (let i = 0; i < count; i++) {
        const p = particles[particleCursor];
        particleCursor = (particleCursor + 1) % particles.length;
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const s = rand(1.0, 2.5) * vel;
        p.x = x; p.y = y;
        p.vx = Math.cos(a) * s * 0.5;
        p.vy = Math.sin(a) * s * 0.4 - rand(1.2, 2.6);
        p.maxLife = rand(60, 110);
        p.life = p.maxLife;
        p.col = col;
        p.rot = a;
        p.vr = rand(-0.05, 0.05);
        p.kind = Math.random() < 0.6 ? 1 : 0;
        p.alive = true;
      }
    }
    function pickDrumStar(clientX: number, clientY: number): DrumName | null {
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
    function triggerDrum(name: DrumName, vel: number, auto = false, audioTime?: number) {
      const v = clamp(vel, 0, 1);
      const d = drums.find((g) => g.name === name);
      audioRef.current?.triggerDrum?.(name, v, audioTime);
      const run = () => {
        if (!d) return;
        d.pulse = Math.max(d.pulse, v * (auto ? 0.6 : 1.2));
        emitParticles(d.x, d.y, 0, d.color, auto ? 4 : 12, auto ? 0.5 : 1.0);
        addRipple(d.x, d.y, 0, d.color, auto ? 0.5 : 1.1);
        // surface wave impulse at the anemone's x
        injectWaveAt(d.x, 6 + v * 10);
        // scatter fish
        for (const f of fish) {
          const dx = f.x - d.x;
          const dy = f.y - d.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
          if (dist < 200) {
            const force = (1 - dist / 200) * (auto ? 1.2 : 2.6) * v;
            f.vx += (dx / dist) * force;
            f.vy += (dy / dist) * force;
          }
        }
        // angular impulse on corals
        for (const c of corals) {
          const dx = c.baseX - d.x;
          if (Math.abs(dx) < 240) {
            const sign = dx >= 0 ? 1 : -1;
            for (const seg of c.segments) {
              seg.angVel += sign * (0.04 + v * 0.06) / (1 + Math.abs(dx) * 0.005);
            }
          }
        }
        if (name === "kick") {
          const f = (auto ? 0.08 : 0.22) * v;
          if (f > flashIntensity.current) flashIntensity.current = f;
          // burst of bubbles from seafloor near the kick anemone
          for (let i = 0; i < (auto ? 4 : 10); i++) {
            const b = bubbles[Math.floor(Math.random() * bubbles.length)];
            b.x = d.x + rand(-30, 30);
            b.y = H - rand(8, 20);
            b.r = rand(3, 7);
            b.vy = rand(0.6, 1.4);
            b.alive = true;
          }
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
    let driveT = 0;

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

      // ── Solve wave equation ──
      const c2 = C2 * (1 + bass * 0.5);
      // gentle continuous drive
      driveT += dt;
      const driveAmp = 0.12 + bass * 0.6;
      h[2] += Math.sin(driveT * 1.7) * driveAmp;
      h[NSAMPLES - 3] += Math.sin(driveT * 1.3 + 0.7) * driveAmp;
      if (Math.random() < 0.02) {
        const idx = Math.floor(rand(2, NSAMPLES - 3));
        h[idx] -= rand(0.5, 2.0);
      }
      for (let i = 1; i < NSAMPLES - 1; i++) {
        hNext[i] = (2 * h[i] - hPrev[i] + c2 * (h[i - 1] - 2 * h[i] + h[i + 1])) * DAMP;
      }
      hNext[0] = hNext[1] * 0.5;
      hNext[NSAMPLES - 1] = hNext[NSAMPLES - 2] * 0.5;
      const tmp = hPrev;
      hPrev = h;
      h = hNext;
      hNext = tmp;

      // ── Sky (above water) ──
      const skyGrad = ctx.createLinearGradient(0, 0, 0, surfaceY());
      skyGrad.addColorStop(0, "#0a1f2e");
      skyGrad.addColorStop(1, "#1a4d6e");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, surfaceY());

      // ── Underwater body ──
      const waterGrad = ctx.createLinearGradient(0, surfaceY(), 0, H);
      waterGrad.addColorStop(0, "#0a3a5e");
      waterGrad.addColorStop(0.45, "#063a52");
      waterGrad.addColorStop(1, "#021829");
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, surfaceY() - 4, W, H - surfaceY() + 4);

      // ── Light rays (additive) ──
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const ray of rays) {
        ray.x += ray.speed * (1 + mid * 0.5);
        if (ray.x > W + ray.width) ray.x = -ray.width;
        const intensity = 0.08 + flashIntensity.current * 0.12 + mid * 0.05;
        const lg = ctx.createLinearGradient(ray.x, surfaceY(), ray.x + ray.width * 0.4, H);
        lg.addColorStop(0, `rgba(168,230,207,${intensity})`);
        lg.addColorStop(1, "rgba(168,230,207,0)");
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.moveTo(ray.x, surfaceY());
        ctx.lineTo(ray.x + ray.width, surfaceY());
        ctx.lineTo(ray.x + ray.width + 60, H);
        ctx.lineTo(ray.x - 30, H);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // ── Caustics on seafloor (driven by wave heightfield) ──
      const floorTop = H * 0.82;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 1; i < NSAMPLES - 1; i++) {
        const slope = h[i + 1] - h[i - 1];
        const brightness = clamp(0.06 + Math.abs(slope) * 0.04 + mid * 0.05, 0, 0.35);
        const x = surfaceXAt(i);
        const x2 = surfaceXAt(i + 1);
        const cg = ctx.createLinearGradient(x, floorTop, x, H);
        cg.addColorStop(0, `rgba(168,230,207,${brightness})`);
        cg.addColorStop(1, "rgba(168,230,207,0)");
        ctx.fillStyle = cg;
        ctx.fillRect(x - 1, floorTop, x2 - x + 2, H - floorTop);
      }
      ctx.restore();

      // ── Seafloor ──
      ctx.drawImage(floorCanvas, 0, H - H * 0.18, W, H * 0.18);

      // ── Wave surface (filled water above the curve from above) ──
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, surfaceY());
      for (let i = 0; i < NSAMPLES; i++) {
        ctx.lineTo(surfaceXAt(i), surfaceY() + h[i]);
      }
      ctx.lineTo(W, surfaceY());
      ctx.lineTo(W, 0);
      ctx.closePath();
      ctx.fillStyle = "rgba(10,31,46,0.0)";
      ctx.fill();
      ctx.restore();

      // surface highlight stroke
      ctx.save();
      ctx.strokeStyle = `rgba(168,230,207,${0.35 + flashIntensity.current * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(168,230,207,0.5)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, surfaceY() + h[0]);
      for (let i = 1; i < NSAMPLES; i++) {
        ctx.lineTo(surfaceXAt(i), surfaceY() + h[i]);
      }
      ctx.stroke();
      ctx.restore();

      // sub-surface foam band
      ctx.save();
      ctx.fillStyle = "rgba(168,230,207,0.08)";
      ctx.beginPath();
      ctx.moveTo(0, surfaceY() + h[0]);
      for (let i = 1; i < NSAMPLES; i++) {
        ctx.lineTo(surfaceXAt(i), surfaceY() + h[i]);
      }
      ctx.lineTo(W, surfaceY() + 12);
      ctx.lineTo(0, surfaceY() + 12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // ── Bubbles ──
      for (const b of bubbles) {
        if (!b.alive) continue;
        b.y -= b.vy * (1 + mid * 1.2);
        b.x += Math.sin(tS * 1.4 + b.wobblePhase) * 0.4;
        const sh = sampleHeight(b.x);
        const surfaceAtX = surfaceY() + sh;
        if (b.y < surfaceAtX + 4) {
          // pop & respawn
          b.x = rand(0, W);
          b.y = rand(H * 0.6, H);
          b.r = rand(2, 6);
          b.vy = rand(0.3, 0.9);
          continue;
        }
        ctx.save();
        ctx.strokeStyle = "rgba(168,230,207,0.55)";
        ctx.fillStyle = "rgba(122,229,130,0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // highlight
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── Fish boids ──
      const speedBoost = 1 + high * 0.8;
      for (let i = 0; i < fish.length; i++) {
        const f = fish[i];
        let cohX = 0, cohY = 0, sepX = 0, sepY = 0, aliX = 0, aliY = 0, n = 0;
        for (let j = 0; j < fish.length; j++) {
          if (i === j) continue;
          const o = fish[j];
          const dx = o.x - f.x;
          const dy = o.y - f.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 80 * 80) {
            cohX += o.x; cohY += o.y;
            aliX += o.vx; aliY += o.vy;
            n++;
            if (d2 < 26 * 26) {
              const d = Math.sqrt(d2) + 0.001;
              sepX -= dx / d; sepY -= dy / d;
            }
          }
        }
        if (n > 0) {
          cohX = cohX / n - f.x;
          cohY = cohY / n - f.y;
          aliX = aliX / n - f.vx;
          aliY = aliY / n - f.vy;
          f.vx += cohX * 0.0012 + aliX * 0.04 + sepX * 0.05;
          f.vy += cohY * 0.0012 + aliY * 0.04 + sepY * 0.05;
        }
        // confine vertically (stay between water surface + seafloor)
        const topBound = surfaceY() + 30;
        const botBound = H * 0.86;
        if (f.y < topBound) f.vy += 0.06;
        if (f.y > botBound) f.vy -= 0.06;
        // damp & cap speed
        const sp = Math.hypot(f.vx, f.vy);
        const maxSp = 1.6;
        if (sp > maxSp) { f.vx = (f.vx / sp) * maxSp; f.vy = (f.vy / sp) * maxSp; }
        f.vx *= 0.99; f.vy *= 0.99;
        f.x += f.vx * speedBoost;
        f.y += f.vy * speedBoost;
        // wrap horizontally
        if (f.x < -20) f.x = W + 20;
        if (f.x > W + 20) f.x = -20;
        // draw fish
        const ang = Math.atan2(f.vy, f.vx);
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(ang);
        const wig = Math.sin(tS * 8 + f.phase) * 0.6;
        ctx.fillStyle = f.hue === 175 ? "rgba(122,229,130,0.85)" : "rgba(108,217,255,0.85)";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.ellipse(0, 0, f.size, f.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // tail
        ctx.beginPath();
        ctx.moveTo(-f.size, 0);
        ctx.lineTo(-f.size - 6, -3 + wig);
        ctx.lineTo(-f.size - 6, 3 + wig);
        ctx.closePath();
        ctx.fill();
        // eye
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.beginPath();
        ctx.arc(f.size * 0.55, -f.size * 0.12, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── Corals (almogs) — spring-damped ──
      for (const c of corals) {
        c.baseAngle = Math.sin(tS * 0.7) * 0.06 * (1 + bass * 0.8);
        // update segment springs
        for (const seg of c.segments) {
          const restore = (seg.target - seg.angle) * 0.03;
          seg.angVel += restore;
          seg.angVel *= 0.9;
          seg.angle += seg.angVel;
        }
        // draw chain
        ctx.save();
        ctx.translate(c.baseX, c.baseY);
        ctx.rotate(c.baseAngle);
        ctx.strokeStyle = c.hue;
        ctx.shadowColor = c.hue;
        ctx.shadowBlur = 8;
        ctx.lineCap = "round";
        let x = 0, y = 0, ang = -Math.PI / 2;
        for (const seg of c.segments) {
          ang += seg.angle;
          const nx = x + Math.cos(ang) * seg.len;
          const ny = y + Math.sin(ang) * seg.len;
          ctx.lineWidth = seg.w;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(nx, ny);
          ctx.stroke();
          x = nx; y = ny;
        }
        // tip bulb
        ctx.fillStyle = c.hue;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── Ripples ──
      for (const r of ripples) {
        if (!r.alive) continue;
        r.r += 2.4;
        r.alpha *= 0.96;
        if (r.r >= r.maxR || r.alpha < 0.02) { r.alive = false; continue; }
        ctx.save();
        ctx.strokeStyle = `rgba(${Math.floor(r.col[0] * 255)},${Math.floor(r.col[1] * 255)},${Math.floor(r.col[2] * 255)},${r.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // ── Particles (mini bubbles / sparks) ──
      for (const p of particles) {
        if (!p.alive) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.vx *= 0.985;
        p.rot += p.vr;
        p.life -= 1;
        if (p.life <= 0) { p.alive = false; continue; }
        const t = p.life / p.maxLife;
        const alpha = Math.min(1, t * 1.3);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${Math.floor(p.col[0] * 255)},${Math.floor(p.col[1] * 255)},${Math.floor(p.col[2] * 255)})`;
        if (p.kind === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(0, 0, 3, 1.4, p.rot, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // ── Drum anemones ──
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

        // tentacles — radial, retract on pulse
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

      // ── Warp overlay (cyan → teal → seafoam) ──
      if (warpState.current?.on) {
        warpState.current.t += dt;
        const w = Math.min(1, warpState.current.t / 2);
        const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
        g.addColorStop(0, `rgba(108,217,255,${0.25 + w * 0.5})`);
        g.addColorStop(0.5, `rgba(122,229,130,${0.18 + w * 0.3})`);
        g.addColorStop(1, "rgba(4,26,46,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Flash overlay (seafoam) ──
      if (flashIntensity.current > 0.01) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.65, flashIntensity.current);
        ctx.fillStyle = "#a8e6cf";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        flashIntensity.current *= 0.9;
      }

      // ── Vignette ──
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
      window.removeEventListener("resize", onResizeFloor);
      window.removeEventListener("resize", buildCorals);
      engineRef.current = null;
      floorCanvas.width = floorCanvas.height = 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
