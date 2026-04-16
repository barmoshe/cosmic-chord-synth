import { useEffect, useRef, useState, useCallback } from "react";
import type { MoodId } from "@/stores/v2Stores";
import type { AudioEngine } from "@/components/cosmic-synth/types";

const MOOD_SEQUENCE: MoodId[] = ["drift", "aurora", "calm", "storm", "nebula"];

interface MoodProfile {
  id: MoodId;
  label: string;
  gravityScale: number;
  reverbWet: number;
  delayWet: number;
  padFilter: number;
  leadEnv: { attack: number; decay: number; sustain: number; release: number };
}

const MOOD_PROFILES: Record<MoodId, MoodProfile> = {
  calm:   { id: "calm",   label: "Calm",    gravityScale: 0.7, reverbWet: 0.5,  delayWet: 0.22, padFilter: 900,  leadEnv: { attack: 0.4, decay: 0.6, sustain: 0.6, release: 2.0 } },
  drift:  { id: "drift",  label: "Drift",   gravityScale: 1.0, reverbWet: 0.35, delayWet: 0.16, padFilter: 1200, leadEnv: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 0.9 } },
  storm:  { id: "storm",  label: "Storm",   gravityScale: 1.3, reverbWet: 0.25, delayWet: 0.14, padFilter: 1800, leadEnv: { attack: 0.02, decay: 0.15, sustain: 0.6, release: 0.5 } },
  aurora: { id: "aurora", label: "Aurora",  gravityScale: 1.0, reverbWet: 0.45, delayWet: 0.2,  padFilter: 1400, leadEnv: { attack: 0.2, decay: 0.5, sustain: 0.55, release: 1.4 } },
  nebula: { id: "nebula", label: "Nebula",  gravityScale: 0.4, reverbWet: 0.6,  delayWet: 0.3,  padFilter: 700,  leadEnv: { attack: 0.8, decay: 1.0, sustain: 0.7, release: 3.0 } },
};

interface UseWeatherOpts {
  engineRef: React.MutableRefObject<AudioEngine | null>;
  audioReady: boolean;
  transitionIntervalMs?: number;
}

export function useWeatherSystem({ engineRef, audioReady, transitionIntervalMs = 60_000 }: UseWeatherOpts) {
  const [mood, setMood] = useState<MoodId>("drift");
  const moodIndexRef = useRef(1);
  const profileRef = useRef<MoodProfile>(MOOD_PROFILES.drift);

  const applyProfile = useCallback((p: MoodProfile) => {
    profileRef.current = p;
    const engine = engineRef.current;
    if (!engine || !engine.isReady()) return;
    try {
      engine.setReverbWet(p.reverbWet, 8);
      engine.setDelayWet(p.delayWet, 8);
      engine.setPadFilter(p.padFilter, 6);
      engine.setLeadEnvelope(p.leadEnv);
    } catch {
      // engine disposed mid-ramp; benign
    }
  }, [engineRef]);

  const shiftTo = useCallback((id: MoodId) => {
    setMood(id);
    applyProfile(MOOD_PROFILES[id]);
    moodIndexRef.current = MOOD_SEQUENCE.indexOf(id);
    if (moodIndexRef.current < 0) moodIndexRef.current = 0;
  }, [applyProfile]);

  const forceShift = useCallback(() => {
    moodIndexRef.current = (moodIndexRef.current + 1) % MOOD_SEQUENCE.length;
    shiftTo(MOOD_SEQUENCE[moodIndexRef.current]);
  }, [shiftTo]);

  useEffect(() => {
    if (!audioReady) return;
    applyProfile(MOOD_PROFILES[mood]);
    const id = setInterval(() => {
      moodIndexRef.current = (moodIndexRef.current + 1) % MOOD_SEQUENCE.length;
      shiftTo(MOOD_SEQUENCE[moodIndexRef.current]);
    }, transitionIntervalMs);
    return () => clearInterval(id);
  }, [audioReady, mood, applyProfile, shiftTo, transitionIntervalMs]);

  return {
    mood,
    moodLabel: MOOD_PROFILES[mood].label,
    forceShift,
    gravityScale: () => profileRef.current.gravityScale,
  };
}
