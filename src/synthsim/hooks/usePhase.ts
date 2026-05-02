import { useEffect, useMemo, useRef, useState } from "react";
import {
  PHASES,
  TRANSITIONS,
  phasePattern,
  type PhaseName,
} from "../flightplan/phases";
import { PHASE_PATCHES, type PhaseProfilePatch } from "../flightplan/phaseProfiles";
import type { DrumPattern } from "../flightplan/drumPatterns";
import type { FlightLoopHandle } from "./useFlightLoop";

export interface PhaseHandle {
  phase: PhaseName;
  patch: PhaseProfilePatch;
  pattern: DrumPattern;
}

interface DwellState {
  enteredMs: number;
  candidates: Map<PhaseName, number>;
}

export function usePhase(flight: FlightLoopHandle, active: boolean): PhaseHandle {
  const [phase, setPhase] = useState<PhaseName>("PREFLIGHT");
  const dwellRef = useRef<DwellState>({
    enteredMs: performance.now(),
    candidates: new Map(),
  });

  useEffect(() => {
    if (!active) return;
    return flight.subscribe((t) => {
      const now = performance.now();
      const since = now - dwellRef.current.enteredMs;
      const phaseRec = PHASES[phase];
      if (since < phaseRec.minDwellSec * 1000) return;

      const candidates = TRANSITIONS.filter((tr) => tr.from === phase);
      let advanceTo: PhaseName | null = null;

      for (const tr of candidates) {
        if (tr.predicate(t)) {
          if (!dwellRef.current.candidates.has(tr.to)) {
            dwellRef.current.candidates.set(tr.to, now);
          }
          const seen = dwellRef.current.candidates.get(tr.to)!;
          if (now - seen >= tr.sustainSec * 1000) {
            advanceTo = tr.to;
            break;
          }
        } else {
          dwellRef.current.candidates.delete(tr.to);
        }
      }

      if (advanceTo) {
        dwellRef.current.enteredMs = now;
        dwellRef.current.candidates.clear();
        setPhase(advanceTo);
      }
    });
  }, [flight, active, phase]);

  return useMemo(
    () => ({
      phase,
      patch: PHASE_PATCHES[phase],
      pattern: phasePattern(phase),
    }),
    [phase],
  );
}
