import { useEffect, useMemo } from "react";
import { createSoundEngine, type SoundEngine } from "../sound/audioEngine";

export interface SoundEngineHandle {
  engine: SoundEngine;
}

export function useSoundEngine(): SoundEngineHandle {
  const engine = useMemo(() => createSoundEngine(), []);

  useEffect(() => {
    return () => {
      engine.dispose();
    };
  }, [engine]);

  return { engine };
}
