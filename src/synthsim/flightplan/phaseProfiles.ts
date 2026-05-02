import type { PhaseName } from "./phases";
import type { SoundEngine } from "../sound/audioEngine";

export interface PhaseProfilePatch {
  masterGainCeilingDb?: number;
  drumGainCeilingDb?: number;
  reverbWetBoost?: number;
  delayWetForce?: number;
  leadFilterCeilingHz?: number;
}

export const PHASE_PATCHES: Record<PhaseName, PhaseProfilePatch> = {
  PREFLIGHT: { masterGainCeilingDb: -36, drumGainCeilingDb: -60, reverbWetBoost: 0.05 },
  TAXI:      { masterGainCeilingDb: -20, drumGainCeilingDb: -30 },
  TAKEOFF:   { reverbWetBoost: 0.05 },
  CLIMB:     { reverbWetBoost: 0.15 },
  CRUISE:    { reverbWetBoost: 0.25 },
  DESCENT:   { reverbWetBoost: 0.20, leadFilterCeilingHz: 4000 },
  APPROACH:  { reverbWetBoost: 0.05, delayWetForce: 0.18 },
  LANDING:   { masterGainCeilingDb: -10, reverbWetBoost: 0 },
  SHUTDOWN:  { masterGainCeilingDb: -36, drumGainCeilingDb: -60, reverbWetBoost: 0.4 },
};

const PATCH_RAMP_S = 0.2;
const REVERB_WET_MAX = 1;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export function applyPhasePatch(
  engine: SoundEngine,
  patch: PhaseProfilePatch,
  context: {
    currentMasterGainDb: number;
    currentDrumGainDb: number;
    currentReverbWet: number;
    currentLeadFilterHz: number;
    delayWetFromGear: number;
  },
): void {
  if (patch.masterGainCeilingDb !== undefined) {
    const target = Math.min(context.currentMasterGainDb, patch.masterGainCeilingDb);
    engine.setMasterGainDb(target, PATCH_RAMP_S);
  }
  if (patch.drumGainCeilingDb !== undefined) {
    const target = Math.min(context.currentDrumGainDb, patch.drumGainCeilingDb);
    engine.setDrumGainDb(target, PATCH_RAMP_S);
  }
  if (patch.reverbWetBoost !== undefined) {
    const wet = clamp(context.currentReverbWet + patch.reverbWetBoost, 0, REVERB_WET_MAX);
    engine.setReverbWet(wet, PATCH_RAMP_S);
  }
  if (patch.delayWetForce !== undefined) {
    engine.setDelayWet(patch.delayWetForce, PATCH_RAMP_S);
  } else {
    engine.setDelayWet(context.delayWetFromGear, PATCH_RAMP_S);
  }
  if (patch.leadFilterCeilingHz !== undefined) {
    const target = Math.min(context.currentLeadFilterHz, patch.leadFilterCeilingHz);
    engine.setLeadFilterCutoff(target, PATCH_RAMP_S);
  }
}
