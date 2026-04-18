import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { DJ_SECTIONS, isMobile } from "./constants";
import type { DjUi, DrumPattern, DrumLane } from "./useDjAutoPlay";

interface CosmicDjPanelProps {
  autoPlay: boolean;
  onToggle: () => void;
  onReady: (ui: DjUi) => void;
  bpm?: number;
}

const LANES: DrumLane[] = ["kick", "clap", "hat", "snare"];
const LANE_LABEL: Record<DrumLane, string> = { kick: "K", clap: "C", hat: "H", snare: "S" };
const EMPTY_PATTERN: DrumPattern = {
  kick: Array(16).fill(0), clap: Array(16).fill(0), hat: Array(16).fill(0), snare: Array(16).fill(0),
};

const PHASE_CLASS: Record<string, string> = {
  DRIFT: "drift", PULSE: "pulse", BLOOM: "bloom", SURGE: "surge", DISSOLVE: "dissolve",
};

// Cumulative bar offsets for the section rail — lets the playhead scrub smoothly
// across all segments (widths ∝ bars) using the current section + local progress.
const TOTAL_BARS = DJ_SECTIONS.reduce((sum, s) => sum + (s.bars as number), 0);
const SECTION_OFFSETS: Record<string, { start: number; width: number }> = (() => {
  const out: Record<string, { start: number; width: number }> = {};
  let acc = 0;
  for (const s of DJ_SECTIONS) {
    out[s.name] = { start: acc / TOTAL_BARS, width: s.bars / TOTAL_BARS };
    acc += s.bars;
  }
  return out;
})();

