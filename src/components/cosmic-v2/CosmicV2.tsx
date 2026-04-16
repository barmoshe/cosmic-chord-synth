import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useAudioEngine } from "@/components/cosmic-synth/useAudioEngine";
import { SCALES } from "@/components/cosmic-synth/constants";
import { cn } from "@/lib/utils";

import { usePhysicsEngine } from "./hooks/usePhysicsEngine";
import { useGyroInput } from "./hooks/useGyroInput";
import { usePhysicsAudioBridge } from "./audio/usePhysicsAudioBridge";
import { useCosmicScene } from "./three/useCosmicScene";
import { useWeatherSystem } from "./weather/useWeatherSystem";
import { SettingsSheet } from "./ui/SettingsSheet";
import { MoodChip } from "./ui/MoodChip";
import {
  useAudioUiStore,
  usePhysicsUiStore,
  useSceneStore,
  useV2Prefs,
} from "@/stores/v2Stores";
import type { Vec3 } from "./physics/types";

type Phase = "splash" | "play";

export default function CosmicV2() {
  const [phase, setPhase] = useState<Phase>("splash");
  const [audioReady, setAudioReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);

  const { engine, dispose } = useAudioEngine();

  const themeId = useSceneStore((s) => s.themeId);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const setScene = useSceneStore((s) => s.setTheme);
  const scaleId = useAudioUiStore((s) => s.scaleId);
  const masterVolume = useAudioUiStore((s) => s.masterVolume);
  const setReady = useAudioUiStore((s) => s.setReady);
  const touchMode = usePhysicsUiStore((s) => s.touchMode);
  const running = usePhysicsUiStore((s) => s.running);
  const hasOnboarded = useV2Prefs((s) => s.hasOnboarded);

  // Sync persisted prefs into live stores on mount
  useEffect(() => {
    const persisted = useV2Prefs.getState();
    setScene(persisted.themeId);
    useAudioUiStore.getState().setScale(persisted.scaleId);
  }, [setScene]);

  // Refs needed by hooks
  const themeRef = useRef(themeId);
  const scaleRef = useRef(scaleId);
  const reducedMotionRef = useRef(reducedMotion);
  useEffect(() => { themeRef.current = themeId; }, [themeId]);
  useEffect(() => {
    scaleRef.current = scaleId;
    useV2Prefs.getState().setScaleId(scaleId);
  }, [scaleId]);
  useEffect(() => { reducedMotionRef.current = reducedMotion; }, [reducedMotion]);
  useEffect(() => {
    useV2Prefs.getState().setThemeId(themeId);
  }, [themeId]);

  const physics = usePhysicsEngine({ running: running && phase === "play" });
  const gyro = useGyroInput();
  const weather = useWeatherSystem({ engineRef: engine, audioReady });

  // Feed gyro into physics gravity bias
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const g = weather.gravityScale();
      physics.setGravityBias(gyro.tiltX.current * 45 * g, 0, gyro.tiltY.current * 45 * g);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gyro.tiltX, gyro.tiltY, physics, weather]);

  // Master volume follows the UI slider
  useEffect(() => {
    const db = masterVolume <= 0.001 ? -60 : 20 * Math.log10(masterVolume);
    try { Tone.getDestination().volume.rampTo(db, 0.2); } catch { /* pre-context */ }
  }, [masterVolume]);

  // Audio bridge: physics events → notes
  usePhysicsAudioBridge({
    engineRef: engine,
    scaleIdRef: scaleRef,
    drainEvents: physics.drainEvents,
  });

  // Three.js scene
  useCosmicScene({
    canvasRef,
    bodiesRef: physics.bodiesRef,
    themeRef,
    reducedMotionRef,
  });

  useEffect(() => () => { dispose(); }, [dispose]);

  // Start audio on user gesture. The sync resume + Tone.start() calls MUST run
  // in the gesture call stack (no awaits) — iOS Safari links the user-activation
  // token to the synchronous portion and loses it across await points.
  const handleStart = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Optimistic UI: flip to play immediately so the splash dismisses even if
    // the AudioContext never unlocks (desktop dev, denied autoplay, etc.).
    setPhase("play");
    useV2Prefs.getState().setOnboarded(true);

    // --- SYNCHRONOUS unlock (must run in the gesture call stack) ---
    const rawCtx = Tone.getContext().rawContext as AudioContext;
    const rawResume = rawCtx.state !== "running"
      ? rawCtx.resume().catch(() => undefined)
      : Promise.resolve();
    const toneStart = Tone.start();
    // --- end sync unlock ---

    Promise.all([rawResume, toneStart])
      .then(() => engine.current!.start())
      .then((ok) => {
        if (ok) {
          engine.current!.startDrone();
          setAudioReady(true);
          setReady(true);
        }
      })
      .catch((e) => {
        console.error("v2 audio start failed", e);
      });

    // Ask gyro permission on iOS; best-effort. Must be in gesture on iOS too,
    // but we can fire-and-forget because gyro is non-critical.
    if (/iPhone|iPad/.test(navigator.userAgent)) {
      gyro.requestPermission().catch(() => undefined);
    }
  }, [engine, gyro, setReady]);

  // Touch / pointer → physics field (sculpt) or spark (spark mode)
  const handlePointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Convert to world space on the XZ plane at Y=0 via a simple raycast-ish mapping.
    // The camera faces the origin; we approximate by scaling screen coords to scene units.
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    const worldSpan = 520;
    const worldPos: Vec3 = [nx * worldSpan, 0, ny * worldSpan];

    const scaleNotes = SCALES[scaleId]?.notes ?? SCALES.pentatonic.notes;
    const degree = Math.floor(Math.abs(nx + ny) * scaleNotes.length) % scaleNotes.length;

    if (touchMode === "sculpt") {
      physics.applyField({
        pos: worldPos,
        radius: 220,
        strength: 900,
        mode: "attract",
        ttl: 1.4,
        age: 0,
      });
    } else {
      const flick: Vec3 = [(Math.random() - 0.5) * 60, 0, (Math.random() - 0.5) * 60];
      physics.spawnSpark(worldPos, flick, [0.95, 0.85, 0.35], degree, 5);
    }
  }, [phase, scaleId, touchMode, physics]);

  const splashLabel = useMemo(() => hasOnboarded ? "Resume" : "Begin", [hasOnboarded]);

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black text-white"
      style={{ touchAction: "none" }}
      onPointerDown={handlePointer}
    >
      <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full" />

      {phase === "splash" && (
        <div
          onClick={handleStart}
          onTouchStart={handleStart}
          className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md"
          role="button"
          aria-label="Enter cosmic v2"
        >
          <div className="text-[10px] uppercase tracking-[0.4em] text-white/50">Cosmic</div>
          <h1 className="mt-3 text-4xl font-light tracking-[0.3em]">V 2</h1>
          <p className="mt-4 max-w-xs text-center text-sm leading-relaxed text-white/60">
            A reimagined instrument. Bodies orbit. Collisions sing.
            Tilt your phone to bend gravity.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full border border-white/30 flex items-center justify-center animate-pulse">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
            <div className="text-xs uppercase tracking-[0.3em] text-white/70">Tap to {splashLabel}</div>
          </div>
          <Link
            to="/"
            onClick={(e) => e.stopPropagation()}
            className="mt-10 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-white/40 hover:text-white/80"
          >
            <ArrowLeft className="h-3 w-3" /> Classic
          </Link>
        </div>
      )}

      {phase === "play" && (
        <>
          <MoodChip label={weather.moodLabel} />
          <SettingsSheet onForceWeatherShift={weather.forceShift} currentMoodLabel={weather.moodLabel} />

          <div
            className={cn(
              "fixed bottom-6 left-6 z-30 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-white/70 backdrop-blur-md",
            )}
          >
            {touchMode === "sculpt" ? "Sculpt · pull bodies" : "Spark · spawn stars"}
          </div>

          {gyro.permission === "unknown" && /iPhone|iPad/.test(navigator.userAgent) && (
            <button
              onClick={() => gyro.requestPermission()}
              className="fixed bottom-24 right-6 z-30 rounded-md border border-white/30 bg-black/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/80 backdrop-blur-md"
            >
              Enable tilt
            </button>
          )}
        </>
      )}
    </div>
  );
}
