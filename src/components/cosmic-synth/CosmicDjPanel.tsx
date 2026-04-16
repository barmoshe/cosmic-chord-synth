import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { DjUi } from "./useDjAutoPlay";

interface CosmicDjPanelProps {
  autoPlay: boolean;
  onToggle: () => void;
  onReady: (ui: DjUi) => void;
  bpm?: number;
}

/**
 * Cosmic DJ Panel — minimal. The drum-stars in the galaxy are the rhythmic feedback surface.
 * Shows: AUTO toggle + beat dot, BPM, current → next phase preview, section progress bar.
 */
export default function CosmicDjPanel({ autoPlay, onToggle, onReady, bpm = 94 }: CosmicDjPanelProps) {
  const [phase, setPhase] = useState("");
  const [nextPhase, setNextPhase] = useState("");

  const progressRef = useRef(0);
  const beatPulseRef = useRef(0);     // spikes on each quarter-note beat, decays for dot

  const progressEl = useRef<HTMLDivElement>(null);
  const beatDot = useRef<HTMLDivElement>(null);

  const ui: DjUi = useMemo(() => ({
    setPhase: (p) => setPhase(p),
    setNextPhase: (p) => setNextPhase(p),
    setProgress: (v) => { progressRef.current = v; },
    setBeat: () => { beatPulseRef.current = 1; },
  }), []);

  useEffect(() => { onReady(ui); }, [ui, onReady]);

  useEffect(() => {
    let raf = 0;
    function loop() {
      raf = requestAnimationFrame(loop);
      beatPulseRef.current *= 0.82;
      if (progressEl.current) progressEl.current.style.transform = `scaleX(${progressRef.current})`;
      if (beatDot.current) beatDot.current.style.opacity = String(0.35 + beatPulseRef.current * 0.65);
    }
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleToggle = useCallback(() => { onToggle(); }, [onToggle]);

  return (
    <div className="cdj-panel">
      <div className="cdj-row cdj-row-head">
        <button
          className={`cdj-toggle ${autoPlay ? "active" : ""}`}
          onTouchStart={(e) => { e.preventDefault(); handleToggle(); }}
          onClick={handleToggle}
          aria-label={autoPlay ? "Pause auto DJ" : "Start auto DJ"}
        >
          <div ref={beatDot} className="cdj-beat-dot" />
          <span className="cdj-toggle-icon">{autoPlay ? "■" : "▶"}</span>
          <span className="cdj-toggle-label">AUTO</span>
        </button>
        <div className="cdj-bpm">
          <span className="cdj-bpm-val">{bpm}</span>
          <span className="cdj-bpm-lbl">BPM</span>
        </div>
      </div>

      {autoPlay && (
        <>
          <div className="cdj-row cdj-row-phase">
            <span className={`cdj-phase cdj-phase-${phase.toLowerCase()}`}>{phase || "…"}</span>
            {nextPhase && <span className="cdj-phase-next">▸ {nextPhase}</span>}
          </div>

          <div className="cdj-progress">
            <div ref={progressEl} className="cdj-progress-fill" />
          </div>
        </>
      )}
    </div>
  );
}
