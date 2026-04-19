import { useEffect } from "react";
import * as Tone from "tone";
import { isMobile, type DrumName } from "../shared/constants";
import { clamp, haptic } from "../shared/helpers";
import type { RGB } from "../sea/types";
import {
  createWaveField, injectWaveAt, stepWave,
  drawWaveSurface, drawCaustics,
} from "../sea/wave";
import { buildFloor } from "../sea/seafloor";
import { drawSky, drawWaterBody, makeLightRays, drawLightRays } from "../sea/water";
import { makeBubbles, drawBubbles } from "../sea/bubbles";
import { makeFish, drawFish, scatterFishFrom } from "../sea/fish";
import { buildCorals, drawCorals, kickCoralsFrom } from "../sea/corals";
import { createParticlePool, spawnParticles, drawParticles } from "../sea/particles";
import { createRipplePool, spawnRipple, drawRipples } from "../sea/ripples";
import {
  createDrums, layoutDrums, pickDrumStar,
  burstFloorBubbles, drawDrums,
} from "../sea/drums";
import { drawWarp, drawFlash, drawVignette } from "../sea/overlays";

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

    const wave = createWaveField();

    const floorCanvas = document.createElement("canvas");
    const onResizeFloor = () => buildFloor(floorCanvas, W, H, PR);
    onResizeFloor();
    window.addEventListener("resize", onResizeFloor);

    const bubbles = makeBubbles(W, H);
    const fish = makeFish(W, H);
    let corals = buildCorals(W, H);
    const onResizeCorals = () => { corals = buildCorals(W, H); };
    window.addEventListener("resize", onResizeCorals);
    const rays = makeLightRays(W);

    const particles = createParticlePool();
    const ripples = createRipplePool();
    const drums = createDrums();
    const relayoutDrums = () => layoutDrums(drums, W, H);
    relayoutDrums();
    window.addEventListener("resize", relayoutDrums);

    function addRipple(x: number, y: number, _z: number, col: RGB, intensity = 1) {
      spawnRipple(ripples, x, y, col, intensity);
      injectWaveAt(wave, x, 4 + intensity * 6, W);
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
        emitParticles(d.x, d.y, 0, d.color, auto ? 4 : 12, auto ? 0.5 : 1.0);
        addRipple(d.x, d.y, 0, d.color, auto ? 0.5 : 1.1);
        injectWaveAt(wave, d.x, 6 + v * 10, W);
        scatterFishFrom(fish, d.x, d.y, (auto ? 1.2 : 2.6) * v);
        kickCoralsFrom(corals, d.x, v);
        if (name === "kick") {
          const f = (auto ? 0.08 : 0.22) * v;
          if (f > flashIntensity.current) flashIntensity.current = f;
          burstFloorBubbles(bubbles, d.x, H, auto ? 4 : 10);
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
      const mid = a.mid ?? 0;
      const high = a.high ?? 0;

      stepWave(wave, dt, bass);

      drawSky(ctx, W, H);
      drawWaterBody(ctx, W, H);
      drawLightRays(ctx, rays, W, H, mid, flashIntensity.current);
      drawCaustics(ctx, wave, W, H, mid);

      ctx.drawImage(floorCanvas, 0, H - H * 0.18, W, H * 0.18);
      drawWaveSurface(ctx, wave, W, H, flashIntensity.current);

      drawBubbles(ctx, bubbles, wave, W, H, tS, mid);
      drawFish(ctx, fish, W, H, tS, high);
      drawCorals(ctx, corals, tS, bass);
      drawRipples(ctx, ripples.pool);
      drawParticles(ctx, particles.pool);
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
      window.removeEventListener("resize", onResizeFloor);
      window.removeEventListener("resize", onResizeCorals);
      engineRef.current = null;
      floorCanvas.width = floorCanvas.height = 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
