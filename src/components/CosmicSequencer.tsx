import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";

/* ═══════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════ */
export interface SeqStep {
  on: boolean;
  note: number;
  vel: number;
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
  synth: "ld" | "bs" | "ar" | "pd" | "kick" | "snare" | "hihat" | "clap";
  isDrum: boolean;
}

const TRACK_DEFS: Omit<SeqTrack, "steps">[] = [
  // Drum tracks (Solar Flare warm spectrum)
  { id: "kick",  label: "KICK",  color: "#ff3d2e", colorRgb: "255,61,46",   synth: "kick",  muted: false, solo: false, octave: 2, isDrum: true },
  { id: "snare", label: "SNARE", color: "#ffa552", colorRgb: "255,165,82",  synth: "snare", muted: false, solo: false, octave: 3, isDrum: true },
  { id: "hihat", label: "HAT",   color: "#ffd166", colorRgb: "255,209,102", synth: "hihat", muted: false, solo: false, octave: 5, isDrum: true },
  { id: "clap",  label: "CLAP",  color: "#ff5e5b", colorRgb: "255,94,91",   synth: "clap",  muted: false, solo: false, octave: 3, isDrum: true },
  // Melodic tracks
  { id: "lead", label: "LEAD", color: "#ffb347", colorRgb: "255,179,71",  synth: "ld", muted: false, solo: false, octave: 5, isDrum: false },
  { id: "bass", label: "BASS", color: "#7a1f6b", colorRgb: "122,31,107",  synth: "bs", muted: false, solo: false, octave: 3, isDrum: false },
  { id: "arp",  label: "ARP",  color: "#ff8f3d", colorRgb: "255,143,61",  synth: "ar", muted: false, solo: false, octave: 5, isDrum: false },
  // Single cool spark to give the warm palette tension
  { id: "pad",  label: "PAD",  color: "#48cae4", colorRgb: "72,202,228",  synth: "pd", muted: false, solo: false, octave: 4, isDrum: false },
];

function makeEmptySteps(count: number): SeqStep[] {
  return Array.from({ length: count }, () => ({ on: false, note: 0, vel: 0.7, slide: false }));
}

// Drum preset patterns
const DRUM_PRESETS: Record<string, { tracks: { hits: (number | null)[] }[] }> = {
  "Cosmic Pulse": {
    tracks: [
      { hits: [1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null] }, // kick
      { hits: [null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null] }, // snare
      { hits: [1, null, 1, null, 1, null, 1, null, 1, null, 1, null, 1, null, 1, null] }, // hat
      { hits: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, 1, null] }, // clap
    ],
  },
  "Nebula Beat": {
    tracks: [
      { hits: [1, null, null, 1, null, null, 1, null, null, null, 1, null, null, 1, null, null] },
      { hits: [null, null, null, null, 1, null, null, 1, null, null, null, null, 1, null, null, null] },
      { hits: [1, 1, 0.5, 1, 1, 1, 0.5, 1, 1, 1, 0.5, 1, 1, 1, 0.5, 1] },
      { hits: [null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, 1] },
    ],
  },
  "Stellar Groove": {
    tracks: [
      { hits: [1, null, null, null, null, null, 1, null, 1, null, null, null, null, null, 1, null] },
      { hits: [null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null] },
      { hits: [1, null, 1, 1, null, 1, 1, null, 1, null, 1, 1, null, 1, 1, null] },
      { hits: [null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null, null] },
    ],
  },
  "Dark Matter": {
    tracks: [
      { hits: [1, null, 1, null, null, null, null, 1, null, null, 1, null, null, null, null, 1] },
      { hits: [null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null] },
      { hits: [0.5, null, 0.5, null, 0.5, null, 0.5, null, 0.5, null, 0.5, null, 0.5, null, 0.5, null] },
      { hits: [null, null, null, null, 1, null, null, null, null, 1, null, null, 1, null, null, null] },
    ],
  },
};

