import type { Telemetry } from "../engine/types";
import { headingToScale } from "./scales";
import { DEFAULT_PROFILE, type LinearCurve, type MappingProfile } from "./profiles";
import type { SoundEngine } from "./audioEngine";

export const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

export const linMap = (
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => {
  const span = inMax - inMin;
  if (span === 0) return outMin;
  const t = (clamp(v, inMin, inMax) - inMin) / span;
  return outMin + t * (outMax - outMin);
};

const apply = (curve: LinearCurve, raw: number): { value: number; ramp: number } => ({
  value: linMap(raw, curve.inMin, curve.inMax, curve.outMin, curve.outMax),
  ramp: curve.rampMs / 1000,
});

export function applyTelemetry(
  t: Telemetry,
  eng: SoundEngine,
  profile: MappingProfile = DEFAULT_PROFILE,
): void {
  const masterGain = apply(profile.masterGain, t.throttle);
  eng.setMasterGainDb(masterGain.value, masterGain.ramp);

  if (t.throttle < profile.drumGateThrottle) {
    eng.setDrumGainDb(profile.drumMuteDb, profile.drumGain.rampMs / 1000);
  } else {
    const drum = apply(profile.drumGain, t.throttle);
    eng.setDrumGainDb(drum.value, drum.ramp);
  }

  const bpm = apply(profile.bpm, t.airspeedKt);
  eng.setBpm(bpm.value, bpm.ramp);

  eng.setLeadOctaveOffset(Math.floor(t.altitudeFt / profile.altitudeFtPerOctave));

  const filter = apply(profile.leadFilter, t.pitchDeg);
  eng.setLeadFilterCutoff(filter.value, filter.ramp);

  const pan = apply(profile.masterPan, t.rollDeg);
  eng.setMasterPan(pan.value, pan.ramp);

  const vibrato = apply(profile.vibratoRate, Math.abs(t.yawRateDps));
  eng.setVibratoRate(vibrato.value, vibrato.ramp);

  const droneCutoff = apply(profile.droneFilter, t.verticalSpeedFpm);
  eng.setDroneFilterCutoff(droneCutoff.value, droneCutoff.ramp);

  if (t.rpm < profile.subGateRpm) {
    eng.setSubAmplitudeDb(profile.subMuteDb, profile.subAmplitude.rampMs / 1000);
  } else {
    const sub = apply(profile.subAmplitude, t.rpm);
    eng.setSubAmplitudeDb(sub.value, sub.ramp);
  }

  eng.setLeadScale(headingToScale(t.headingDeg));

  const reverb = apply(profile.reverbWet, t.flaps);
  eng.setReverbWet(reverb.value, reverb.ramp);

  eng.setDelayWet(
    t.gearDown ? profile.delayWet.whenTrue : profile.delayWet.whenFalse,
    profile.delayWet.rampMs / 1000,
  );

  eng.setDistortionWet(
    t.stallWarning ? profile.distortionWet.whenTrue : profile.distortionWet.whenFalse,
    profile.distortionWet.rampMs / 1000,
  );

  eng.setBitcrusherWet(
    t.overspeed ? profile.bitcrusherWet.whenTrue : profile.bitcrusherWet.whenFalse,
    profile.bitcrusherWet.rampMs / 1000,
  );
}
