import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";

import { SCALES, SCALE_ORDER, isMobile } from "./cosmic-synth/constants";
import { m2f, noteColor } from "./cosmic-synth/helpers";
import { COSMIC_STYLES } from "./cosmic-synth/styles";
import { useAudioEngine } from "./cosmic-synth/useAudioEngine";
import { useSetupEffects } from "./cosmic-synth/useSetupEffects";
import { useThreeScene } from "./cosmic-synth/useThreeScene";
import { useTouchInput } from "./cosmic-synth/useTouchInput";
import { useGlowOverlays } from "./cosmic-synth/useGlowOverlays";
import { useDjAutoPlay, type DjUi } from "./cosmic-synth/useDjAutoPlay";
import CosmicDjPanel from "./cosmic-synth/CosmicDjPanel";

export default function CosmicSynth() {
  /* ── State ── */
  const [phase, setPhase] = useState<"splash" | "warp" | "play">("splash");
  const [audioOk, setAudioOk] = useState(true);
  const [scale, setScale] = useState("pentatonic");
  const [autoPlay, setAutoPlay] = useState(false);
  const [flash, setFlash] = useState("");
  const [showUI, setShowUI] = useState(true);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [warpProgress, setWarpProgress] = useState(0);

  // DJ UI adapter — CosmicDjPanel installs itself here via onReady
  const djUiRef = useRef<DjUi>({
    setPhase: () => {}, setNextPhase: () => {}, setProgress: () => {}, setBeat: () => {},
    setStep: () => {}, onDrumHit: () => {}, setEnergy: () => {}, setBpm: () => {},
  });
  const djUiProxy: DjUi = {
    setPhase: (p) => djUiRef.current.setPhase(p),
    setNextPhase: (p) => djUiRef.current.setNextPhase(p),
    setProgress: (v) => djUiRef.current.setProgress(v),
    setBeat: (b) => djUiRef.current.setBeat(b),
    setStep: (s, p) => djUiRef.current.setStep(s, p),
    onDrumHit: (n, v) => djUiRef.current.onDrumHit(n, v),
    setEnergy: (e) => djUiRef.current.setEnergy(e),
    setBpm: (b) => djUiRef.current.setBpm(b),
  };
  const handleDjUiReady = useCallback((ui: DjUi) => { djUiRef.current = ui; }, []);

  /* ── Refs ── */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<any>(null);
  const touchesRef = useRef(new Map());
  const scaleRef = useRef("pentatonic");
  const glowsRef = useRef(new Map());
  const glowContainerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<any>(null);
  const flashIntensity = useRef(0);
  const warpState = useRef({ on: false, t: 0 });
  const djState = useRef<any>({
    on: false, iv: null, si: 0, tis: 0, tt: 0, motif: [], phrase: [], pp: 0,
    ci: 0, ct: 0, bi: 0, am: "up", as: 0, ac: [], ri: 0,
    oct: 4, deg: 0, tf: 0.3, cf: 0.3, te: 0.1, ce: 0.1, rf: 200,
  });
  const frameCount = useRef(0);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => { scaleRef.current = scale; }, [scale]);

  /* ── Hooks ── */
  const { engine, analysisRef, fftBuffer, analyze, dispose } = useAudioEngine();
  const { resetUIHide } = useSetupEffects(hideTimerRef, setShowUI, hintDismissed, setHintDismissed);
  useThreeScene(canvasRef, engine, analysisRef, fftBuffer, scaleRef, engineRef, flashIntensity, warpState, frameCount, rafRef, analyze);
  useTouchInput(canvasRef, engine, engineRef, touchesRef, scaleRef, phase, resetUIHide);
  useGlowOverlays(touchesRef, glowsRef, glowContainerRef);
  useDjAutoPlay(autoPlay, engine, engineRef, scaleRef, djState, djUiProxy, touchesRef);

  /* ── Cleanup audio on unmount ── */
  useEffect(() => () => { dispose(); }, [dispose]);

  /* ── Audio Start ──
     iOS Safari links the browser's user-activation token to the Promise returned
     by the FIRST audio API call made synchronously inside a gesture handler.
     We must NOT:
       - construct a new Tone.Context (orphans the activation)
       - await Tone.start() before the synchronous body finishes
     We MUST call Tone.start() synchronously and attach subsequent work via .then. */
  const handleStart = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Warp animation runs independently of audio — safe to start immediately.
    setPhase("warp");
    warpState.current = { on: true, t: 0 };
    let wp = 0;
    const warpInterval = setInterval(() => {
      wp += 0.02;
      setWarpProgress(Math.min(wp, 1));
      if (wp >= 1) {
        clearInterval(warpInterval);
        setPhase("play");
        warpState.current.on = false;
      }
    }, 25);

    // Synchronous unlock: Tone.start() resume()s the default context under the
    // gesture's activation. Do NOT await here — the .then runs as a microtask
    // after the unlock resolves.
    Tone.start()
      .then(async () => {
        const ctx = Tone.getContext();
        if (ctx.state !== "running") {
          await ctx.rawContext.resume();
        }
        ctx.latencyHint = "interactive";
        ctx.lookAhead = isMobile ? 0.05 : 0.1;
        const ok = await engine.current!.start();
        if (!ok) setAudioOk(false);
      })
      .catch((e) => {
        console.error("Audio start error:", e);
        setAudioOk(false);
      });
  }, [engine]);

  /* ── Scale Controls ── */
  const changeScale = useCallback((newScale: string) => {
    setScale(newScale);
    flashIntensity.current = 1;
    setFlash(SCALES[newScale].label);
    setTimeout(() => setFlash(""), 1500);
  }, []);

  const nextScale = useCallback(() => {
    const i = SCALE_ORDER.indexOf(scale);
    changeScale(SCALE_ORDER[(i + 1) % SCALE_ORDER.length]);
  }, [scale, changeScale]);

  const prevScale = useCallback(() => {
    const i = SCALE_ORDER.indexOf(scale);
    changeScale(SCALE_ORDER[(i - 1 + SCALE_ORDER.length) % SCALE_ORDER.length]);
  }, [scale, changeScale]);

  /* ── JSX ── */
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#162540", touchAction: "none" }}>
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 1, touchAction: "none" }} />
      <div ref={glowContainerRef} style={{ position: "fixed", inset: 0, zIndex: 12, pointerEvents: "none" }} />

      {/* Splash Screen */}
      {phase === "splash" && (
        <div
          onTouchStart={() => handleStart()}
          onClick={() => handleStart()}
          className="cosmic-splash"
        >
          <div className="cosmic-splash-inner">
            <div className="cosmic-logo">COSMIC SYNTH</div>
            <div className="cosmic-subtitle-group">
              <div className="cosmic-line" />
              <div className="cosmic-subtitle">INTERACTIVE MUSIC EXPERIENCE</div>
              <div className="cosmic-line" />
            </div>
            <div className="cosmic-cta">
              <div className="cosmic-cta-ring" />
              <span>TAP TO ENTER</span>
            </div>
          </div>
        </div>
      )}

      {/* Warp Transition */}
      {phase === "warp" && (
        <div className="cosmic-warp">
          <div className="cosmic-warp-text">ENTERING THE COSMOS</div>
          <div className="cosmic-warp-bar">
            <div className="cosmic-warp-fill" style={{ width: `${warpProgress * 100}%` }} />
          </div>
        </div>
      )}

      {/* Play UI */}
      {phase === "play" && (
        <>
          <div className="cosmic-header" style={{ opacity: showUI ? 1 : 0 }}>
            <div className="cosmic-header-title">COSMIC SYNTH</div>
            <div className="cosmic-header-sub">Touch to Play</div>
          </div>

          {!hintDismissed && (
            <div className="cosmic-hint">
              <div>Touch to play · Drag to explore</div>
              <div className="cosmic-hint-detail">← Low pitch — High pitch → &nbsp;|&nbsp; ↑ Bright — Dark ↓</div>
            </div>
          )}

          <CosmicDjPanel
            autoPlay={autoPlay}
            onToggle={() => setAutoPlay(p => !p)}
            onReady={handleDjUiReady}
            bpm={94}
          />

          <div className="cosmic-scale-group">
            <button
              onTouchStart={(e) => { e.preventDefault(); prevScale(); }}
              onClick={() => prevScale()}
              className="cosmic-btn cosmic-btn-arrow"
            >
              ‹
            </button>
            <div className="cosmic-scale-label">{SCALES[scale].label}</div>
            <button
              onTouchStart={(e) => { e.preventDefault(); nextScale(); }}
              onClick={() => nextScale()}
              className="cosmic-btn cosmic-btn-arrow"
            >
              ›
            </button>
          </div>

          {/* Axis guides */}
          <div className="cosmic-axis-label cosmic-axis-left">Bright</div>
          <div className="cosmic-axis-label cosmic-axis-right">Dark</div>
          <div className="cosmic-axis-label cosmic-axis-top">↑ Filter Open</div>
          <div className="cosmic-axis-label cosmic-axis-bottom">← Low Pitch — High Pitch →</div>

          {/* Energy bar (shows DJ energy when auto-playing) */}
          {autoPlay && (
            <div className="cosmic-energy-bar">
              <div className="cosmic-energy-fill" style={{ width: `${Math.min(100, (djState.current.ce || 0) * 100)}%` }} />
            </div>
          )}

          {flash && <div className="cosmic-flash">{flash}</div>}

          {!audioOk && (
            <div className="cosmic-error">Audio unavailable — visual only</div>
          )}
        </>
      )}


      <style>{COSMIC_STYLES}</style>
    </div>
  );
}
