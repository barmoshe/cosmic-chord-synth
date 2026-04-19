import { useEffect } from "react";
import * as Tone from "tone";
import { isMobile, type DrumName } from "../shared/constants";
import { haptic } from "../shared/helpers";
import type { RGB } from "../cyberpunk/types";
import { horizonY, buildBgCanvas } from "../cyberpunk/background";
import { drawNeonGrid } from "../cyberpunk/grid";
import { makeBuildings, drawBuildings, drawDistantSkyline } from "../cyberpunk/buildings";
import { makeRain, drawRain } from "../cyberpunk/rain";
import { createParticlePool, spawnParticles, drawParticles } from "../cyberpunk/particles";
import { createRipplePool, spawnRipple, drawRipples } from "../cyberpunk/ripples";
import { createDrums, layoutDrums, pickDrumStar, drawDrums } from "../cyberpunk/drums";
import { drawScanlineGlitch, drawWarp, drawFlash, drawVignette } from "../cyberpunk/overlays";

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
  drumCanvasRef?: React.MutableRefObject<HTMLCanvasElement | null>,
) {
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;
    const dcv = drumCanvasRef?.current ?? null;
    const dctx = dcv ? dcv.getContext("2d", { alpha: true }) : null;

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
      if (dcv && dctx) {
        dcv.width = Math.floor(W * PR);
        dcv.height = Math.floor(H * PR);
        dcv.style.width = W + "px";
        dcv.style.height = H + "px";
        dctx.setTransform(PR, 0, 0, PR, 0, 0);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Cached background (sky gradient + ground) ──
    const bgCanvas = document.createElement("canvas");
    const rebuildBg = () => buildBgCanvas(bgCanvas, W, H, PR);
    rebuildBg();
    window.addEventListener("resize", rebuildBg);

    // ── Scene state ──
    let buildings = makeBuildings(W, H);
    const rebuildBuildings = () => { buildings = makeBuildings(W, H); };
    window.addEventListener("resize", rebuildBuildings);

    const rain = makeRain(W, H);
    const particles = createParticlePool();
    const ripples = createRipplePool();
    const drums = createDrums();

    const relayoutDrums = () => layoutDrums(drums, W, H);
    relayoutDrums();
    window.addEventListener("resize", relayoutDrums);

    // ── Engine interface ──
    function addRipple(x: number, y: number, _z: number, col: RGB, intensity = 1) {
      spawnRipple(ripples, x, y, col, intensity);
    }
    function emitParticles(x: number, y: number, _z: number, col: RGB, count: number, vel: number) {
      spawnParticles(particles, x, y, col, count, vel);
    }
    function triggerDrum(name: DrumName, vel: number, auto = false, audioTime?: number) {
      const v = Math.max(0, Math.min(1, vel));
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
      addRipple,
      emitParticles,
      pickDrumStar: (x: number, y: number) => pickDrumStar(drums, x, y),
      triggerDrum,
      sectionTransition,
      flash,
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

      // Main scene canvas
      ctx.drawImage(bgCanvas, 0, 0, W, H);
      const gy = horizonY(H);
      gridOffset = (gridOffset + (0.8 + mid * 3.2) * dt * 60) % 48;
      drawNeonGrid(ctx, W, H, gy, mid, bass, gridOffset);
      drawDistantSkyline(ctx, W, gy);
      drawBuildings(ctx, buildings, H, gy, fftBuffer.current, tS, fc, flashIntensity.current);
      drawRain(ctx, rain, W, H, vol, high);
      drawRipples(ctx, ripples.pool);
      drawParticles(ctx, particles.pool);

      // Drum holo-cards on the elevated overlay canvas so they sit in front of
      // the NeonSkyline SVG background buildings. If no drum canvas was wired
      // up, fall back to the main canvas to preserve existing behaviour.
      if (dctx) {
        dctx.clearRect(0, 0, W, H);
        drawDrums(dctx, drums, bass, tS);
      } else {
        drawDrums(ctx, drums, bass, tS);
      }

      drawScanlineGlitch(ctx, W, H, tS, flashIntensity.current);
      drawWarp(ctx, W, H, warpState.current, dt);
      flashIntensity.current = drawFlash(ctx, W, H, flashIntensity.current);
      drawVignette(ctx, W, H);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", relayoutDrums);
      window.removeEventListener("resize", rebuildBg);
      window.removeEventListener("resize", rebuildBuildings);
      engineRef.current = null;
      bgCanvas.width = bgCanvas.height = 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (dcv && dctx) {
        dctx.setTransform(1, 0, 0, 1, 0, 0);
        dctx.clearRect(0, 0, dcv.width, dcv.height);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
