import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";

import { SCALES, SCALE_ORDER, isMobile } from "./cosmic-synth/constants";
import { m2f, noteColor } from "./cosmic-synth/helpers";
import { COSMIC_STYLES } from "./cosmic-synth/styles";
import { useAudioEngine } from "./cosmic-synth/useAudioEngine";
import { useSetupEffects } from "./cosmic-synth/useSetupEffects";
import { useThreeScene } from "./cosmic-synth/useThreeScene";
import { useJungleScene } from "./cosmic-synth/useJungleScene";
import { useTouchInput } from "./cosmic-synth/useTouchInput";
import { useGlowOverlays } from "./cosmic-synth/useGlowOverlays";
import { useDjAutoPlay, makeEmptyUserLayer, type DjUi, type DrumPattern } from "./cosmic-synth/useDjAutoPlay";
import CosmicDjPanel from "./cosmic-synth/CosmicDjPanel";
import JumpingMonkeys from "./cosmic-synth/JumpingMonkeys";
import JungleFlora from "./cosmic-synth/JungleFlora";
import ThemeChooser, { type CosmicTheme } from "./cosmic-synth/ThemeChooser";

const THEME_STORAGE_KEY = "cosmic-synth-theme";

interface SceneMountProps {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  engine: React.MutableRefObject<any>;
  analysisRef: React.MutableRefObject<any>;
  fftBuffer: React.MutableRefObject<Float32Array>;
  scaleRef: React.MutableRefObject<string>;
  engineRef: React.MutableRefObject<any>;
  flashIntensity: React.MutableRefObject<number>;
  warpState: React.MutableRefObject<any>;
  frameCount: React.MutableRefObject<number>;
  rafRef: React.MutableRefObject<number | null>;
  analyze: () => void;
}

function SpaceSceneMount(p: SceneMountProps) {
  useThreeScene(p.canvasRef, p.engine, p.analysisRef, p.fftBuffer, p.scaleRef, p.engineRef, p.flashIntensity, p.warpState, p.frameCount, p.rafRef, p.analyze);
  return null;
}

function JungleSceneMount(p: SceneMountProps) {
  useJungleScene(p.canvasRef, p.engine, p.analysisRef, p.fftBuffer, p.scaleRef, p.engineRef, p.flashIntensity, p.warpState, p.frameCount, p.rafRef, p.analyze);
  return null;
}

