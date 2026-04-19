import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";

import { SCALES, SCALE_ORDER, isMobile, THEME_PRESETS } from "./biome-synth/constants";
import { m2f, noteColor } from "./biome-synth/helpers";
import { BIOME_STYLES } from "./biome-synth/styles";
import { useAudioEngine } from "./biome-synth/useAudioEngine";
import { useSetupEffects } from "./biome-synth/useSetupEffects";
import { useThreeScene } from "./biome-synth/useThreeScene";
import { useJungleScene } from "./biome-synth/useJungleScene";
import { useSeaScene } from "./biome-synth/useSeaScene";
import { useCyberpunkScene } from "./biome-synth/useCyberpunkScene";
import { useTouchInput } from "./biome-synth/useTouchInput";
import { useGlowOverlays } from "./biome-synth/useGlowOverlays";
import { useDjAutoPlay, makeEmptyUserLayer, type DjUi, type DrumPattern } from "./biome-synth/useDjAutoPlay";
import { useKeyboardShortcuts } from "./biome-synth/useKeyboardShortcuts";
import DjPanel from "./biome-synth/DjPanel";
import HelpOverlay from "./biome-synth/HelpOverlay";
import JumpingMonkeys from "./biome-synth/JumpingMonkeys";
import JungleFlora from "./biome-synth/JungleFlora";
import FloatingBananas from "./biome-synth/FloatingBananas";
import SwimmingFish from "./biome-synth/SwimmingFish";
import SeaCorals from "./biome-synth/SeaCorals";
import FloatingBubbles from "./biome-synth/FloatingBubbles";
import NeonSkyline from "./biome-synth/NeonSkyline";
import HologramBillboards from "./biome-synth/HologramBillboards";
import NeonRain from "./biome-synth/NeonRain";
import ThemeChooser, { type BiomeTheme } from "./biome-synth/ThemeChooser";

const THEME_STORAGE_KEY = "biome-synth-theme";
const LEGACY_THEME_STORAGE_KEY = "cosmic-synth-theme";

