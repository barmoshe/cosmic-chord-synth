import { useEffect } from "react";
import * as Tone from "tone";
import { isMobile, type DrumName } from "../shared/constants";
import { clamp, haptic } from "../shared/helpers";
import type { RGB } from "../tundra/types";
import {
  buildSky, drawIceFloor,
  createStars, drawStars,
  buildGlaciers,
} from "../tundra/background";
import { makeSnow, drawSnow } from "../tundra/snow";
import { createParticlePool, spawnParticles, drawParticles } from "../tundra/particles";
import { createRipplePool, spawnRipple, drawRipples } from "../tundra/ripples";
import { createDrums, layoutDrums, pickDrumStar, drawDrums } from "../tundra/drums";
import { drawWarp, drawFlash, drawVignette } from "../tundra/overlays";
import {
  makePenguins, layoutPenguins, updatePenguins, drawPenguins, triggerPenguinReact,
} from "../tundra/penguins";

export function useTundraScene(
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

    // Offscreen sky + glacier silhouettes — regenerated on resize, not per frame.
    const skyCanvas = document.createElement("canvas");
    const glCanvas = document.createElement("canvas");
    const rebuildOffscreens = () => {
      buildSky(skyCanvas, W, H, PR);
      buildGlaciers(glCanvas, W, H, PR);
    };
    rebuildOffscreens();
    window.addEventListener("resize", rebuildOffscreens);

    let stars = createStars(W, H);
    let snow = makeSnow(W, H);
    const penguins = makePenguins(W, H);
    const resetScatter = () => {
      stars = createStars(W, H);
      snow = makeSnow(W, H);
      layoutPenguins(penguins, W, H);
    };
    window.addEventListener("resize", resetScatter);

    const particles = createParticlePool();
    const ripples = createRipplePool();
    const drums = createDrums();
    const relayoutDrums = () => layoutDrums(drums, W, H);
    relayoutDrums();
    window.addEventListener("resize", relayoutDrums);

    function addRipple(x: number, y: number, _z: number, col: RGB, intensity = 1) {
      spawnRipple(ripples, x, y, col, intensity);
    }
    function emitParticles(x: number, y: number, _z: number, col: RGB, count: number, vel: number) {
      spawnParticles(particles, x, y, col, count, vel);
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
          triggerPenguinReact(penguins, v);
        }
      };
      if (audioTime !== undefined) Tone.Draw.schedule(run, audioTime);
      else run();
      if (!auto) haptic(name === "kick" ? 15 : 6);
    }
    function sectionTransition(col: RGB) {
      if (0.7 > flashIntensity.current) flashIntensity.current = 0.7;
      addRipple(W / 2, H / 2, 0, col, 2.4);
      triggerPenguinReact(penguins, 1);
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
      const _mid = a.mid ?? 0;
      const high = a.high ?? 0;

      // Back → front pipeline: sky, shimmer dots, distant glaciers, ice floor,
      // penguins on ice, snow in front, particles/ripples over everything,
      // drum stars on top, warp/flash/vignette frame.
      ctx.drawImage(skyCanvas, 0, 0, W, H);
      drawStars(ctx, stars, tS);
      ctx.drawImage(glCanvas, 0, H * 0.35, W, H * 0.55);
      drawIceFloor(ctx, W, H, tS);

      updatePenguins(penguins, W, dt);
      drawPenguins(ctx, penguins, tS);

      drawSnow(ctx, snow, W, H, tS, high);

      drawRipples(ctx, ripples.pool);
      drawParticles(ctx, particles.pool, high);
      drawDrums(ctx, drums, bass, tS);

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
      window.removeEventListener("resize", rebuildOffscreens);
      window.removeEventListener("resize", resetScatter);
      engineRef.current = null;
      skyCanvas.width = skyCanvas.height = 0;
      glCanvas.width = glCanvas.height = 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
