import { createContext, useCallback, useContext, useMemo, useReducer, useRef, type ReactNode } from "react";
import type { ThemeId } from "@/components/biome-synth/shared/constants";
import { useHomeAudio } from "./useHomeAudio";

export type HomeStage = "idle" | "listening" | "ready";

interface HomeStateValue {
  stage: HomeStage;
  beat: number;
  begin: () => Promise<void>;
  skip: () => void;
  previewBiome: (id: ThemeId) => void;
  getFFT: () => Float32Array | null;
}

interface HomeReducerState {
  stage: HomeStage;
  beat: number;
}

type HomeAction =
  | { type: "begin" }
  | { type: "tick"; beat: number }
  | { type: "complete" };

const TEASER_BEATS = 8;

function reducer(state: HomeReducerState, action: HomeAction): HomeReducerState {
  switch (action.type) {
    case "begin":
      return state.stage === "idle" ? { stage: "listening", beat: 0 } : state;
    case "tick":
      return state.stage === "listening" ? { ...state, beat: action.beat } : state;
    case "complete":
      return { stage: "ready", beat: TEASER_BEATS };
    default:
      return state;
  }
}

const HomeStateContext = createContext<HomeStateValue | null>(null);

interface HomeStateProviderProps {
  children: ReactNode;
}

export function HomeStateProvider({ children }: HomeStateProviderProps) {
  const [state, dispatch] = useReducer(reducer, { stage: "idle", beat: 0 });
  const audio = useHomeAudio();
  const beginRef = useRef<Promise<void> | null>(null);

  const begin = useCallback(async () => {
    if (beginRef.current) return beginRef.current;
    dispatch({ type: "begin" });
    beginRef.current = audio
      .start({
        onBeat: (beat) => dispatch({ type: "tick", beat }),
        onComplete: () => dispatch({ type: "complete" }),
      })
      .catch(() => {
        dispatch({ type: "complete" });
      });
    return beginRef.current;
  }, [audio]);

  const skip = useCallback(() => {
    audio.stopTeaser();
    dispatch({ type: "complete" });
  }, [audio]);

  const value = useMemo<HomeStateValue>(
    () => ({
      stage: state.stage,
      beat: state.beat,
      begin,
      skip,
      previewBiome: audio.previewBiome,
      getFFT: audio.getFFT,
    }),
    [state.stage, state.beat, begin, skip, audio.previewBiome, audio.getFFT],
  );

  return <HomeStateContext.Provider value={value}>{children}</HomeStateContext.Provider>;
}

export function useHomeState(): HomeStateValue {
  const ctx = useContext(HomeStateContext);
  if (!ctx) throw new Error("useHomeState must be used within HomeStateProvider");
  return ctx;
}

export const HOME_TEASER_BEATS = TEASER_BEATS;