interface SceneMountProps {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  drumCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
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

function SeaSceneMount(p: SceneMountProps) {
  useSeaScene(p.canvasRef, p.engine, p.analysisRef, p.fftBuffer, p.scaleRef, p.engineRef, p.flashIntensity, p.warpState, p.frameCount, p.rafRef, p.analyze);
  return null;
}

function CyberpunkSceneMount(p: SceneMountProps) {
  useCyberpunkScene(p.canvasRef, p.engine, p.analysisRef, p.fftBuffer, p.scaleRef, p.engineRef, p.flashIntensity, p.warpState, p.frameCount, p.rafRef, p.analyze, p.drumCanvasRef);
  return null;
}

function readStoredTheme(): BiomeTheme {
  try {
    let v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v == null) {
      const legacy = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
      if (legacy != null) {
        localStorage.setItem(THEME_STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
        v = legacy;
      }
    }
    if (v === "jungle" || v === "space" || v === "sea" || v === "cyberpunk") return v;
  } catch { /* storage unavailable */ }
  return "space";
}

export default function BiomeSynthApp() {
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
  const [theme, setTheme] = useState<BiomeTheme>(readStoredTheme);
  const [helpOpen, setHelpOpen] = useState(false);

  const isJungle = theme === "jungle";
  const isSea = theme === "sea";
  const isCyberpunk = theme === "cyberpunk";
  const productName = isJungle
    ? "JUNGLE SYNTH"
    : isSea
    ? "SEA SYNTH"
    : isCyberpunk
    ? "NEON SYNTH"
    : "COSMIC SYNTH";
  const warpText = isJungle
    ? "ENTERING THE JUNGLE"
    : isSea
    ? "DIVING INTO THE REEF"
    : isCyberpunk
    ? "JACKING INTO THE GRID"
    : "ENTERING THE COSMOS";

  const handleThemeChange = useCallback((t: BiomeTheme) => {
    setTheme(t);
    try { localStorage.setItem(THEME_STORAGE_KEY, t); } catch { /* storage unavailable */ }
  }, []);

  // DJ UI adapter — DjPanel installs itself here via onReady
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
  const drumCanvasRef = useRef<HTMLCanvasElement>(null);
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
  useDjAutoPlay(autoPlay, engine, engineRef, scaleRef, djState, djUiProxy, touchesRef, userLayerRef, theme, engineReady);

  /* ── Per-theme audio: retune synths/drums/FX + auto-pick fitting scale on theme change ── */
  useEffect(() => {
    const preset = THEME_PRESETS[theme];
    if (!preset) return;
    // Auto-switch the musical scale to the theme's preferred one
    setScale(preset.scale);
    scaleRef.current = preset.scale;
    // Retune the audio graph (no-op until engine is ready; safe to call again on start)
    if (engine.current?.isReady()) {
      engine.current.setTheme(theme);
    }
  }, [theme, engine]);

  /* ── Apply theme preset on first audio start (engine wasn't ready when theme effect ran) ── */
  useEffect(() => {
    if (engineReady) {
      try { engine.current?.setTheme(theme); } catch { /* noop */ }
    }
  }, [engineReady, theme, engine]);

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

  const toggleDj = useCallback(() => setAutoPlay(p => !p), []);
  const toggleHelp = useCallback(() => setHelpOpen(v => !v), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  useKeyboardShortcuts({
    enabled: phase === "play",
    onToggleDj: toggleDj,
    onPrevScale: prevScale,
    onNextScale: nextScale,
    onToggleHelp: toggleHelp,
    onCloseHelp: closeHelp,
  });

  const scaleIndex = SCALE_ORDER.indexOf(scale);

  const sceneProps: SceneMountProps = {
    canvasRef, drumCanvasRef, engine, analysisRef, fftBuffer, scaleRef, engineRef,
    flashIntensity, warpState, frameCount, rafRef, analyze,
  };

  /* ── JSX ── */
  return (
    <div
      className={isJungle ? "theme-jungle" : isSea ? "theme-sea" : isCyberpunk ? "theme-cyberpunk" : "theme-space"}
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: isJungle ? "#0a1f14" : isSea ? "#041a2e" : isCyberpunk ? "#07021a" : "#162540",
        touchAction: "none",
      }}
    >
      <canvas key={`canvas-${theme}`} ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 1, touchAction: "none" }} />
      {isCyberpunk && (
        <canvas
          key={`drum-canvas-${theme}`}
          ref={drumCanvasRef}
          style={{ position: "fixed", inset: 0, zIndex: 4, pointerEvents: "none" }}
        />
      )}
      <div ref={glowContainerRef} style={{ position: "fixed", inset: 0, zIndex: 12, pointerEvents: "none" }} />

      {/* Scene mount — one hook set at a time; key forces clean remount on theme change */}
      {isJungle
        ? <JungleSceneMount key="scene-jungle" {...sceneProps} />
        : isSea
        ? <SeaSceneMount key="scene-sea" {...sceneProps} />
        : isCyberpunk
        ? <CyberpunkSceneMount key="scene-cyberpunk" {...sceneProps} />
        : <SpaceSceneMount key="scene-space" {...sceneProps} />}

      {/* Theme chooser — always accessible */}
      <ThemeChooser theme={theme} onChange={handleThemeChange} />

      {/* Splash Screen */}
      {phase === "splash" && (
        <div
          onTouchStart={() => handleStart()}
          onClick={() => handleStart()}
          className="biome-splash"
        >
          <div className="biome-splash-inner">
            <div className="biome-logo">{productName}</div>
            <div className="biome-subtitle-group">
              <div className="biome-line" />
              <div className="biome-subtitle">INTERACTIVE MUSIC EXPERIENCE</div>
              <div className="biome-line" />
            </div>

            <div className="biome-onboard" aria-label="Quick controls">
              <div className="biome-onboard-card">
                <div className="biome-onboard-icon" aria-hidden="true">◉</div>
                <div className="biome-onboard-label">Touch &amp; drag</div>
                <div className="biome-onboard-hint">play notes</div>
              </div>
              <div className="biome-onboard-card">
                <div className="biome-onboard-icon" aria-hidden="true">▶</div>
                <div className="biome-onboard-label">AI DJ</div>
                <div className="biome-onboard-hint">plays for you</div>
              </div>
              <div className="biome-onboard-card">
                <div className="biome-onboard-icon" aria-hidden="true">◐</div>
                <div className="biome-onboard-label">Themes</div>
                <div className="biome-onboard-hint">space · jungle · sea · cyberpunk</div>
              </div>
            </div>

            <div className="biome-cta">
              <div className="biome-cta-ring" />
              <span>TAP TO ENTER</span>
            </div>
          </div>
        </div>
      )}

      {/* Warp Transition */}
      {phase === "warp" && (
        <div className="biome-warp">
          <div className="biome-warp-text">{warpText}</div>
          <div className="biome-warp-bar">
            <div className="biome-warp-fill" style={{ width: `${warpProgress * 100}%` }} />
          </div>
        </div>
      )}

      {/* Jungle overlays — flora sits behind animated monkey sprites */}
      {isJungle && (
        <>
          <JungleFlora visible={phase === "play"} />
          <JumpingMonkeys visible={phase === "play"} />
          <FloatingBananas visible={phase === "play"} />
        </>
      )}

      {/* Sea overlays — corals + distant fish + drifting bubbles */}
      {isSea && (
        <>
          <SeaCorals visible={phase === "play"} />
          <SwimmingFish visible={phase === "play"} />
          <FloatingBubbles visible={phase === "play"} />
        </>
      )}

      {/* Cyberpunk overlays — skyline behind, holograms, rain in front */}
      {isCyberpunk && (
        <>
          <NeonSkyline visible={phase === "play"} />
          <HologramBillboards visible={phase === "play"} />
          <NeonRain visible={phase === "play"} />
        </>
      )}

      {/* Play UI */}
      {phase === "play" && (
        <>
          <div className="biome-header" style={{ opacity: showUI ? 1 : 0 }}>
            <div className="biome-header-title">{productName}</div>
            <div className="biome-header-sub">Touch to Play</div>
          </div>

          {!hintDismissed && (
            <div className="biome-hint">
              <div>Touch to play · Drag to explore</div>
              <div className="biome-hint-detail">← pitch → · ↑ filter ↓</div>
            </div>
          )}

          <DjPanel
            autoPlay={autoPlay}
            onToggle={toggleDj}
            onReady={handleDjUiReady}
            bpm={THEME_PRESETS[theme].bpm}
            userLayerRef={userLayerRef}
            theme={theme}
          />

          <div className="biome-scale-group" aria-label="Scale selector">
            <button
              onTouchStart={(e) => { e.preventDefault(); prevScale(); }}
              onClick={() => prevScale()}
              className="biome-btn biome-btn-arrow"
              aria-label="Previous scale"
            >
              ‹
            </button>
            <div className="biome-scale-meta">
              <div className="biome-scale-label">{SCALES[scale].label}</div>
              <div className="biome-scale-index" aria-hidden="true">
                {scaleIndex + 1} / {SCALE_ORDER.length}
              </div>
            </div>
            <button
              onTouchStart={(e) => { e.preventDefault(); nextScale(); }}
              onClick={() => nextScale()}
              className="biome-btn biome-btn-arrow"
              aria-label="Next scale"
            >
              ›
            </button>
          </div>

          {/* Axis guides — left/right = pitch, top = filter */}
          <div className="biome-axis-label biome-axis-top">↑ Filter Open</div>
          <div className="biome-axis-label biome-axis-left" aria-hidden="true">♪ Low</div>
          <div className="biome-axis-label biome-axis-right" aria-hidden="true">High ♫</div>

          {/* Energy bar (shows DJ energy when auto-playing) */}
          {autoPlay && (
            <div className="biome-energy-bar">
              <div className="biome-energy-fill" style={{ width: `${Math.min(100, (djState.current.ce || 0) * 100)}%` }} />
            </div>
          )}

          {flash && <div className="biome-flash">{flash}</div>}

          {!audioOk && (
            <div className="biome-error">Audio unavailable — visual only</div>
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
            className={`biome-audio-status ${engineReady && ctxState === "running" ? "is-ok" : "is-err"}`}
            role="status"
            aria-live="polite"
          >
            <span className="biome-audio-status-full">
              {ctxState === "running" && engineReady ? "AUDIO OK" : `AUDIO ${ctxState.toUpperCase()} — TAP TO RETRY`}
            </span>
            <span className="biome-audio-status-short" aria-hidden="true">
              {ctxState === "running" && engineReady ? "AUDIO OK" : "AUDIO ⚠ TAP"}
            </span>
          </div>

          {/* Persistent help trigger — always accessible while playing */}
          <button
            type="button"
            className="biome-help-trigger"
            onTouchStart={(e) => { e.preventDefault(); toggleHelp(); }}
            onClick={toggleHelp}
            aria-label="Open controls help"
            aria-expanded={helpOpen}
          >
            <span aria-hidden="true">?</span>
          </button>

          <HelpOverlay open={helpOpen} onClose={closeHelp} />
        </>
      )}


      <style>{BIOME_STYLES}</style>
    </div>
  );
}
