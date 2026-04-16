import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = "aurora" | "ember" | "void" | "tidal";
export type TouchMode = "sculpt" | "spark";
export type MoodId = "calm" | "drift" | "storm" | "aurora" | "nebula";

interface SceneState {
  themeId: ThemeId;
  bloomStrength: number;
  reducedMotion: boolean;
  particleBudget: number;
  setTheme: (t: ThemeId) => void;
  setBloom: (v: number) => void;
  setReducedMotion: (v: boolean) => void;
  setParticleBudget: (n: number) => void;
}

interface PhysicsUiState {
  running: boolean;
  touchMode: TouchMode;
  gravityBiasX: number;
  gravityBiasY: number;
  setRunning: (v: boolean) => void;
  setTouchMode: (m: TouchMode) => void;
  setGravityBias: (x: number, y: number) => void;
}

interface AudioUiState {
  ready: boolean;
  masterVolume: number;
  scaleId: string;
  setReady: (v: boolean) => void;
  setMasterVolume: (v: number) => void;
  setScale: (s: string) => void;
}

interface V2Prefs {
  hasOnboarded: boolean;
  themeId: ThemeId;
  scaleId: string;
  setOnboarded: (v: boolean) => void;
  setThemeId: (t: ThemeId) => void;
  setScaleId: (s: string) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  themeId: "aurora",
  bloomStrength: 0.6,
  reducedMotion: false,
  particleBudget: 100,
  setTheme: (themeId) => set({ themeId }),
  setBloom: (bloomStrength) => set({ bloomStrength }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setParticleBudget: (particleBudget) => set({ particleBudget }),
}));

export const usePhysicsUiStore = create<PhysicsUiState>((set) => ({
  running: true,
  touchMode: "sculpt",
  gravityBiasX: 0,
  gravityBiasY: 0,
  setRunning: (running) => set({ running }),
  setTouchMode: (touchMode) => set({ touchMode }),
  setGravityBias: (gravityBiasX, gravityBiasY) => set({ gravityBiasX, gravityBiasY }),
}));

export const useAudioUiStore = create<AudioUiState>((set) => ({
  ready: false,
  masterVolume: 0.8,
  scaleId: "pentatonic",
  setReady: (ready) => set({ ready }),
  setMasterVolume: (masterVolume) => set({ masterVolume }),
  setScale: (scaleId) => set({ scaleId }),
}));

export const useV2Prefs = create<V2Prefs>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      themeId: "aurora",
      scaleId: "pentatonic",
      setOnboarded: (hasOnboarded) => set({ hasOnboarded }),
      setThemeId: (themeId) => set({ themeId }),
      setScaleId: (scaleId) => set({ scaleId }),
    }),
    { name: "cosmic-v2-prefs" }
  )
);