export default function CosmicDjPanel({ autoPlay, onToggle, onReady, bpm: bpmProp = 94 }: CosmicDjPanelProps) {
  const [phase, setPhase] = useState("");
  const [nextPhase, setNextPhase] = useState("");
  const [bpm, setBpm] = useState(bpmProp);
  const [expanded, setExpanded] = useState(!isMobile);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Refs for RAF-driven visuals (avoids per-frame re-renders)
  const progressRef = useRef(0);
  const energyRef = useRef(0);
  const ringPulseRef = useRef(0);
  const stepRef = useRef(-1);
  const patternRef = useRef<DrumPattern>(EMPTY_PATTERN);
  const lanePulseRef = useRef<Record<DrumLane, number>>({ kick: 0, clap: 0, hat: 0, snare: 0 });

  const playheadEl = useRef<HTMLDivElement>(null);
  const energyArcEl = useRef<SVGCircleElement>(null);
  const ringEl = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<string>("");
  // Version counter bumped on every setStep — lets the RAF loop detect pattern
  // reseeds (from applySection) even when step value is unchanged.
  const patternVersionRef = useRef(0);
  const cellEls = useRef<Record<DrumLane, (HTMLDivElement | null)[]>>({
    kick: Array(16).fill(null), clap: Array(16).fill(null), hat: Array(16).fill(null), snare: Array(16).fill(null),
  });
  const laneDotEls = useRef<Record<DrumLane, HTMLDivElement | null>>({
    kick: null, clap: null, hat: null, snare: null,
  });

  // DjUi adapter installed once, never reallocates.
  const ui: DjUi = useMemo(() => ({
    setPhase: (p) => { phaseRef.current = p; setPhase(p); },
    setNextPhase: (p) => setNextPhase(p),
    setProgress: (v) => { progressRef.current = v; },
    setBeat: () => { ringPulseRef.current = 1; },
    setStep: (step, pattern) => {
      stepRef.current = step;
      patternRef.current = pattern;
      patternVersionRef.current++;
    },
    onDrumHit: (name, vel) => {
      lanePulseRef.current[name] = Math.max(lanePulseRef.current[name], vel);
    },
    setEnergy: (e) => { energyRef.current = e; },
    setBpm: (b) => setBpm(Math.round(b)),
  }), []);

  useEffect(() => { onReady(ui); }, [ui, onReady]);

  // prefers-reduced-motion detection
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handle = () => setReducedMotion(mq.matches);
    handle();
    mq.addEventListener?.("change", handle);
    return () => mq.removeEventListener?.("change", handle);
  }, []);

  // Sync bpm prop → state when DJ is off (transport bpm isn't being pushed)
  useEffect(() => { if (!autoPlay) setBpm(bpmProp); }, [autoPlay, bpmProp]);

  // Single RAF loop with time-based exponential decay — frame-rate independent.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    // -2 sentinel so the first setStep(-1, pattern) seed from applySection
    // counts as a change and paints the cells immediately.
    let lastStep = -2;
    let lastPatternVersion = -1;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      // Ring pulse decay
      const ringDecay = reducedMotion ? 0 : Math.exp(-dt * 5);
      ringPulseRef.current *= ringDecay;
      if (ringEl.current) {
        const p = ringPulseRef.current;
        ringEl.current.style.opacity = String(0.35 + p * 0.65);
        ringEl.current.style.transform = `scale(${1 + p * 0.35})`;
      }

      // Playhead — position = section start + local progress * section width.
      if (playheadEl.current) {
        const seg = SECTION_OFFSETS[phaseRef.current];
        if (seg) {
          const pct = (seg.start + Math.max(0, Math.min(1, progressRef.current)) * seg.width) * 100;
          playheadEl.current.style.left = `${pct}%`;
          playheadEl.current.style.opacity = "1";
        } else {
          playheadEl.current.style.opacity = "0";
        }
      }

      // Energy arc (circumference of r=10 circle = 2πr ≈ 62.83)
      if (energyArcEl.current) {
        const e = Math.max(0, Math.min(1, energyRef.current));
        energyArcEl.current.style.strokeDashoffset = String(62.83 * (1 - e));
      }

      // Per-lane dot pulse decay + intensity
      const laneDecay = Math.exp(-dt * 10);
      for (const lane of LANES) {
        lanePulseRef.current[lane] *= laneDecay;
        const dot = laneDotEls.current[lane];
        if (dot) {
          const p = lanePulseRef.current[lane];
          dot.style.opacity = String(0.35 + p * 0.65);
          dot.style.transform = `scale(${1 + p * 0.8})`;
        }
      }

      // Step cursor — only update DOM when step or pattern changes (cheap, O(16) writes)
      const step = stepRef.current;
      const patternVersion = patternVersionRef.current;
      if (step !== lastStep || patternVersion !== lastPatternVersion) {
        lastStep = step;
        lastPatternVersion = patternVersion;
        const pat = patternRef.current;
        for (const lane of LANES) {
          const row = cellEls.current[lane];
          const laneVals = pat[lane];
          for (let i = 0; i < 16; i++) {
            const el = row[i];
            if (!el) continue;
            const v = laneVals[i] || 0;
            el.style.opacity = String(0.1 + v * 0.9);
            if (i === step) el.setAttribute("data-active", "1");
            else el.removeAttribute("data-active");
          }
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  const handleToggle = useCallback(() => { onToggle(); }, [onToggle]);
  const handleExpand = useCallback(() => { setExpanded(e => !e); }, []);

  const phaseClass = PHASE_CLASS[phase] || "idle";

  return (
    <div className={`conductor-root ${expanded ? "is-expanded" : "is-collapsed"}`}>
      {/* Transport row — always visible */}
      <div className="conductor-transport">
        <button
          className={`conductor-toggle ${autoPlay ? "is-active" : ""}`}
          onTouchStart={(e) => { e.preventDefault(); handleToggle(); }}
          onClick={handleToggle}
          aria-label={autoPlay ? "Pause auto DJ" : "Start auto DJ"}
          aria-pressed={autoPlay}
        >
          <span className="conductor-toggle-ring" ref={ringEl} aria-hidden="true" />
          <span className="conductor-toggle-icon" aria-hidden="true">{autoPlay ? "■" : "▶"}</span>
        </button>

        <div className="conductor-meta">
          <div className={`conductor-phase conductor-phase-${phaseClass}`}>{phase || "IDLE"}</div>
          <div className="conductor-sub">
            <span className="conductor-bpm">{bpm}<span className="conductor-bpm-unit">BPM</span></span>
            {nextPhase && (
              <span className="conductor-next">→ {nextPhase}</span>
            )}
          </div>
        </div>

        {/* Energy dial — small radial gauge */}
        <svg className="conductor-energy" width="26" height="26" viewBox="0 0 26 26" aria-label={`Energy ${Math.round(energyRef.current * 100)}%`}>
          <circle cx="13" cy="13" r="10" className="conductor-energy-track" />
          <circle
            ref={energyArcEl}
            cx="13"
            cy="13"
            r="10"
            className="conductor-energy-arc"
            style={{ strokeDasharray: "62.83 62.83", strokeDashoffset: "62.83" }}
          />
        </svg>

        <button
          className="conductor-expand"
          onTouchStart={(e) => { e.preventDefault(); handleExpand(); }}
          onClick={handleExpand}
          aria-label={expanded ? "Collapse DJ console" : "Expand DJ console"}
          aria-expanded={expanded}
        >
          <span aria-hidden="true">{expanded ? "⌄" : "⌃"}</span>
        </button>
      </div>

      {/* Drawer — section rail + beat grid */}
      {expanded && (
        <div className="conductor-drawer">
          {/* Section rail — widths ∝ bars; playhead scrubs across globally */}
          <div className="conductor-rail" role="img" aria-label="Section timeline">
            <div className="conductor-rail-track">
              {DJ_SECTIONS.map((s) => (
                <div
                  key={s.name}
                  className={`conductor-rail-seg conductor-rail-${PHASE_CLASS[s.name] || "idle"} ${s.name === phase ? "is-current" : ""} ${s.name === nextPhase ? "is-next" : ""}`}
                  style={{ flexGrow: s.bars }}
                >
                  <span className="conductor-rail-label">{s.name}</span>
                </div>
              ))}
              <div className="conductor-rail-playhead" ref={playheadEl} aria-hidden="true" />
            </div>
          </div>

          {/* Beat grid — 4 lanes × 16 cells */}
          <div className="conductor-grid" role="img" aria-label="Drum pattern visualization">
            {LANES.map((lane) => (
              <div key={lane} className={`conductor-row conductor-row-${lane}`}>
                <div className="conductor-row-head">
                  <span
                    className="conductor-row-dot"
                    ref={(el) => { laneDotEls.current[lane] = el as unknown as HTMLDivElement; }}
                    aria-hidden="true"
                  />
                  <span className="conductor-row-label">{LANE_LABEL[lane]}</span>
                </div>
                <div className="conductor-cells">
                  {Array.from({ length: 16 }, (_, i) => (
                    <div
                      key={i}
                      ref={(el) => { cellEls.current[lane][i] = el; }}
                      className={`conductor-cell ${i % 4 === 0 ? "is-downbeat" : ""}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
