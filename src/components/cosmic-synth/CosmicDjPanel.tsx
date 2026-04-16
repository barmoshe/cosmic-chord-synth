import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { DjUi } from "./useDjAutoPlay";

interface CosmicDjPanelProps {
  autoPlay: boolean;
  onToggle: () => void;
  onReady: (ui: DjUi) => void;
  bpm?: number;
}

/**
 * Cosmic DJ Panel
 *
 * Replaces the old minimal AUTO button + section tag. Shows:
 *  - AUTO toggle with beat-pulse dot (flashes on every kick)
 *  - BPM display
 *  - Current → next phase preview
 *  - Section progress bar (refreshes via DOM, not React)
 *  - Kick / Clap / Hat level meters (60fps decay via rAF)
 *  - 4-step beat grid (quarter-note position)
 */
export default function CosmicDjPanel({ autoPlay, onToggle, onReady, bpm = 94 }: CosmicDjPanelProps) {
  const [phase, setPhase] = useState("");
  const [nextPhase, setNextPhase] = useState("");
  const [beat, setBeat] = useState(0);

  // High-frequency values live in refs; DOM updated directly each rAF tick
  const progressRef = useRef(0);
  const kickRef = useRef(0);
  const clapRef = useRef(0);
  const hatRef = useRef(0);
  const kickPulseRef = useRef(0);   // separate: 0..1 that spikes on kick, decays fast for beat dot

  const progressEl = useRef<HTMLDivElement>(null);
  const kickMeter = useRef<HTMLDivElement>(null);
  const clapMeter = useRef<HTMLDivElement>(null);
  const hatMeter = useRef<HTMLDivElement>(null);
  const beatDot = useRef<HTMLDivElement>(null);

  // Stable UI adapter passed to the DJ hook
  const ui: DjUi = useMemo(() => ({
    setPhase: (p) => setPhase(p),
    setNextPhase: (p) => setNextPhase(p),
    setProgress: (v) => { progressRef.current = v; },
    setBeat: (b) => setBeat(b),
    bumpKick: (v) => { kickRef.current = Math.max(kickRef.current, v); kickPulseRef.current = 1; },
    bumpClap: (v) => { clapRef.current = Math.max(clapRef.current, v); },
    bumpHat:  (v) => { hatRef.current  = Math.max(hatRef.current,  v); },
  }), []);

  useEffect(() => { onReady(ui); }, [ui, onReady]);

  // rAF loop to decay meter values and update DOM (skips React re-render per frame)
  useEffect(() => {
    let raf = 0;
    function loop() {
      raf = requestAnimationFrame(loop);
      // decay
      kickRef.current *= 0.85;
      clapRef.current *= 0.85;
      hatRef.current  *= 0.82;
      kickPulseRef.current *= 0.78;
      // DOM
      if (progressEl.current) progressEl.current.style.transform = `scaleX(${progressRef.current})`;
      if (kickMeter.current)  kickMeter.current.style.transform = `scaleX(${kickRef.current})`;
      if (clapMeter.current)  clapMeter.current.style.transform = `scaleX(${clapRef.current})`;
      if (hatMeter.current)   hatMeter.current.style.transform  = `scaleX(${hatRef.current})`;
      if (beatDot.current)    beatDot.current.style.opacity = String(0.35 + kickPulseRef.current * 0.65);
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

          <div className="cdj-meters">
            <div className="cdj-meter cdj-meter-kick">
              <span className="cdj-meter-lbl">K</span>
              <div className="cdj-meter-bar"><div ref={kickMeter} className="cdj-meter-fill kick" /></div>
            </div>
            <div className="cdj-meter cdj-meter-clap">
              <span className="cdj-meter-lbl">C</span>
              <div className="cdj-meter-bar"><div ref={clapMeter} className="cdj-meter-fill clap" /></div>
            </div>
            <div className="cdj-meter cdj-meter-hat">
              <span className="cdj-meter-lbl">H</span>
              <div className="cdj-meter-bar"><div ref={hatMeter} className="cdj-meter-fill hat" /></div>
            </div>
          </div>

          <div className="cdj-grid">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`cdj-grid-dot ${beat === i ? "active" : ""}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
