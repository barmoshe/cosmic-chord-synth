import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { DJ_SECTIONS, isMobile } from "./constants";
import type { DjUi, DrumPattern, DrumLane } from "./useDjAutoPlay";
import type { BiomeTheme } from "./ThemeChooser";

interface DjPanelProps {
  autoPlay: boolean;
  onToggle: () => void;
  onReady: (ui: DjUi) => void;
  bpm?: number;
  userLayerRef?: React.MutableRefObject<DrumPattern>;
  theme?: BiomeTheme;
}

// Default velocity written when a user force-enables a step via tap.
const USER_HIT_VELOCITY = 0.9;

const LANES: DrumLane[] = ["kick", "clap", "hat", "snare"];
const LANE_LABEL: Record<DrumLane, string> = { kick: "K", clap: "C", hat: "H", snare: "S" };
const EMPTY_PATTERN: DrumPattern = {
  kick: Array(16).fill(0), clap: Array(16).fill(0), hat: Array(16).fill(0), snare: Array(16).fill(0),
};

const PHASE_CLASS: Record<string, string> = {
  DRIFT: "drift", PULSE: "pulse", BLOOM: "bloom", SURGE: "surge", DISSOLVE: "dissolve",
};

// Per-phase accent colors — mirrored from styles.ts `.conductor-phase-*` rules so the
// mini progress strip and phase dot stay in sync with the phase label.
const PHASE_COLOR: Record<string, string> = {
  drift: "#5FEED0", pulse: "#818CF8", bloom: "#22D3EE", surge: "#FCD34D", dissolve: "#14B8A6",
  idle: "#7C95B5",
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

export default function DjPanel({ autoPlay, onToggle, onReady, bpm: bpmProp, userLayerRef, theme = "space" }: DjPanelProps) {
  const [phase, setPhase] = useState("");
  const [nextPhase, setNextPhase] = useState("");
  const [bpm, setBpm] = useState(bpmProp ?? 0);
  const [expanded, setExpanded] = useState(!isMobile);
  const [reducedMotion, setReducedMotion] = useState(false);
  // Bump to force a re-render after user tap edits so `data-user` attributes refresh.
  const [, setUserEditTick] = useState(0);

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
  const miniProgressEl = useRef<HTMLDivElement>(null);
  const drawerEl = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<string>("");
  // Version counter bumped on every setStep — lets the RAF loop detect pattern
  // reseeds (from applySection) even when step value is unchanged.
  const patternVersionRef = useRef(0);
  const cellEls = useRef<Record<DrumLane, (HTMLElement | null)[]>>({
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
  useEffect(() => { if (!autoPlay && bpmProp != null) setBpm(bpmProp); }, [autoPlay, bpmProp]);

  // Drawer is always mounted so collapse can animate; toggle `inert` on the
  // DOM node directly — React 18's typed HTML props don't include `inert`,
  // and we need to block focus + pointer events when hidden.
  useEffect(() => {
    const el = drawerEl.current;
    if (!el) return;
    if (expanded) el.removeAttribute("inert");
    else el.setAttribute("inert", "");
  }, [expanded]);

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
      const seg = SECTION_OFFSETS[phaseRef.current];
      const globalPct = seg
        ? seg.start + Math.max(0, Math.min(1, progressRef.current)) * seg.width
        : 0;
      if (playheadEl.current) {
        if (seg) {
          playheadEl.current.style.left = `${globalPct * 100}%`;
          playheadEl.current.style.opacity = "1";
        } else {
          playheadEl.current.style.opacity = "0";
        }
      }

      // Mini progress strip (collapsed pill) — same math, scaleX from 0..1.
      if (miniProgressEl.current) {
        miniProgressEl.current.style.transform = `scaleX(${seg ? globalPct : 0})`;
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
            if (v > 0) {
              el.setAttribute("data-hit", "1");
              el.style.opacity = String(0.85 + v * 0.15);
            } else {
              el.removeAttribute("data-hit");
              el.style.opacity = "0.18";
            }
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

  // Tap-to-edit: cycle the step between the generator's value, force-on, and force-off.
  //   tap clean step     → if generator has a hit, force mute (0); else force on
  //   tap user-forced    → clear the override (fall back to generator)
  const handleCellTap = useCallback((lane: DrumLane, step: number) => {
    const layer = userLayerRef?.current;
    if (!layer) return;
    const current = layer[lane][step];
    if (!Number.isNaN(current)) {
      layer[lane][step] = NaN;
    } else {
      const generated = patternRef.current[lane]?.[step] ?? 0;
      layer[lane][step] = generated > 0 ? 0 : USER_HIT_VELOCITY;
    }
    // Repaint the visible cell immediately so the edit is responsive even before
    // the next bar-boundary merge lands. We mutate patternRef so the RAF loop
    // picks it up on its next step-or-pattern-version check.
    const nextVel = Number.isNaN(layer[lane][step]) ? (patternRef.current[lane]?.[step] ?? 0) : layer[lane][step];
    patternRef.current[lane][step] = nextVel;
    patternVersionRef.current++;
    setUserEditTick((t) => (t + 1) & 0xfff);
  }, [userLayerRef]);

  const phaseClass = PHASE_CLASS[phase] || "idle";
  const phaseColor = PHASE_COLOR[phaseClass] || PHASE_COLOR.idle;
  const isJungle = theme === "jungle";
  const isCyberpunk = theme === "cyberpunk";
  const showMiniProgress = autoPlay;

  return (
    <div
      className={`conductor-root ${expanded ? "is-expanded" : "is-collapsed"}`}
      style={{ ["--phase-color" as string]: phaseColor }}
    >
      {/* Transport row — always visible */}
      <div className="conductor-transport">
        <button
          type="button"
          className={`conductor-toggle ${autoPlay ? "is-active" : ""}`}
          onClick={handleToggle}
          aria-label={autoPlay ? "Pause auto DJ" : "Start auto DJ"}
          aria-pressed={autoPlay}
        >
          <span className="conductor-toggle-ring" ref={ringEl} aria-hidden="true" />
          <span
            className="conductor-toggle-icon"
            data-icon={autoPlay ? "stop" : "play"}
            aria-hidden="true"
          >
            {autoPlay ? "■" : "▶"}
          </span>
        </button>

        <div className="conductor-meta">
          <div className={`conductor-phase conductor-phase-${phaseClass}`}>
            <span className="conductor-phase-dot" aria-hidden="true" />
            <span className="conductor-phase-text">{phase || "IDLE"}</span>
          </div>
          <div className="conductor-sub">
            <span className="conductor-bpm">{bpm > 0 ? bpm : "—"}<span className="conductor-bpm-unit">BPM</span></span>
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
          type="button"
          className="conductor-expand"
          onClick={handleExpand}
          aria-label={expanded ? "Collapse DJ console" : "Expand DJ console"}
          aria-expanded={expanded}
        >
          <span className={`conductor-chevron ${expanded ? "is-open" : ""}`} aria-hidden="true">⌄</span>
        </button>

        {/* Mini progress strip — only visible when collapsed + DJ on. Tracks global
            timeline so a glance at the pill tells you where in the set you are. */}
        {showMiniProgress && (
          <div className="conductor-mini-progress" aria-hidden="true">
            <div className="conductor-mini-progress-fill" ref={miniProgressEl} />
          </div>
        )}
      </div>

      {/* Drawer — section rail + beat grid. Always rendered so collapse can animate;
          hidden from AT + focus via aria-hidden + inert when collapsed. */}
      <div
        ref={drawerEl}
        className={`conductor-drawer ${expanded ? "is-open" : "is-closed"}`}
        aria-hidden={!expanded}
      >
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

          {/* Beat grid — 4 lanes × 16 tappable cells. Tap to override the generator's
              value for this section; overrides clear on the next section transition. */}
          <div className="conductor-grid" role="group" aria-label="Drum pattern — tap cells to edit">
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
                  {Array.from({ length: 16 }, (_, i) => {
                    const u = userLayerRef?.current[lane][i];
                    const userState = u === undefined || Number.isNaN(u) ? undefined : (u > 0 ? "on" : "off");
                    return (
                      <button
                        key={i}
                        type="button"
                        ref={(el) => { cellEls.current[lane][i] = el; }}
                        className={`conductor-cell ${i % 4 === 0 ? "is-downbeat" : ""}`}
                        data-user={userState}
                        aria-label={`${lane} step ${i + 1}${userState ? ` (user ${userState})` : ""}`}
                        onClick={() => handleCellTap(lane, i)}
                      >
                        {isJungle && <span className="conductor-cell-fruit" aria-hidden="true" />}
                        {isCyberpunk && <span className="conductor-cell-grid" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
