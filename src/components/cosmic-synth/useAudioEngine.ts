import { useRef } from "react";
import * as Tone from "tone";
import { m2f } from "./helpers";
import { SMOOTH } from "./constants";

export function useAudioEngine() {
  const audioRef = useRef<any>(null);
  const analysisRef = useRef({ bass: 0, mid: 0, treble: 0, high: 0, vol: 0, pitch: 0 });
  const fftBuffer = useRef(new Float32Array(128));

  function initAudio() {
    try {
      const mainFilter = new Tone.Filter({ type: "lowpass", frequency: 4500, rolloff: -12 });
      const reverb = new Tone.Reverb({ decay: 3, wet: 0.3 });
      const delay = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.18, wet: 0.1 });
      const chorus = new Tone.Chorus({ frequency: 0.6, delayTime: 3.5, depth: 0.4, wet: 0.12 }).start();

      const lead = new Tone.PolySynth(Tone.FMSynth, {
        maxPolyphony: 8, harmonicity: 2, modulationIndex: 3,
        oscillator: { type: "sawtooth" },
        modulation: { type: "triangle" },
        envelope: { attack: 0.05, decay: 0.25, sustain: 0.4, release: 0.8 },
        modulationEnvelope: { attack: 0.08, decay: 0.15, sustain: 0.3, release: 0.6 },
      } as any);
      lead.volume.value = -10;

      const sub = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 6, oscillator: { type: "sine" },
        envelope: { attack: 0.08, decay: 0.2, sustain: 0.5, release: 0.5 },
      } as any);
      sub.volume.value = -18;

      lead.connect(mainFilter); sub.connect(mainFilter);
      mainFilter.connect(chorus); chorus.connect(delay); delay.connect(reverb); reverb.toDestination();

      const padFilter = new Tone.Filter({ type: "lowpass", frequency: 1200, rolloff: -12 });
      const padReverb = new Tone.Reverb({ decay: 4, wet: 0.4 });
      const pad = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 6, oscillator: { type: "sine" },
        envelope: { attack: 0.5, decay: 0.6, sustain: 0.6, release: 1.0 },
      } as any);
      pad.volume.value = -22; pad.connect(padFilter); padFilter.connect(padReverb); padReverb.toDestination();

      const bassFilter = new Tone.Filter({ type: "lowpass", frequency: 800, rolloff: -24 });
      const bassReverb = new Tone.Reverb({ decay: 1.5, wet: 0.12 });
      const bass = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 4, oscillator: { type: "square" },
        envelope: { attack: 0.02, decay: 0.12, sustain: 0.6, release: 0.3 },
      } as any);
      bass.volume.value = -14; bass.connect(bassFilter); bassFilter.connect(bassReverb); bassReverb.toDestination();

      const arpFilter = new Tone.Filter({ type: "lowpass", frequency: 3000, rolloff: -12 });
      const arpDelay = new Tone.FeedbackDelay({ delayTime: "16n", feedback: 0.2, wet: 0.15 });
      const arp = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 6, oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.08, sustain: 0.15, release: 0.25 },
      } as any);
      arp.volume.value = -18; arp.connect(arpFilter); arpFilter.connect(arpDelay); arpDelay.connect(reverb);

      const droneFilter = new Tone.Filter({ type: "lowpass", frequency: 600, rolloff: -12 });
      const droneReverb = new Tone.Reverb({ decay: 5, wet: 0.4 });
      const drone = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 3, oscillator: { type: "sine" },
        envelope: { attack: 1.5, decay: 1.5, sustain: 0.8, release: 2 },
      } as any);
      drone.volume.value = -24; drone.connect(droneFilter); droneFilter.connect(droneReverb); droneReverb.toDestination();
      drone.triggerAttack([m2f(36), m2f(43)], Tone.now());

      const lfo = new Tone.LFO(0.05, 100, 500); lfo.connect(droneFilter.frequency); lfo.start();
      const fft = new Tone.FFT(128); Tone.getDestination().connect(fft);

      // ── Drum synths (lightweight) ──
      const drumReverb = new Tone.Reverb({ decay: 1, wet: 0.1 }); drumReverb.toDestination();

      const kick = new Tone.MembraneSynth({
        pitchDecay: 0.04, octaves: 5, oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.3 },
      });
      kick.volume.value = -8; kick.connect(drumReverb);

      const snare = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.13, sustain: 0, release: 0.1 },
      });
      snare.volume.value = -14;
      const snareFilter = new Tone.Filter({ type: "bandpass", frequency: 3000, Q: 1 });
      snare.connect(snareFilter); snareFilter.connect(drumReverb);

      const hihat = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
        harmonicity: 5.1, modulationIndex: 28, resonance: 4000, octaves: 1.5,
      } as any);
      hihat.volume.value = -22; hihat.connect(drumReverb);

      const clap = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
      });
      clap.volume.value = -16;
      const clapFilter = new Tone.Filter({ type: "bandpass", frequency: 1500, Q: 1.5 });
      clap.connect(clapFilter); clapFilter.connect(drumReverb);

      audioRef.current = {
        ld: lead, sb: sub, pd: pad, bs: bass, ar: arp, dn: drone,
        kick, snare, hihat, clap,
        fi: mainFilter, pf: padFilter, bf: bassFilter, af: arpFilter, df: droneFilter,
        rv: reverb, dl: delay, ch: chorus, pr: padReverb, br2: bassReverb, dr2: droneReverb,
        drumRv: drumReverb,
        fft, lfo,
      };
      return true;
    } catch (e) {
      console.error("Audio init error:", e);
      return false;
    }
  }

  function analyze() {
    const a = analysisRef.current;
    if (!audioRef.current?.fft) { a.bass = a.mid = a.treble = a.high = a.vol = a.pitch = 0; return; }
    const raw = audioRef.current.fft.getValue();
    let rB = 0, rM = 0, rT = 0, rH = 0, rV = 0, maxI = 0, maxV = -200;
    const len = raw.length;
    for (let i = 0; i < len; i++) {
      const db = raw[i] as number;
      const v = db > -100 ? (db + 100) * 0.01 : 0;
      fftBuffer.current[i] += (v - fftBuffer.current[i]) * 0.2;
      const s = fftBuffer.current[i];
      rV += s;
      if (s > maxV) { maxV = s; maxI = i; }
      const f = (i / len) * 22050;
      if (f < 150) rB += s;
      else if (f < 600) rM += s;
      else if (f < 4000) rT += s;
      else rH += s;
    }
    a.bass += (Math.min(rB / 6, 1) - a.bass) * SMOOTH;
    a.mid += (Math.min(rM / 8, 1) - a.mid) * SMOOTH;
    a.treble += (Math.min(rT / 12, 1) - a.treble) * SMOOTH;
    a.high += (Math.min(rH / 8, 1) - a.high) * SMOOTH;
    a.vol += (Math.min(rV / len, 1) - a.vol) * SMOOTH;
    a.pitch += (maxI / len - a.pitch) * 0.08;
  }

  return { audioRef, analysisRef, fftBuffer, initAudio, analyze };
}