function readStoredTheme(): CosmicTheme {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "jungle" || v === "space") return v;
  } catch { /* storage unavailable */ }
  return "space";
}

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
  const [ctxState, setCtxState] = useState<"suspended" | "running" | "closed" | "interrupted">("suspended");
  const [engineReady, setEngineReady] = useState(false);
  const [theme, setTheme] = useState<CosmicTheme>(readStoredTheme);

  const isJungle = theme === "jungle";
  const productName = isJungle ? "JUNGLE SYNTH" : "COSMIC SYNTH";
  const warpText = isJungle ? "ENTERING THE JUNGLE" : "ENTERING THE COSMOS";

  const handleThemeChange = useCallback((t: CosmicTheme) => {
    setTheme(t);
    try { localStorage.setItem(THEME_STORAGE_KEY, t); } catch { /* storage unavailable */ }
  }, []);

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

  // User-edit layer for the drum grid. NaN = no override, 0 = force mute,
  // >0 = force hit at that velocity. Reset per section by useDjAutoPlay.
  const userLayerRef = useRef<DrumPattern>(makeEmptyUserLayer());

  useEffect(() => { scaleRef.current = scale; }, [scale]);

  /* ── Hooks ── */
  const { engine, analysisRef, fftBuffer, analyze, dispose } = useAudioEngine();
  const { resetUIHide } = useSetupEffects(hideTimerRef, setShowUI, hintDismissed, setHintDismissed);
  useTouchInput(canvasRef, engine, engineRef, touchesRef, scaleRef, phase, resetUIHide, theme);
  useGlowOverlays(touchesRef, glowsRef, glowContainerRef);
  useDjAutoPlay(autoPlay, engine, engineRef, scaleRef, djState, djUiProxy, touchesRef, userLayerRef);

  /* ── Cleanup audio on unmount ── */
  useEffect(() => () => { dispose(); }, [dispose]);

  /* ── Poll AudioContext + engine readiness for the status badge ── */
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const raw = (Tone.getContext().rawContext as AudioContext);
        setCtxState(raw.state as typeof ctxState);
      } catch { /* context not yet available */ }
      setEngineReady(!!engine.current?.isReady());
    }, 400);
    return () => clearInterval(id);
  }, [engine]);

  /* ── Audio Start ──
     iOS Safari links the user-activation token to whichever AudioContext.resume()
     call runs synchronously inside the gesture handler. We do TWO things in the
     sync body to maximize the chance of success:
       1. Call rawContext.resume() directly (most reliable on iOS)
       2. Call Tone.start() (handles Tone's context wrappers) */
  const handleStart = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

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

    // --- SYNCHRONOUS unlock (must run in the gesture call stack) ---
    const rawCtx = Tone.getContext().rawContext as AudioContext;
    // Kick the raw context first — this is what iOS Safari actually gates on.
    const rawResume = rawCtx.state !== "running"
      ? rawCtx.resume().catch(() => undefined)
      : Promise.resolve();
    // Tone.start() also calls resume and sets up Tone's own gating logic.
    const toneStart = Tone.start();
    // --- end sync unlock ---

    Promise.all([rawResume, toneStart])
      .then(async () => {
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

  const sceneProps: SceneMountProps = {
    canvasRef, engine, analysisRef, fftBuffer, scaleRef, engineRef,
    flashIntensity, warpState, frameCount, rafRef, analyze,
  };

  /* ── JSX ── */
  return (
    <div
      className={isJungle ? "theme-jungle" : "theme-space"}
      style={{ position: "fixed", inset: 0, overflow: "hidden", background: isJungle ? "#0a1f14" : "#162540", touchAction: "none" }}
    >
      <canvas key={`canvas-${theme}`} ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 1, touchAction: "none" }} />
      <div ref={glowContainerRef} style={{ position: "fixed", inset: 0, zIndex: 12, pointerEvents: "none" }} />

      {/* Scene mount — one hook set at a time; key forces clean remount on theme change */}
      {isJungle
        ? <JungleSceneMount key="scene-jungle" {...sceneProps} />
        : <SpaceSceneMount key="scene-space" {...sceneProps} />}

      {/* Theme chooser — always accessible */}
      <ThemeChooser theme={theme} onChange={handleThemeChange} />

      {/* Splash Screen */}
      {phase === "splash" && (
        <div
          onTouchStart={() => handleStart()}
          onClick={() => handleStart()}
          className="cosmic-splash"
        >
          <div className="cosmic-splash-inner">
            <div className="cosmic-logo">{productName}</div>
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
          <div className="cosmic-warp-text">{warpText}</div>
          <div className="cosmic-warp-bar">
            <div className="cosmic-warp-fill" style={{ width: `${warpProgress * 100}%` }} />
          </div>
        </div>
      )}

      {/* Jungle overlays — flora sits behind animated monkey sprites */}
      {isJungle && (
        <>
          <JungleFlora visible={phase === "play"} />
          <JumpingMonkeys visible={phase === "play"} />
        </>
      )}

      {/* Play UI */}
      {phase === "play" && (
        <>
          <div className="cosmic-header" style={{ opacity: showUI ? 1 : 0 }}>
            <div className="cosmic-header-title">{productName}</div>
            <div className="cosmic-header-sub">Touch to Play</div>
          </div>

          {!hintDismissed && (
            <div className="cosmic-hint">
              <div>Touch to play · Drag to explore</div>
              <div className="cosmic-hint-detail">← pitch → · ↑ filter ↓</div>
            </div>
          )}

          <CosmicDjPanel
            autoPlay={autoPlay}
            onToggle={() => setAutoPlay(p => !p)}
            onReady={handleDjUiReady}
            bpm={94}
            userLayerRef={userLayerRef}
            theme={theme}
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

          {/* Axis guides — minimal set: top = Y-axis, bottom = X-axis */}
          <div className="cosmic-axis-label cosmic-axis-top">↑ Filter Open</div>
          <div className="cosmic-axis-label cosmic-axis-bottom">Pitch: low → high</div>

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

          {/* Audio status badge — click to retry unlock & play a test chime. */}
          <div
            onTouchStart={(e) => {
              e.preventDefault();
              const rawCtx = Tone.getContext().rawContext as AudioContext;
              rawCtx.resume().catch(() => undefined);
              Tone.start().then(() => engine.current?.start());
            }}
            onClick={() => {
              const rawCtx = Tone.getContext().rawContext as AudioContext;
              rawCtx.resume().catch(() => undefined);
              Tone.start().then(() => engine.current?.start());
            }}
            className={`cosmic-audio-status ${engineReady && ctxState === "running" ? "is-ok" : "is-err"}`}
            role="status"
            aria-live="polite"
          >
            <span className="cosmic-audio-status-full">
              {ctxState === "running" && engineReady ? "AUDIO OK" : `AUDIO ${ctxState.toUpperCase()} — TAP TO RETRY`}
            </span>
            <span className="cosmic-audio-status-short" aria-hidden="true">
              {ctxState === "running" && engineReady ? "AUDIO OK" : "AUDIO ⚠ TAP"}
            </span>
          </div>
        </>
      )}


      <style>{COSMIC_STYLES}</style>
    </div>
  );
}
