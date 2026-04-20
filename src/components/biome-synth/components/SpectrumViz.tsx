import { useEffect, useRef } from "react";
import { noteColor } from "../shared/helpers";
import { BASE_MIDI } from "../shared/constants";

interface SpectrumVizProps {
  fftBuffer: React.MutableRefObject<Float32Array>;
  bars?: number;
  height?: number;
}

/* SpectrumViz — 64-bar live FFT display anchored above the DJ panel.
   Reuses the already-smoothed `fftBuffer` from `useAudioEngine` so there's
   zero extra analysis cost. Each bar is colour-mapped with `noteColor`
   so the spectrum reads as a rainbow gradient across the playable range. */
export default function SpectrumViz({ fftBuffer, bars = 64, height = 42 }: SpectrumVizProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const onResize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    onResize();
    window.addEventListener("resize", onResize);

    const draw = () => {
      const buf = fftBuffer.current;
      if (!buf) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const binsPerBar = Math.max(1, Math.floor(buf.length / bars));
      const barW = w / bars;
      const gap = Math.max(1, barW * 0.18);
      const usableW = barW - gap;

      for (let i = 0; i < bars; i++) {
        let sum = 0;
        const start = i * binsPerBar;
        for (let j = 0; j < binsPerBar; j++) sum += buf[start + j] || 0;
        const v = Math.min(1, (sum / binsPerBar) * 1.6);
        const barH = Math.max(1.5, v * h);
        const midi = BASE_MIDI + Math.floor((i / bars) * 36);
        const [r, g, b] = noteColor(midi);
        const rr = Math.round(r * 255);
        const gg = Math.round(g * 255);
        const bb = Math.round(b * 255);
        ctx.fillStyle = `rgba(${rr}, ${gg}, ${bb}, ${0.35 + v * 0.45})`;
        const x = i * barW + gap * 0.5;
        ctx.fillRect(x, h - barH, usableW, barH);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fftBuffer, bars]);

  return (
    <div className="biome-spectrum" aria-hidden="true" style={{ height }}>
      <canvas ref={canvasRef} className="biome-spectrum-canvas" />
    </div>
  );
}
