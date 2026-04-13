import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════ */
export interface SeqStep {
  on: boolean;
  note: number;   // scale degree index (0–7)
  vel: number;     // 0–1
  slide: boolean;
}

export interface SeqTrack {
  id: string;
  label: string;
  color: string;
  colorRgb: string;
  steps: SeqStep[];
  muted: boolean;
  solo: boolean;
  octave: number;
  synth: "ld" | "bs" | "ar" | "pd";
}

export interface SeqPattern {
  name: string;
  tracks: SeqTrack[];
}

export interface SequencerState {
  playing: boolean;
  bpm: number;
  swing: number;
  stepCount: number;
  currentStep: number;
  patterns: SeqPattern[];
  activePattern: number;
}

const TRACK_DEFS: Omit<SeqTrack, "steps">[] = [
  { id: "lead", label: "LEAD", color: "#00f0ff", colorRgb: "0,240,255", synth: "ld", muted: false, solo: false, octave: 5 },
  { id: "bass", label: "BASS", color: "#ff00e6", colorRgb: "255,0,230", synth: "bs", muted: false, solo: false, octave: 3 },
  { id: "arp", label: "ARP", color: "#ffee00", colorRgb: "255,238,0", synth: "ar", muted: false, solo: false, octave: 5 },
  { id: "pad", label: "PAD", color: "#00ff88", colorRgb: "0,255,136", synth: "pd", muted: false, solo: false, octave: 4 },
];

function makeEmptySteps(count: number): SeqStep[] {
  return Array.from({ length: count }, () => ({ on: false, note: 0, vel: 0.7, slide: false }));
}

function makeEmptyPattern(name: string, stepCount: number): SeqPattern {
  return {
    name,
    tracks: TRACK_DEFS.map(def => ({ ...def, steps: makeEmptySteps(stepCount) })),
  };
}

