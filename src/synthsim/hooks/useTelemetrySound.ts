import { useEffect, useRef } from "react";
import { applyTelemetry } from "../sound/mapping";
import { DEFAULT_PROFILE, type MappingProfile } from "../sound/profiles";
import { applyPhasePatch, type PhaseProfilePatch } from "../flightplan/phaseProfiles";
import type { SoundEngine } from "../sound/audioEngine";
import type { FlightLoopHandle } from "./useFlightLoop";
import type { Telemetry } from "../engine/types";

const captureContext = (t: Telemetry, p: MappingProfile) => {
  const span = (c: { inMin: number; inMax: number; outMin: number; outMax: number }, raw: number) => {
    const sp = c.inMax - c.inMin;
    if (sp === 0) return c.outMin;
    const v = Math.max(c.inMin, Math.min(c.inMax, raw));
    return c.outMin + ((v - c.inMin) / sp) * (c.outMax - c.outMin);
  };
  const masterGain = span(p.masterGain, t.throttle);
  const drumGain = t.throttle < p.drumGateThrottle ? p.drumMuteDb : span(p.drumGain, t.throttle);
  const reverbWet = span(p.reverbWet, t.flaps);
  const leadFilterHz = span(p.leadFilter, t.pitchDeg);
  const delayWetFromGear = t.gearDown ? p.delayWet.whenTrue : p.delayWet.whenFalse;
  return {
    currentMasterGainDb: masterGain,
    currentDrumGainDb: drumGain,
    currentReverbWet: reverbWet,
    currentLeadFilterHz: leadFilterHz,
    delayWetFromGear,
  };
};

const AUDIO_TICK_DECIMATION = 2;

export function useTelemetrySound(
  flight: FlightLoopHandle,
  engine: SoundEngine,
  active: boolean,
  profile: MappingProfile = DEFAULT_PROFILE,
  patch?: PhaseProfilePatch,
): void {
  const patchRef = useRef<PhaseProfilePatch | undefined>(patch);
  patchRef.current = patch;

  useEffect(() => {
    if (!active) return;
    let tick = 0;
    return flight.subscribe((t) => {
      if (!engine.isReady()) return;
      const cur = tick++;
      if (cur % AUDIO_TICK_DECIMATION !== 0) return;
      applyTelemetry(t, engine, profile);
      const current = patchRef.current;
      if (current) {
        applyPhasePatch(engine, current, captureContext(t, profile));
      }
    });
  }, [flight, engine, active, profile]);
}
