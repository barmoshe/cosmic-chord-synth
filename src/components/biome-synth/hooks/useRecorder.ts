import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioEngine } from "../shared/types";

/* useRecorder — wraps the AudioEngine's master recorder tap.
   Exposes a simple boolean + start/stop/download API with a live
   elapsed-seconds counter so the UI can show recording duration. */
export interface RecorderController {
  isRecording: boolean;
  elapsed: number; // seconds
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export function useRecorder(
  engineRef: React.MutableRefObject<AudioEngine | null>,
): RecorderController {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!isRecording) return;
    const id = window.setInterval(() => {
      setElapsed((performance.now() - startedAtRef.current) / 1000);
    }, 250);
    return () => window.clearInterval(id);
  }, [isRecording]);

  const start = useCallback(async () => {
    const eng = engineRef.current;
    if (!eng || !eng.isReady()) return;
    const ok = await eng.startRecording();
    if (ok) {
      startedAtRef.current = performance.now();
      setElapsed(0);
      setIsRecording(true);
    }
  }, [engineRef]);

  const stop = useCallback(async () => {
    const eng = engineRef.current;
    if (!eng) return;
    const blob = await eng.stopRecording();
    setIsRecording(false);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    a.href = url;
    a.download = `biome-synth-${ts}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [engineRef]);

  return { isRecording, elapsed, start, stop };
}
