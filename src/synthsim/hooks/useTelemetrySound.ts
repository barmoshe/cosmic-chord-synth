import { useEffect } from "react";
import { applyTelemetry } from "../sound/mapping";
import { DEFAULT_PROFILE, type MappingProfile } from "../sound/profiles";
import type { SoundEngine } from "../sound/audioEngine";
import type { FlightLoopHandle } from "./useFlightLoop";

export function useTelemetrySound(
  flight: FlightLoopHandle,
  engine: SoundEngine,
  active: boolean,
  profile: MappingProfile = DEFAULT_PROFILE,
): void {
  useEffect(() => {
    if (!active) return;
    return flight.subscribe((t) => {
      if (!engine.isReady()) return;
      applyTelemetry(t, engine, profile);
    });
  }, [flight, engine, active, profile]);
}