// Melodic presets
const MELODIC_PRESETS: Record<string, { tracks: { notes: (number | null)[]; vels?: number[] }[] }> = {
  "Cosmic Rise": {
    tracks: [
      { notes: [0, null, 2, null, 4, null, 3, null, 5, null, 4, null, 6, null, 5, null] },
      { notes: [0, null, null, null, 0, null, null, null, 3, null, null, null, 4, null, null, null] },
      { notes: [0, 2, 4, 2, 0, 2, 4, 6, 0, 2, 4, 2, 0, 2, 4, 6] },
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
};

function applyDrumPreset(presetName: string, stepCount: number): SeqTrack[] {
  const preset = DRUM_PRESETS[presetName];
  const drumDefs = TRACK_DEFS.filter(d => d.isDrum);
  const meloDefs = TRACK_DEFS.filter(d => !d.isDrum);
  
  const drumTracks = drumDefs.map((def, ti) => {
    const pTrack = preset?.tracks[ti];
    const steps: SeqStep[] = Array.from({ length: stepCount }, (_, si) => {
      const h = pTrack?.hits?.[si % (pTrack.hits.length)];
      return {
        on: h !== null && h !== undefined,
        note: 0,
        vel: typeof h === 'number' ? h : 0.8,
        slide: false,
      };
    });
    return { ...def, steps };
  });
  
  const meloTracks = meloDefs.map(def => ({ ...def, steps: makeEmptySteps(stepCount) }));
  return [...drumTracks, ...meloTracks];
}

function randomizeDrumTrack(steps: SeqStep[], density: number): SeqStep[] {
  return steps.map(() => ({
    on: Math.random() < density,
    note: 0,
    vel: 0.5 + Math.random() * 0.5,
    slide: false,
  }));
}

function randomizeMelodicTrack(steps: SeqStep[], density: number, maxNote: number = 6): SeqStep[] {
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
  const [presetType, setPresetType] = useState<"drums" | "melody">("drums");
  const [pulseStep, setPulseStep] = useState(-1);

  const playingRef = useRef(false);
  const stepRef = useRef(-1);
  const tracksRef = useRef(tracks);
  const bpmRef = useRef(bpm);
  const swingRef = useRef(swing);
  const intervalRef = useRef<any>(null);
  const tapTimesRef = useRef<number[]>([]);

  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { bpmRef.current = bpm; if (playingRef.current) Tone.getTransport().bpm.value = bpm; }, [bpm]);
  useEffect(() => { swingRef.current = swing; if (playingRef.current) Tone.getTransport().swing = swing * 0.5; }, [swing]);

  // Play engine — uses Tone.Transport for precise Web Audio clock scheduling
  const startPlayback = useCallback(async () => {
    if (playingRef.current) return;

    // Ensure audio context is running (critical for iOS)
    try {
      if (Tone.getContext().state !== "running") {
        await Tone.start();
        await Tone.getContext().resume();
      }
    } catch (e) {
      console.warn("Audio context resume failed:", e);
    }

    playingRef.current = true;
    setPlaying(true);
    stepRef.current = -1;

    const transport = Tone.getTransport();
    transport.bpm.value = bpmRef.current;
    transport.swing = swingRef.current * 0.5;

    intervalRef.current = transport.scheduleRepeat((time) => {
      if (!playingRef.current) return;
      stepRef.current = (stepRef.current + 1) % STEP_COUNT;
      const step = stepRef.current;

      // Defer UI updates to animation frame
      Tone.Draw.schedule(() => {
        setCurrentStep(step);
        setPulseStep(step);
        setTimeout(() => setPulseStep(-1), 100);
      }, time);

      const trks = tracksRef.current;
      const anySolo = trks.some(t => t.solo);
      const sn = scales[scaleRef.current]?.notes || [0, 2, 4, 5, 7, 9, 11];

      for (const track of trks) {
        if (track.muted) continue;
        if (anySolo && !track.solo) continue;
        const s = track.steps[step];
        if (!s.on) continue;

        try {
          if (track.isDrum) {
            const drumSynth = audioRef.current?.[track.synth];
            if (drumSynth) {
              if (track.synth === "kick") {
                drumSynth.triggerAttackRelease("C1", "8n", time, s.vel);
              } else if (track.synth === "hihat") {
                drumSynth.triggerAttackRelease("32n", time, s.vel * 0.6);
              } else {
                drumSynth.triggerAttackRelease("16n", time, s.vel);
              }
            }
          } else {
            const noteIdx = s.note % sn.length;
            const midi = track.octave * 12 + sn[noteIdx];
            const freq = m2fFn(midi);
            const dur = (60 / bpmRef.current) * 0.4;
            const synth = audioRef.current?.[track.synth];
            if (synth) {
              if (track.synth === "pd") {
                synth.triggerAttackRelease(freq, dur * 3, time, s.vel * 0.4);
              } else {
                synth.triggerAttackRelease(freq, dur, time, s.vel);
              }
            }
            if (track.synth === "ld" && audioRef.current?.sb) {
              audioRef.current.sb.triggerAttackRelease(m2fFn(midi - 12), dur, time, s.vel * 0.4);
            }

            // Visuals for melodic — deferred to animation frame
            if (engineRef.current) {
              Tone.Draw.schedule(() => {
                const fx = ((midi - 48) / 36) * window.innerWidth;
                const fy = (1 - s.vel) * window.innerHeight;
                const [wx, wy, wz] = engineRef.current.s2w(fx, fy);
                const col = noteColorFn(midi);
                engineRef.current.addRipple(wx, wy, wz, col);
                engineRef.current.emitParticles(wx, wy, wz, col, Math.floor(4 + s.vel * 8), s.vel);
              }, time);
            }
          }

          // Visual burst for drums — deferred to animation frame
          if (track.isDrum && engineRef.current) {
            const vel = s.vel;
            const synthId = track.synth;
            Tone.Draw.schedule(() => {
              const angle = Math.random() * Math.PI * 2;
              const dist = 50 + Math.random() * 150;
              const wx = Math.cos(angle) * dist;
              const wz = Math.sin(angle) * dist;
              const drumColors: Record<string, [number, number, number]> = {
                kick: [1, 0.2, 0.3], snare: [1, 0.5, 0], hihat: [1, 0.9, 0], clap: [1, 0.3, 0.7],
              };
              const col = drumColors[synthId] || [1, 1, 1];
              engineRef.current.emitParticles(wx, 0, wz, col, Math.floor(3 + vel * 6), vel * 0.7);
            }, time);
          }
        } catch (e) {
          console.warn("Seq note error:", e);
        }
      }
    }, "16n");

    transport.start();
  }, [audioRef, engineRef, scaleRef, scales, m2fFn, noteColorFn]);

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    setCurrentStep(-1);
    stepRef.current = -1;
    const transport = Tone.getTransport();
    if (intervalRef.current != null) { transport.clear(intervalRef.current); intervalRef.current = null; }
    transport.stop();
  }, []);

  useEffect(() => {
    return () => {
      const transport = Tone.getTransport();
      if (intervalRef.current != null) { transport.clear(intervalRef.current); intervalRef.current = null; }
    };
  }, []);

  // Sequencer keeps playing when collapsed — user can stop via button when reopened

  const toggleStep = useCallback((trackIdx: number, stepIdx: number) => {
    setTracks(prev => prev.map((t, ti) => ti === trackIdx ? {
      ...t, steps: t.steps.map((s, si) => si === stepIdx ? { ...s, on: !s.on } : s),
    } : t));
  }, []);

  const setStepNote = useCallback((trackIdx: number, stepIdx: number, note: number) => {
    setTracks(prev => prev.map((t, ti) => ti === trackIdx ? {
      ...t, steps: t.steps.map((s, si) => si === stepIdx ? { ...s, note, on: true } : s),
    } : t));
  }, []);

  const setStepVel = useCallback((trackIdx: number, stepIdx: number, vel: number) => {
    setTracks(prev => prev.map((t, ti) => ti === trackIdx ? {
      ...t, steps: t.steps.map((s, si) => si === stepIdx ? { ...s, vel } : s),
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
    setTracks(prev => prev.map((t, ti) => {
      if (ti !== activeTrack) return t;
      if (t.isDrum) {
        const density = t.synth === "kick" ? 0.3 : t.synth === "snare" ? 0.2 : t.synth === "hihat" ? 0.6 : 0.15;
        return { ...t, steps: randomizeDrumTrack(t.steps, density) };
      }
      return { ...t, steps: randomizeMelodicTrack(t.steps, t.synth === "pd" ? 0.15 : t.synth === "bs" ? 0.3 : 0.45) };
    }));
  }, [activeTrack]);

  const loadPreset = useCallback((name: string, type: "drums" | "melody") => {
    if (type === "drums") {
      const preset = DRUM_PRESETS[name];
      if (!preset) return;
      setTracks(prev => {
        const drumTracks = prev.filter(t => t.isDrum);
        const meloTracks = prev.filter(t => !t.isDrum);
        const newDrums = drumTracks.map((def, ti) => {
          const pTrack = preset.tracks[ti];
          const steps: SeqStep[] = Array.from({ length: STEP_COUNT }, (_, si) => {
            const h = pTrack?.hits?.[si % (pTrack.hits.length)];
            return { on: h !== null && h !== undefined, note: 0, vel: typeof h === 'number' ? Math.max(h, 0.5) : 0.8, slide: false };
          });
          return { ...def, steps };
        });
        return [...newDrums, ...meloTracks];
      });
    } else {
      const preset = MELODIC_PRESETS[name];
      if (!preset) return;
      setTracks(prev => {
        const drumTracks = prev.filter(t => t.isDrum);
        const meloDefs = prev.filter(t => !t.isDrum);
        const newMelo = meloDefs.map((def, ti) => {
          const pTrack = preset.tracks[ti];
          const steps: SeqStep[] = Array.from({ length: STEP_COUNT }, (_, si) => {
            const n = pTrack?.notes?.[si % (pTrack.notes.length)];
            const v = pTrack?.vels?.[si % (pTrack.vels?.length || 1)];
            return { on: n !== null && n !== undefined, note: n ?? 0, vel: v ?? 0.7, slide: false };
          });
          return { ...def, steps };
        });
        return [...drumTracks, ...newMelo];
      });
    }
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
      setBpm(clamp(Math.round(60000 / avg), 40, 240));
    }
  }, []);

  const scaleNotes = scales[scaleRef.current]?.notes || [0, 2, 4, 5, 7, 9, 11];
  const scaleLabel = scales[scaleRef.current]?.label || "SCALE";
  const noteLabels = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

  const drumTracks = tracks.filter(t => t.isDrum);
  const meloTracks = tracks.filter(t => !t.isDrum);

  if (!visible) return null;

  return (
    <div className="cseq-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cseq-panel" onClick={(e) => e.stopPropagation()}>
        {/* Cosmic background effect */}
        <div className="cseq-bg-stars" />
        
        {/* Header */}
        <div className="cseq-header">
          <div className="cseq-title-group">
            <div className="cseq-nebula-icon">✦</div>
            <span className="cseq-title">COSMIC SEQUENCER</span>
            <span className="cseq-scale-badge">{scaleLabel}</span>
          </div>
          <button className="cseq-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Transport */}
        <div className="cseq-transport">
          <button
            className={`cseq-play-btn ${playing ? "active" : ""}`}
            onClick={() => playing ? stopPlayback() : startPlayback()}
          >
            <span className="cseq-play-icon">{playing ? "■" : "▶"}</span>
          </button>

          <div className="cseq-bpm-group">
            <button className="cseq-adj-btn" onClick={() => setBpm(b => clamp(b - 5, 40, 240))}>−</button>
            <div className="cseq-bpm-display" onClick={tapTempo} title="Tap tempo">
              <span className="cseq-bpm-val">{bpm}</span>
              <span className="cseq-bpm-lbl">BPM</span>
            </div>
            <button className="cseq-adj-btn" onClick={() => setBpm(b => clamp(b + 5, 40, 240))}>+</button>
          </div>

          <div className="cseq-swing-group">
            <span className="cseq-lbl">SWING</span>
            <input
              type="range" min="0" max="100" value={Math.round(swing * 100)}
              onChange={(e) => setSwing(parseInt(e.target.value) / 100)}
              className="cseq-slider"
            />
            <span className="cseq-val">{Math.round(swing * 100)}%</span>
          </div>
        </div>

        {/* Grid */}
        <div className="cseq-grid-container">
          {/* Track sidebar */}
          <div className="cseq-sidebar">
            {/* Drum section label */}
            <div className="cseq-section-label">⚡ DRUMS</div>
            {tracks.map((track, ti) => {
              // Insert separator before melodic
              const showMeloLabel = ti === drumTracks.length;
              return (
                <div key={track.id}>
                  {showMeloLabel && <div className="cseq-section-label">♫ MELODIC</div>}
                  <div
                    className={`cseq-track-hdr ${ti === activeTrack ? "active" : ""} ${track.isDrum ? "drum" : "melo"}`}
                    onClick={() => setActiveTrack(ti)}
                    style={{ "--tc": track.color, "--tcr": track.colorRgb } as any}
                  >
                    <div className="cseq-track-name">{track.label}</div>
                    <div className="cseq-track-ctrls">
                      <button className={`cseq-ms ${track.muted ? "on" : ""}`}
                        onClick={(e) => { e.stopPropagation(); toggleMute(ti); }}>M</button>
                      <button className={`cseq-ms solo ${track.solo ? "on" : ""}`}
                        onClick={(e) => { e.stopPropagation(); toggleSolo(ti); }}>S</button>
                    </div>
                    {!track.isDrum && ti === activeTrack && (
                      <div className="cseq-oct">
                        <button onClick={(e) => { e.stopPropagation(); setTrackOctave(ti, track.octave - 1); }}>−</button>
                        <span>C{track.octave}</span>
                        <button onClick={(e) => { e.stopPropagation(); setTrackOctave(ti, track.octave + 1); }}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step grid */}
          <div className="cseq-grid-scroll">
            <div className="cseq-grid">
              {/* Step numbers */}
              <div className="cseq-step-nums">
                {Array.from({ length: STEP_COUNT }, (_, i) => (
                  <div key={i} className={`cseq-snum ${currentStep === i ? "active" : ""} ${i % 4 === 0 ? "beat" : ""}`}>
                    {i + 1}
                  </div>
                ))}
              </div>

              {tracks.map((track, ti) => {
                const showSep = ti === drumTracks.length;
                return (
                  <div key={track.id}>
                    {showSep && <div className="cseq-grid-sep" />}
                    <div className="cseq-row">
                      {track.steps.map((step, si) => (
                        <div
                          key={si}
                          className={`cseq-step ${step.on ? "on" : ""} ${currentStep === si ? "playing" : ""} ${si % 4 === 0 ? "beat" : ""} ${ti === activeTrack ? "focused" : ""} ${track.isDrum ? "drum" : ""} ${pulseStep === si && step.on ? "pulse" : ""}`}
                          style={{
                            "--sc": track.color,
                            "--scr": track.colorRgb,
                            "--sv": step.vel,
                          } as any}
                          onClick={() => {
                            if (track.isDrum || editMode === "toggle") toggleStep(ti, si);
                            else if (editMode === "note") {
                              const newNote = (step.note + 1) % scaleNotes.length;
                              setStepNote(ti, si, newNote);
                            } else {
                              const newVel = step.vel >= 0.9 ? 0.3 : step.vel + 0.2;
                              setStepVel(ti, si, newVel);
                            }
                          }}
                        >
                          {step.on && track.isDrum && (
                            <div className="cseq-drum-dot" />
                          )}
                          {step.on && !track.isDrum && editMode === "note" && (
                            <span className="cseq-note-lbl">{noteLabels[scaleNotes[step.note % scaleNotes.length] % 12]}</span>
                          )}
                          {step.on && !track.isDrum && editMode === "vel" && (
                            <span className="cseq-vel-lbl">{Math.round(step.vel * 100)}</span>
                          )}
                          {step.on && !track.isDrum && editMode === "toggle" && (
                            <div className="cseq-step-fill" style={{ height: `${step.vel * 100}%` }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="cseq-toolbar">
          <div className="cseq-modes">
            <span className="cseq-lbl">EDIT</span>
            {(["toggle", "note", "vel"] as const).map(mode => (
              <button key={mode} className={`cseq-mode-btn ${editMode === mode ? "active" : ""}`}
                onClick={() => setEditMode(mode)}>
                {mode === "toggle" ? "●" : mode === "note" ? "♪" : "⚡"} {mode.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="cseq-actions">
            <button className="cseq-act" onClick={randomizeCurrentTrack}>🎲 RND</button>
            <button className="cseq-act" onClick={() => clearTrack(activeTrack)}>✕ CLR</button>
            <button className="cseq-act" onClick={clearAll}>⊘ ALL</button>
            <button className="cseq-act preset" onClick={() => { setPresetType("drums"); setShowPresets(!showPresets); }}>
              ⚡ DRUMS
            </button>
            <button className="cseq-act preset" onClick={() => { setPresetType("melody"); setShowPresets(!showPresets); }}>
              ♫ MELO
            </button>
          </div>
        </div>

        {/* Preset dropdown */}
        {showPresets && (
          <div className="cseq-presets">
            <div className="cseq-presets-title">{presetType === "drums" ? "⚡ DRUM PATTERNS" : "♫ MELODIC PATTERNS"}</div>
            {Object.keys(presetType === "drums" ? DRUM_PRESETS : MELODIC_PRESETS).map(name => (
              <button key={name} className="cseq-preset-item" onClick={() => loadPreset(name, presetType)}>
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        /* ── Sequencer "Solar Flare" theme ── */
        .cseq-overlay {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: flex-end; justify-content: center;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          animation: cseqFade 0.3s ease-out;
        }
        @keyframes cseqFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cseqSlide { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes cseqPulse { 0%, 100% { box-shadow: 0 0 0 0 transparent; } 50% { box-shadow: 0 0 20px rgba(var(--scr), 0.6); } }
        @keyframes cseqStarTwinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
        @keyframes cseqNebula { 0%, 100% { opacity: 0.03; } 50% { opacity: 0.08; } }

        .cseq-panel {
          width: 100%; max-width: 960px;
          max-height: 88vh;
          background: rgba(35,16,12,0.97);
          border: 1px solid rgba(255,179,71,0.14);
          border-bottom: none;
          border-radius: 24px 24px 0 0;
          box-shadow: 0 -10px 80px rgba(255,94,91,0.18), 0 -2px 40px rgba(255,179,71,0.08), inset 0 1px 0 rgba(255,241,214,0.05);
          display: flex; flex-direction: column;
          overflow: hidden;
          animation: cseqSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'Orbitron', monospace;
          position: relative;
        }

        .cseq-bg-stars {
          position: absolute; inset: 0; pointer-events: none; overflow: hidden;
          background:
            radial-gradient(1px 1px at 10% 20%, rgba(255,179,71,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 30% 60%, rgba(255,94,91,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 50% 10%, rgba(255,209,102,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 70% 80%, rgba(72,202,228,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 40%, rgba(255,143,61,0.3) 0%, transparent 100%),
            radial-gradient(200px 200px at 20% 30%, rgba(255,94,91,0.05) 0%, transparent 100%),
            radial-gradient(300px 300px at 80% 70%, rgba(255,179,71,0.04) 0%, transparent 100%);
          animation: cseqNebula 8s ease-in-out infinite;
        }

        .cseq-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px 12px;
          border-bottom: 1px solid rgba(255,179,71,0.1);
          position: relative; z-index: 1;
        }
        .cseq-title-group { display: flex; align-items: center; gap: 10px; }
        .cseq-nebula-icon {
          font-size: 16px;
          background: linear-gradient(135deg, #FFB347, #FF5E5B, #FFD166);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: cseqStarTwinkle 2s ease-in-out infinite;
        }
        .cseq-title {
          font-size: 13px; font-weight: 700; letter-spacing: 0.25em;
          background: linear-gradient(90deg, #FFB347, #FF5E5B, #FFD166);
          background-size: 200% 100%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: cosmicGradient 4s ease infinite;
        }
        @keyframes cosmicGradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .cseq-scale-badge {
          font-size: 9px; letter-spacing: 0.15em;
          padding: 4px 12px; border-radius: 12px;
          background: rgba(255,94,91,0.1);
          border: 1px solid rgba(255,94,91,0.28);
          color: #F5C99A;
        }
        .cseq-close-btn {
          all: unset; cursor: pointer;
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; color: #D4A574;
          background: rgba(255,241,214,0.04);
          border: 1px solid rgba(255,241,214,0.1);
          transition: all 0.2s;
        }
        .cseq-close-btn:hover { background: rgba(255,241,214,0.1); color: #FFF1D6; }

        .cseq-transport {
          display: flex; align-items: center; gap: 14px;
          padding: 10px 20px;
          border-bottom: 1px solid rgba(255,179,71,0.1);
          flex-wrap: wrap;
          position: relative; z-index: 1;
        }
        .cseq-play-btn {
          all: unset; cursor: pointer;
          width: 42px; height: 42px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,179,71,0.08);
          border: 1.5px solid rgba(255,179,71,0.3);
          transition: all 0.3s;
        }
        .cseq-play-btn:hover { background: rgba(255,179,71,0.14); border-color: rgba(255,179,71,0.5); }
        .cseq-play-btn.active {
          background: rgba(255,61,46,0.12);
          border-color: rgba(255,61,46,0.5);
          box-shadow: 0 0 20px rgba(255,61,46,0.3);
        }
        .cseq-play-icon { font-size: 15px; color: #FFB347; }
        .cseq-play-btn.active .cseq-play-icon { color: #FF3D2E; }

        .cseq-bpm-group { display: flex; align-items: center; gap: 6px; }
        .cseq-adj-btn {
          all: unset; cursor: pointer;
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; color: #D4A574;
          background: rgba(255,241,214,0.04);
          border: 1px solid rgba(255,241,214,0.1);
          font-family: 'Raleway', sans-serif;
          transition: all 0.15s;
        }
        .cseq-adj-btn:hover { background: rgba(255,241,214,0.1); color: #FFF1D6; }
        .cseq-bpm-display {
          cursor: pointer;
          display: flex; flex-direction: column; align-items: center;
          padding: 5px 16px; border-radius: 10px;
          background: rgba(255,179,71,0.08);
          border: 1px solid rgba(255,179,71,0.2);
          min-width: 52px;
        }
        .cseq-bpm-val { font-size: 17px; color: #FFB347; font-weight: 700; }
        .cseq-bpm-lbl { font-size: 8px; letter-spacing: 0.2em; color: #D4A574; }

        .cseq-swing-group { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .cseq-lbl { font-size: 9px; letter-spacing: 0.15em; color: #D4A574; }
        .cseq-val { font-size: 10px; color: #FFB347; min-width: 30px; text-align: right; }
        .cseq-slider {
          width: 70px; height: 4px;
          -webkit-appearance: none; appearance: none;
          background: rgba(255,241,214,0.1);
          border-radius: 2px; outline: none;
        }
        .cseq-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px; border-radius: 50%;
          background: radial-gradient(circle, #FFB347, rgba(255,179,71,0.5));
          border: none; cursor: pointer;
          box-shadow: 0 0 10px rgba(255,179,71,0.5);
        }

        .cseq-grid-container {
          display: flex; flex: 1; overflow: hidden; min-height: 0;
          position: relative; z-index: 1;
        }

        .cseq-sidebar {
          display: flex; flex-direction: column;
          width: 90px; flex-shrink: 0;
          padding: 0;
          border-right: 1px solid rgba(255,179,71,0.1);
          overflow-y: auto;
        }
        .cseq-section-label {
          font-size: 9px; letter-spacing: 0.2em;
          color: #D4A574;
          padding: 10px 8px 5px;
          border-top: 1px solid rgba(255,179,71,0.1);
        }
        .cseq-section-label:first-child { border-top: none; padding-top: 10px; }

        .cseq-track-hdr {
          height: 36px;
          display: flex; align-items: center;
          padding: 0 6px; gap: 4px;
          cursor: pointer;
          border-left: 3px solid transparent;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .cseq-track-hdr.active {
          border-left-color: var(--tc);
          background: rgba(var(--tcr), 0.12);
        }
        .cseq-track-hdr:hover { background: rgba(255,241,214,0.04); }
        .cseq-track-name {
          font-size: 9px; letter-spacing: 0.1em;
          color: var(--tc); opacity: 0.95; flex: 1;
          font-weight: 600;
        }
        .cseq-track-ctrls { display: flex; gap: 3px; }
        .cseq-ms {
          all: unset; cursor: pointer;
          width: 16px; height: 15px; border-radius: 4px;
          font-size: 7px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          color: #A8825F;
          background: rgba(255,241,214,0.04);
          transition: all 0.15s;
          font-family: 'Orbitron', monospace;
        }
        .cseq-ms.on { color: #FF3D2E; background: rgba(255,61,46,0.18); }
        .cseq-ms.solo.on { color: #FFD166; background: rgba(255,209,102,0.2); }
        .cseq-oct {
          display: flex; align-items: center; gap: 3px;
          font-size: 9px; color: #D4A574;
        }
        .cseq-oct button {
          all: unset; cursor: pointer;
          font-size: 10px; color: #D4A574; padding: 0 3px;
          font-family: 'Raleway', sans-serif;
        }

        .cseq-grid-scroll {
          flex: 1; overflow-x: auto; overflow-y: auto;
          padding: 0 6px;
        }
        .cseq-grid { display: flex; flex-direction: column; min-width: max-content; }
        .cseq-step-nums {
          display: flex; height: 20px; gap: 2px; padding: 6px 0 2px;
          position: sticky; top: 0; z-index: 2;
          background: rgba(35,16,12,0.95);
        }
        .cseq-snum {
          width: 32px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 8px; color: #8A6550;
        }
        .cseq-snum.beat { color: #D4A574; }
        .cseq-snum.active { color: #FFB347; text-shadow: 0 0 8px rgba(255,179,71,0.7); }

        .cseq-grid-sep {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,179,71,0.25), transparent);
          margin: 4px 0;
        }

        .cseq-row { display: flex; gap: 2px; height: 36px; align-items: stretch; }

        .cseq-step {
          width: 32px; flex-shrink: 0;
          border-radius: 6px;
          background: rgba(255,241,214,0.025);
          border: 1px solid rgba(255,241,214,0.05);
          cursor: pointer;
          transition: all 0.1s;
          position: relative;
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .cseq-step.beat { background: rgba(255,241,214,0.04); }
        .cseq-step:hover { background: rgba(255,241,214,0.07); border-color: rgba(255,241,214,0.12); }
        .cseq-step.on {
          background: rgba(var(--scr), calc(0.08 + var(--sv) * 0.2));
          border-color: rgba(var(--scr), 0.3);
          box-shadow: inset 0 0 12px rgba(var(--scr), 0.08);
        }
        .cseq-step.on.drum {
          background: rgba(var(--scr), calc(0.12 + var(--sv) * 0.28));
          border-color: rgba(var(--scr), 0.4);
        }
        .cseq-step.on.playing {
          background: rgba(var(--scr), calc(0.22 + var(--sv) * 0.38));
          border-color: rgba(var(--scr), 0.7);
          box-shadow: 0 0 18px rgba(var(--scr), 0.3), inset 0 0 12px rgba(var(--scr), 0.12);
        }
        .cseq-step.playing:not(.on) {
          border-color: rgba(255,241,214,0.15);
          background: rgba(255,241,214,0.05);
        }
        .cseq-step.pulse {
          animation: cseqPulse 0.3s ease-out;
        }

        .cseq-drum-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: radial-gradient(circle, var(--sc), rgba(var(--scr), 0.5));
          box-shadow: 0 0 8px rgba(var(--scr), 0.4);
        }
        .cseq-step.playing .cseq-drum-dot {
          width: 12px; height: 12px;
          box-shadow: 0 0 14px rgba(var(--scr), 0.7);
        }

        .cseq-step-fill {
          position: absolute; bottom: 0; left: 2px; right: 2px;
          background: linear-gradient(to top, rgba(var(--scr), 0.6), rgba(var(--scr), 0.15));
          border-radius: 2px 2px 0 0;
          transition: height 0.15s;
        }
        .cseq-note-lbl { font-size: 9px; color: var(--sc); opacity: 0.95; z-index: 1; font-weight: 600; }
        .cseq-vel-lbl { font-size: 8px; color: #F5C99A; z-index: 1; }

        .cseq-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px 14px;
          border-top: 1px solid rgba(255,179,71,0.1);
          flex-wrap: wrap; gap: 8px;
          position: relative; z-index: 1;
        }
        .cseq-modes { display: flex; align-items: center; gap: 6px; }
        .cseq-mode-btn {
          all: unset; cursor: pointer;
          padding: 5px 11px; border-radius: 8px;
          font-family: 'Orbitron', monospace;
          font-size: 9px; letter-spacing: 0.08em;
          color: #D4A574;
          background: rgba(255,241,214,0.04);
          border: 1px solid rgba(255,241,214,0.08);
          transition: all 0.15s;
          display: flex; align-items: center; gap: 4px;
        }
        .cseq-mode-btn:hover { background: rgba(255,241,214,0.08); color: #F5C99A; }
        .cseq-mode-btn.active {
          color: #FFB347;
          background: rgba(255,179,71,0.12);
          border-color: rgba(255,179,71,0.32);
        }

        .cseq-actions { display: flex; gap: 5px; flex-wrap: wrap; }
        .cseq-act {
          all: unset; cursor: pointer;
          padding: 5px 11px; border-radius: 8px;
          font-family: 'Orbitron', monospace;
          font-size: 9px; letter-spacing: 0.06em;
          color: #D4A574;
          background: rgba(255,241,214,0.04);
          border: 1px solid rgba(255,241,214,0.08);
          transition: all 0.15s;
        }
        .cseq-act:hover { background: rgba(255,241,214,0.08); color: #F5C99A; }
        .cseq-act.preset {
          color: #FF8A85;
          border-color: rgba(255,138,133,0.25);
        }
        .cseq-act.preset:hover { background: rgba(255,138,133,0.15); color: #FFB0AB; }

        .cseq-presets {
          position: absolute; bottom: 54px; right: 14px;
          background: rgba(35,16,12,0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,138,133,0.3);
          border-radius: 14px;
          padding: 10px;
          display: flex; flex-direction: column; gap: 2px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 30px rgba(255,94,91,0.2);
          z-index: 5;
          animation: cseqFade 0.2s ease-out;
        }
        .cseq-presets-title {
          font-size: 10px; letter-spacing: 0.15em;
          color: #FF8A85;
          padding: 5px 14px 10px;
          border-bottom: 1px solid rgba(255,138,133,0.2);
        }
        .cseq-preset-item {
          all: unset; cursor: pointer;
          padding: 12px 20px; border-radius: 8px;
          font-family: 'Orbitron', monospace;
          font-size: 11px; letter-spacing: 0.1em;
          color: #F5C99A;
          transition: all 0.15s;
        }
        .cseq-preset-item:hover {
          background: rgba(255,138,133,0.15);
          color: #FFB0AB;
        }

        .cseq-grid-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .cseq-grid-scroll::-webkit-scrollbar-track { background: transparent; }
        .cseq-grid-scroll::-webkit-scrollbar-thumb { background: rgba(255,241,214,0.12); border-radius: 2px; }

        @media (max-width: 600px) {
          .cseq-panel { max-height: 92vh; }
          .cseq-sidebar { width: 72px; }
          .cseq-step { width: 30px; }
          .cseq-row { height: 32px; }
          .cseq-transport { gap: 8px; padding: 8px 14px; }
          .cseq-swing-group { margin-left: 0; }
          .cseq-toolbar { padding: 8px 12px 12px; }
          .cseq-track-hdr { padding: 0 4px; height: 32px; }
          .cseq-oct { display: none !important; }
          .cseq-section-label { font-size: 8px; padding: 7px 4px 3px; }
        }
      `}</style>
    </div>
  );
}

function clamp(v: number, lo: number, hi: number) { return v < lo ? lo : v > hi ? hi : v; }