// Pre-made patterns (scale degree indices)
const PRESET_PATTERNS: Record<string, { tracks: { notes: (number | null)[]; vels?: number[] }[] }> = {
  "Cosmic Rise": {
    tracks: [
      { notes: [0, null, 2, null, 4, null, 3, null, 5, null, 4, null, 6, null, 5, null] },
      { notes: [0, null, null, null, 0, null, null, null, 3, null, null, null, 4, null, null, null] },
      { notes: [0, 2, 4, 2, 0, 2, 4, 6, 0, 2, 4, 2, 0, 2, 4, 6], vels: [0.6, 0.4, 0.5, 0.3, 0.6, 0.4, 0.5, 0.3, 0.6, 0.4, 0.5, 0.3, 0.6, 0.4, 0.5, 0.3] },
      { notes: [0, null, null, null, null, null, null, null, 3, null, null, null, null, null, null, null] },
    ],
  },
  "Nebula Drift": {
    tracks: [
      { notes: [4, null, null, 3, null, null, 2, null, null, 1, null, null, 0, null, null, null] },
      { notes: [0, null, 0, null, 2, null, 2, null, 3, null, 3, null, 0, null, 0, null] },
      { notes: [null, 4, null, 4, null, 3, null, 3, null, 2, null, 2, null, 1, null, 0] },
      { notes: [0, null, null, null, null, null, null, null, 4, null, null, null, null, null, null, null] },
    ],
  },
  "Stellar Pulse": {
    tracks: [
      { notes: [0, null, 0, null, 2, null, 4, null, 3, null, 2, null, 4, null, 6, null], vels: [0.9, 0, 0.5, 0, 0.8, 0, 0.7, 0, 0.9, 0, 0.6, 0, 0.8, 0, 1, 0] },
      { notes: [0, null, null, 0, null, null, 3, null, null, 4, null, null, 0, null, null, 0] },
      { notes: [0, 2, 4, 6, 4, 2, 0, 2, 4, 6, 4, 2, 0, 2, 4, 6] },
      { notes: [null, null, null, null, null, null, null, null, 0, null, null, null, null, null, null, null] },
    ],
  },
  "Dark Matter": {
    tracks: [
      { notes: [0, null, null, 1, null, null, 0, null, null, null, 3, null, 2, null, 1, null] },
      { notes: [0, 0, null, null, 0, 0, null, null, 2, 2, null, null, 3, 3, null, null], vels: [1, 0.5, 0, 0, 1, 0.5, 0, 0, 1, 0.5, 0, 0, 1, 0.5, 0, 0] },
      { notes: [null, null, 4, null, null, null, 3, null, null, null, 2, null, null, null, 5, null] },
      { notes: [0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
    ],
  },
};

function applyPreset(presetName: string, stepCount: number): SeqTrack[] {
  const preset = PRESET_PATTERNS[presetName];
  if (!preset) return TRACK_DEFS.map(def => ({ ...def, steps: makeEmptySteps(stepCount) }));
  return TRACK_DEFS.map((def, ti) => {
    const pTrack = preset.tracks[ti];
    const steps: SeqStep[] = Array.from({ length: stepCount }, (_, si) => {
      const n = pTrack?.notes?.[si % (pTrack.notes.length)];
      const v = pTrack?.vels?.[si % (pTrack.vels?.length || 1)];
      return {
        on: n !== null && n !== undefined,
        note: n ?? 0,
        vel: v ?? 0.7,
        slide: false,
      };
    });
    return { ...def, steps };
  });
}

function randomizeTrack(steps: SeqStep[], density: number = 0.4, maxNote: number = 6): SeqStep[] {
  return steps.map(() => ({
    on: Math.random() < density,
    note: Math.floor(Math.random() * (maxNote + 1)),
    vel: 0.4 + Math.random() * 0.6,
    slide: Math.random() < 0.15,
  }));
}

/* ═══════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════ */
interface SequencerProps {
  visible: boolean;
  onClose: () => void;
  audioRef: React.MutableRefObject<any>;
  engineRef: React.MutableRefObject<any>;
  scaleRef: React.MutableRefObject<string>;
  scales: Record<string, { notes: number[]; label: string }>;
  noteColorFn: (midi: number) => [number, number, number];
  m2fFn: (midi: number) => number;
}

export default function CosmicSequencer({
  visible, onClose, audioRef, engineRef, scaleRef, scales, noteColorFn, m2fFn,
}: SequencerProps) {
  const STEP_COUNT = 16;
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [swing, setSwing] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);
  const [tracks, setTracks] = useState<SeqTrack[]>(() =>
    TRACK_DEFS.map(def => ({ ...def, steps: makeEmptySteps(STEP_COUNT) }))
  );
  const [activeTrack, setActiveTrack] = useState(0);
  const [editMode, setEditMode] = useState<"toggle" | "note" | "vel">("toggle");
  const [showPresets, setShowPresets] = useState(false);

  const playingRef = useRef(false);
  const stepRef = useRef(-1);
  const tracksRef = useRef(tracks);
  const bpmRef = useRef(bpm);
  const swingRef = useRef(swing);
  const intervalRef = useRef<any>(null);
  const tapTimesRef = useRef<number[]>([]);

  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { swingRef.current = swing; }, [swing]);

  // Play engine
  const startPlayback = useCallback(() => {
    if (playingRef.current) return;
    playingRef.current = true;
    setPlaying(true);
    stepRef.current = -1;

    function tick() {
      if (!playingRef.current) return;
      stepRef.current = (stepRef.current + 1) % STEP_COUNT;
      const step = stepRef.current;
      setCurrentStep(step);

      const trks = tracksRef.current;
      const anySolo = trks.some(t => t.solo);
      const sn = scales[scaleRef.current]?.notes || [0, 2, 4, 5, 7, 9, 11];

      for (const track of trks) {
        if (track.muted) continue;
        if (anySolo && !track.solo) continue;
        const s = track.steps[step];
        if (!s.on) continue;

        const noteIdx = s.note % sn.length;
        const midi = track.octave * 12 + sn[noteIdx];
        const freq = m2fFn(midi);
        const dur = (60 / bpmRef.current) * 0.4;

        try {
          const synth = audioRef.current?.[track.synth];
          if (synth) {
            if (track.synth === "pd") {
              synth.triggerAttackRelease(freq, dur * 3, undefined, s.vel * 0.4);
            } else {
              synth.triggerAttackRelease(freq, dur, undefined, s.vel);
            }
          }
          // Sub for lead
          if (track.synth === "ld" && audioRef.current?.sb) {
            audioRef.current.sb.triggerAttackRelease(m2fFn(midi - 12), dur, undefined, s.vel * 0.4);
          }
        } catch {}

        // Visuals
        if (engineRef.current) {
          const fx = ((midi - 48) / 36) * window.innerWidth;
          const fy = (1 - s.vel) * window.innerHeight;
          const [wx, wy, wz] = engineRef.current.s2w(fx, fy);
          const col = noteColorFn(midi);
          engineRef.current.addRipple(wx, wy, wz, col);
          engineRef.current.emitParticles(wx, wy, wz, col, Math.floor(4 + s.vel * 12), s.vel);
        }
      }

      // Schedule next with swing
      const baseInterval = (60 / bpmRef.current / 4) * 1000; // 16th note
      const swingAmount = swingRef.current;
      const isOdd = step % 2 === 1;
      const delay = isOdd ? baseInterval * (1 + swingAmount * 0.5) : baseInterval * (1 - swingAmount * 0.25);
      intervalRef.current = setTimeout(tick, delay);
    }
    tick();
  }, [audioRef, engineRef, scaleRef, scales, m2fFn, noteColorFn]);

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    setCurrentStep(-1);
    stepRef.current = -1;
    if (intervalRef.current) { clearTimeout(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
  }, []);

  // Stop when hidden
  useEffect(() => {
    if (!visible && playing) stopPlayback();
  }, [visible, playing, stopPlayback]);

  const toggleStep = useCallback((trackIdx: number, stepIdx: number) => {
    setTracks(prev => {
      const next = prev.map((t, ti) => ti === trackIdx ? {
        ...t,
        steps: t.steps.map((s, si) => si === stepIdx ? { ...s, on: !s.on } : s),
      } : t);
      return next;
    });
  }, []);

  const setStepNote = useCallback((trackIdx: number, stepIdx: number, note: number) => {
    setTracks(prev => prev.map((t, ti) => ti === trackIdx ? {
      ...t,
      steps: t.steps.map((s, si) => si === stepIdx ? { ...s, note, on: true } : s),
    } : t));
  }, []);

  const setStepVel = useCallback((trackIdx: number, stepIdx: number, vel: number) => {
    setTracks(prev => prev.map((t, ti) => ti === trackIdx ? {
      ...t,
      steps: t.steps.map((s, si) => si === stepIdx ? { ...s, vel } : s),
    } : t));
  }, []);

  const toggleMute = useCallback((trackIdx: number) => {
    setTracks(prev => prev.map((t, ti) => ti === trackIdx ? { ...t, muted: !t.muted } : t));
  }, []);

  const toggleSolo = useCallback((trackIdx: number) => {
    setTracks(prev => prev.map((t, ti) => ti === trackIdx ? { ...t, solo: !t.solo } : t));
  }, []);

  const setTrackOctave = useCallback((trackIdx: number, oct: number) => {
    setTracks(prev => prev.map((t, ti) => ti === trackIdx ? { ...t, octave: clamp(oct, 1, 7) } : t));
  }, []);

  const clearTrack = useCallback((trackIdx: number) => {
    setTracks(prev => prev.map((t, ti) => ti === trackIdx ? { ...t, steps: makeEmptySteps(STEP_COUNT) } : t));
  }, []);

  const randomizeCurrentTrack = useCallback(() => {
    setTracks(prev => prev.map((t, ti) => ti === activeTrack ? {
      ...t,
      steps: randomizeTrack(t.steps, t.synth === "pd" ? 0.15 : t.synth === "bs" ? 0.3 : 0.45),
    } : t));
  }, [activeTrack]);

  const loadPreset = useCallback((name: string) => {
    const newTracks = applyPreset(name, STEP_COUNT);
    setTracks(newTracks);
    setShowPresets(false);
  }, []);

  const clearAll = useCallback(() => {
    setTracks(prev => prev.map(t => ({ ...t, steps: makeEmptySteps(STEP_COUNT) })));
  }, []);

  const tapTempo = useCallback(() => {
    const now = Date.now();
    const taps = tapTimesRef.current;
    taps.push(now);
    if (taps.length > 5) taps.shift();
    if (taps.length >= 2) {
      const diffs: number[] = [];
      for (let i = 1; i < taps.length; i++) diffs.push(taps[i] - taps[i - 1]);
      const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      const newBpm = clamp(Math.round(60000 / avg), 40, 240);
      setBpm(newBpm);
    }
  }, []);

  const scaleNotes = scales[scaleRef.current]?.notes || [0, 2, 4, 5, 7, 9, 11];
  const scaleLabel = scales[scaleRef.current]?.label || "SCALE";
  const noteLabels = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

  if (!visible) return null;

  return (
    <div className="seq-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="seq-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="seq-header">
          <div className="seq-title-group">
            <span className="seq-title">SEQUENCER</span>
            <span className="seq-scale-badge">{scaleLabel}</span>
          </div>
          <div className="seq-header-controls">
            <button className="seq-icon-btn" onClick={onClose} title="Close">✕</button>
          </div>
        </div>

        {/* Transport */}
        <div className="seq-transport">
          <button
            className={`seq-transport-btn ${playing ? "active" : ""}`}
            onClick={() => playing ? stopPlayback() : startPlayback()}
          >
            {playing ? "⏹" : "▶"} {playing ? "STOP" : "PLAY"}
          </button>

          <div className="seq-bpm-group">
            <button className="seq-tiny-btn" onClick={() => setBpm(b => clamp(b - 5, 40, 240))}>−</button>
            <div className="seq-bpm-display" onClick={tapTempo} title="Tap for tempo">
              <span className="seq-bpm-value">{bpm}</span>
              <span className="seq-bpm-label">BPM</span>
            </div>
            <button className="seq-tiny-btn" onClick={() => setBpm(b => clamp(b + 5, 40, 240))}>+</button>
          </div>

          <div className="seq-swing-group">
            <span className="seq-param-label">SWING</span>
            <input
              type="range"
              min="0" max="100" value={Math.round(swing * 100)}
              onChange={(e) => setSwing(parseInt(e.target.value) / 100)}
              className="seq-slider"
            />
            <span className="seq-param-value">{Math.round(swing * 100)}%</span>
          </div>
        </div>

        {/* Track headers + Grid */}
        <div className="seq-grid-container">
          {/* Track sidebar */}
          <div className="seq-track-sidebar">
            {tracks.map((track, ti) => (
              <div
                key={track.id}
                className={`seq-track-header ${ti === activeTrack ? "active" : ""}`}
                onClick={() => setActiveTrack(ti)}
                style={{ "--track-color": track.color, "--track-rgb": track.colorRgb } as any}
              >
                <div className="seq-track-name">{track.label}</div>
                <div className="seq-track-btns">
                  <button
                    className={`seq-ms-btn ${track.muted ? "on" : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggleMute(ti); }}
                  >M</button>
                  <button
                    className={`seq-ms-btn solo ${track.solo ? "on" : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggleSolo(ti); }}
                  >S</button>
                </div>
                <div className="seq-track-oct">
                  <button className="seq-oct-btn" onClick={(e) => { e.stopPropagation(); setTrackOctave(ti, track.octave - 1); }}>−</button>
                  <span>C{track.octave}</span>
                  <button className="seq-oct-btn" onClick={(e) => { e.stopPropagation(); setTrackOctave(ti, track.octave + 1); }}>+</button>
                </div>
              </div>
            ))}
          </div>

          {/* Step grid */}
          <div className="seq-grid-scroll">
            <div className="seq-grid">
              {/* Step numbers */}
              <div className="seq-step-numbers">
                {Array.from({ length: STEP_COUNT }, (_, i) => (
                  <div
                    key={i}
                    className={`seq-step-num ${currentStep === i ? "active" : ""} ${i % 4 === 0 ? "beat" : ""}`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Track rows */}
              {tracks.map((track, ti) => (
                <div key={track.id} className="seq-track-row">
                  {track.steps.map((step, si) => (
                    <div
                      key={si}
                      className={`seq-step ${step.on ? "on" : ""} ${currentStep === si ? "playing" : ""} ${si % 4 === 0 ? "beat" : ""} ${ti === activeTrack ? "focused" : ""}`}
                      style={{
                        "--step-color": track.color,
                        "--step-rgb": track.colorRgb,
                        "--step-vel": step.vel,
                        "--step-note": step.note / Math.max(scaleNotes.length - 1, 1),
                      } as any}
                      onClick={() => {
                        if (editMode === "toggle") toggleStep(ti, si);
                        else if (editMode === "note") {
                          const newNote = (step.note + 1) % scaleNotes.length;
                          setStepNote(ti, si, newNote);
                        } else {
                          const newVel = step.vel >= 0.9 ? 0.3 : step.vel + 0.2;
                          setStepVel(ti, si, newVel);
                        }
                      }}
                    >
                      {step.on && editMode === "note" && (
                        <span className="seq-step-note">{noteLabels[scaleNotes[step.note % scaleNotes.length] % 12]}</span>
                      )}
                      {step.on && editMode === "vel" && (
                        <span className="seq-step-vel-label">{Math.round(step.vel * 100)}</span>
                      )}
                      {step.on && editMode === "toggle" && (
                        <div className="seq-step-bar" style={{ height: `${step.vel * 100}%` }} />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="seq-toolbar">
          <div className="seq-mode-group">
            <span className="seq-param-label">EDIT</span>
            {(["toggle", "note", "vel"] as const).map(mode => (
              <button
                key={mode}
                className={`seq-mode-btn ${editMode === mode ? "active" : ""}`}
                onClick={() => setEditMode(mode)}
              >
                {mode === "toggle" ? "●" : mode === "note" ? "♪" : "⚡"} {mode.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="seq-action-group">
            <button className="seq-action-btn" onClick={randomizeCurrentTrack}>🎲 RANDOM</button>
            <button className="seq-action-btn" onClick={() => clearTrack(activeTrack)}>🗑 CLEAR</button>
            <button className="seq-action-btn" onClick={clearAll}>⊘ CLEAR ALL</button>
            <button className="seq-action-btn preset" onClick={() => setShowPresets(!showPresets)}>
              ◆ PRESETS
            </button>
          </div>
        </div>

        {/* Preset dropdown */}
        {showPresets && (
          <div className="seq-presets-dropdown">
            {Object.keys(PRESET_PATTERNS).map(name => (
              <button key={name} className="seq-preset-item" onClick={() => loadPreset(name)}>
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .seq-overlay {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: flex-end; justify-content: center;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          animation: seqFadeIn 0.3s ease-out;
        }
        @keyframes seqFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes seqSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

        .seq-panel {
          width: 100%; max-width: 900px;
          max-height: 85vh;
          background: rgba(8,4,24,0.95);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.06);
          border-bottom: none;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -10px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04);
          display: flex; flex-direction: column;
          overflow: hidden;
          animation: seqSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'Orbitron', monospace;
        }

        .seq-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .seq-title-group { display: flex; align-items: center; gap: 12px; }
        .seq-title {
          font-size: 13px; font-weight: 700; letter-spacing: 0.3em;
          background: linear-gradient(90deg, #00f0ff, #a855f7);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .seq-scale-badge {
          font-size: 8px; letter-spacing: 0.15em;
          padding: 3px 10px; border-radius: 10px;
          background: rgba(168,85,247,0.08);
          border: 1px solid rgba(168,85,247,0.2);
          color: rgba(168,85,247,0.7);
        }
        .seq-icon-btn {
          all: unset; cursor: pointer;
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s;
        }
        .seq-icon-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }

        .seq-transport {
          display: flex; align-items: center; gap: 16px;
          padding: 12px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          flex-wrap: wrap;
        }
        .seq-transport-btn {
          all: unset; cursor: pointer;
          padding: 8px 18px; border-radius: 8px;
          font-family: 'Orbitron', monospace;
          font-size: 10px; letter-spacing: 0.15em; font-weight: 400;
          color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.2s;
          display: flex; align-items: center; gap: 8px;
        }
        .seq-transport-btn:hover { background: rgba(255,255,255,0.06); }
        .seq-transport-btn.active {
          color: #ff4466;
          background: rgba(255,68,102,0.08);
          border-color: rgba(255,68,102,0.3);
          box-shadow: 0 0 20px rgba(255,68,102,0.1);
        }

        .seq-bpm-group { display: flex; align-items: center; gap: 6px; }
        .seq-bpm-display {
          cursor: pointer;
          display: flex; flex-direction: column; align-items: center;
          padding: 4px 12px; border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          transition: background 0.2s;
          min-width: 50px;
        }
        .seq-bpm-display:hover { background: rgba(255,255,255,0.06); }
        .seq-bpm-value { font-size: 16px; color: rgba(0,240,255,0.8); font-weight: 700; }
        .seq-bpm-label { font-size: 7px; letter-spacing: 0.2em; color: rgba(255,255,255,0.25); margin-top: 1px; }
        .seq-tiny-btn {
          all: unset; cursor: pointer;
          width: 26px; height: 26px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          font-family: 'Raleway', sans-serif;
          transition: all 0.15s;
        }
        .seq-tiny-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }

        .seq-swing-group {
          display: flex; align-items: center; gap: 8px;
          margin-left: auto;
        }
        .seq-param-label {
          font-size: 8px; letter-spacing: 0.15em;
          color: rgba(255,255,255,0.25);
        }
        .seq-param-value {
          font-size: 10px; color: rgba(0,240,255,0.5);
          min-width: 30px; text-align: right;
        }
        .seq-slider {
          width: 70px; height: 3px;
          -webkit-appearance: none; appearance: none;
          background: rgba(255,255,255,0.08);
          border-radius: 2px; outline: none;
        }
        .seq-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 12px; height: 12px; border-radius: 50%;
          background: #00f0ff;
          border: 2px solid rgba(0,240,255,0.3);
          cursor: pointer;
          box-shadow: 0 0 8px rgba(0,240,255,0.3);
        }

        .seq-grid-container {
          display: flex;
          flex: 1; overflow: hidden;
          min-height: 0;
        }

        .seq-track-sidebar {
          display: flex; flex-direction: column;
          width: 90px; flex-shrink: 0;
          padding: 24px 0 0;
          border-right: 1px solid rgba(255,255,255,0.04);
        }
        .seq-track-header {
          height: 40px;
          display: flex; align-items: center;
          padding: 0 8px;
          gap: 4px;
          cursor: pointer;
          border-left: 2px solid transparent;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .seq-track-header.active {
          border-left-color: var(--track-color);
          background: rgba(var(--track-rgb), 0.04);
        }
        .seq-track-header:hover { background: rgba(255,255,255,0.02); }
        .seq-track-name {
          font-size: 8px; letter-spacing: 0.12em;
          color: var(--track-color);
          opacity: 0.7;
          flex: 1;
        }
        .seq-track-btns {
          display: flex; gap: 2px;
        }
        .seq-ms-btn {
          all: unset; cursor: pointer;
          width: 16px; height: 14px; border-radius: 3px;
          font-size: 7px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.03);
          transition: all 0.15s;
          font-family: 'Orbitron', monospace;
        }
        .seq-ms-btn.on { color: #ff4466; background: rgba(255,68,102,0.15); }
        .seq-ms-btn.solo.on { color: #ffee00; background: rgba(255,238,0,0.15); }
        .seq-track-oct {
          display: none; /* show on active */
          align-items: center; gap: 2px;
          font-size: 7px; color: rgba(255,255,255,0.25);
        }
        .seq-track-header.active .seq-track-oct { display: flex; }
        .seq-track-header.active .seq-track-btns { display: flex; }
        .seq-oct-btn {
          all: unset; cursor: pointer;
          font-size: 9px; color: rgba(255,255,255,0.3);
          padding: 0 2px;
          font-family: 'Raleway', sans-serif;
        }
        .seq-oct-btn:hover { color: rgba(255,255,255,0.6); }

        .seq-grid-scroll {
          flex: 1; overflow-x: auto; overflow-y: hidden;
          padding: 0 8px;
        }
        .seq-grid {
          display: flex; flex-direction: column;
          min-width: max-content;
        }
        .seq-step-numbers {
          display: flex; height: 20px; gap: 3px;
          padding: 4px 0;
        }
        .seq-step-num {
          width: 36px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 7px; color: rgba(255,255,255,0.15);
          letter-spacing: 0.05em;
        }
        .seq-step-num.beat { color: rgba(255,255,255,0.25); }
        .seq-step-num.active {
          color: #00f0ff;
          text-shadow: 0 0 8px rgba(0,240,255,0.5);
        }

        .seq-track-row {
          display: flex; gap: 3px;
          height: 40px;
          align-items: stretch;
        }

        .seq-step {
          width: 36px; flex-shrink: 0;
          border-radius: 4px;
          background: rgba(255,255,255,0.015);
          border: 1px solid rgba(255,255,255,0.03);
          cursor: pointer;
          transition: all 0.1s;
          position: relative;
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .seq-step.beat { background: rgba(255,255,255,0.025); }
        .seq-step:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); }
        .seq-step.on {
          background: rgba(var(--step-rgb), calc(0.08 + var(--step-vel) * 0.15));
          border-color: rgba(var(--step-rgb), 0.25);
          box-shadow: inset 0 0 10px rgba(var(--step-rgb), 0.05);
        }
        .seq-step.on.playing {
          background: rgba(var(--step-rgb), calc(0.15 + var(--step-vel) * 0.3));
          border-color: rgba(var(--step-rgb), 0.6);
          box-shadow: 0 0 15px rgba(var(--step-rgb), 0.2), inset 0 0 15px rgba(var(--step-rgb), 0.1);
        }
        .seq-step.playing:not(.on) {
          border-color: rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.03);
        }

        .seq-step-bar {
          position: absolute; bottom: 0; left: 2px; right: 2px;
          background: linear-gradient(to top, rgba(var(--step-rgb), 0.5), rgba(var(--step-rgb), 0.15));
          border-radius: 2px 2px 0 0;
          transition: height 0.15s;
        }
        .seq-step-note {
          font-size: 8px; font-weight: 400;
          color: var(--step-color);
          opacity: 0.8;
          z-index: 1;
        }
        .seq-step-vel-label {
          font-size: 7px; color: rgba(255,255,255,0.4);
          z-index: 1;
        }

        .seq-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px 14px;
          border-top: 1px solid rgba(255,255,255,0.04);
          flex-wrap: wrap; gap: 8px;
        }
        .seq-mode-group { display: flex; align-items: center; gap: 6px; }
        .seq-mode-btn {
          all: unset; cursor: pointer;
          padding: 5px 10px; border-radius: 6px;
          font-family: 'Orbitron', monospace;
          font-size: 8px; letter-spacing: 0.1em;
          color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          transition: all 0.15s;
          display: flex; align-items: center; gap: 4px;
        }
        .seq-mode-btn:hover { background: rgba(255,255,255,0.05); }
        .seq-mode-btn.active {
          color: #00f0ff;
          background: rgba(0,240,255,0.06);
          border-color: rgba(0,240,255,0.2);
        }

        .seq-action-group { display: flex; gap: 6px; flex-wrap: wrap; }
        .seq-action-btn {
          all: unset; cursor: pointer;
          padding: 5px 10px; border-radius: 6px;
          font-family: 'Orbitron', monospace;
          font-size: 8px; letter-spacing: 0.08em;
          color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          transition: all 0.15s;
        }
        .seq-action-btn:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5); }
        .seq-action-btn.preset {
          color: rgba(168,85,247,0.5);
          border-color: rgba(168,85,247,0.15);
        }
        .seq-action-btn.preset:hover { background: rgba(168,85,247,0.08); }

        .seq-presets-dropdown {
          position: absolute; bottom: 50px; right: 16px;
          background: rgba(12,6,30,0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(168,85,247,0.2);
          border-radius: 12px;
          padding: 6px;
          display: flex; flex-direction: column; gap: 2px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          z-index: 5;
          animation: seqFadeIn 0.2s ease-out;
        }
        .seq-preset-item {
          all: unset; cursor: pointer;
          padding: 10px 18px; border-radius: 8px;
          font-family: 'Orbitron', monospace;
          font-size: 10px; letter-spacing: 0.1em;
          color: rgba(255,255,255,0.45);
          transition: all 0.15s;
        }
        .seq-preset-item:hover {
          background: rgba(168,85,247,0.1);
          color: rgba(168,85,247,0.9);
        }

        /* Scrollbar */
        .seq-grid-scroll::-webkit-scrollbar { height: 4px; }
        .seq-grid-scroll::-webkit-scrollbar-track { background: transparent; }
        .seq-grid-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
        }

        /* Mobile adjustments */
        @media (max-width: 600px) {
          .seq-panel { max-height: 90vh; }
          .seq-track-sidebar { width: 70px; }
          .seq-step { width: 30px; }
          .seq-transport { gap: 10px; padding: 10px 14px; }
          .seq-swing-group { margin-left: 0; }
          .seq-toolbar { padding: 8px 12px 12px; }
          .seq-track-header { padding: 0 6px; }
          .seq-track-oct { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function clamp(v: number, lo: number, hi: number) { return v < lo ? lo : v > hi ? hi : v; }
