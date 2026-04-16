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
      // ── Master bus: gentle glue compressor into a brick-wall limiter ──
      const masterComp = new Tone.Compressor({ threshold: -18, ratio: 3, attack: 0.003, release: 0.1, knee: 6 });
      const masterLimiter = new Tone.Limiter(-1);
      masterComp.connect(masterLimiter);
      masterLimiter.toDestination();

      // ── Shared effects bus (1 algorithmic reverb instead of 5 ConvolverNodes) ──
      const sharedReverb = new Tone.Freeverb({ roomSize: 0.72, dampening: 3000 });
      sharedReverb.wet.value = 0.28;
      sharedReverb.connect(masterComp);

      const mainFilter = new Tone.Filter({ type: "lowpass", frequency: 4500, rolloff: -12 });
      const delay = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.18, wet: 0.1 });
      const chorus = new Tone.Chorus({ frequency: 0.6, delayTime: 3.5, depth: 0.4, wet: 0.12 }).start();

      // ── Lead — lighter Synth instead of FMSynth (2 osc/voice instead of 4) ──
      const lead = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 4,
        oscillator: { type: "fatsawtooth", spread: 20, count: 2 } as any,
        envelope: { attack: 0.05, decay: 0.25, sustain: 0.4, release: 0.35 },
      } as any);
      lead.volume.value = -10;

      const sub = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 3, oscillator: { type: "sine" },
        envelope: { attack: 0.08, decay: 0.2, sustain: 0.5, release: 0.3 },
      } as any);
      sub.volume.value = -18;

      // Lead chain: lead/sub → filter → chorus → delay → sharedReverb → dest
      lead.connect(mainFilter); sub.connect(mainFilter);
      mainFilter.connect(chorus); chorus.connect(delay); delay.connect(sharedReverb);

      // ── Pad — routed through shared reverb ──
      const padFilter = new Tone.Filter({ type: "lowpass", frequency: 1200, rolloff: -12 });
      const pad = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 6, oscillator: { type: "sine" },
        envelope: { attack: 0.5, decay: 0.6, sustain: 0.6, release: 1.0 },
      } as any);
      pad.volume.value = -22; pad.connect(padFilter); padFilter.connect(sharedReverb);

      // ── Bass — dry output (bass doesn't need reverb, keeps it punchy) ──
      const bassFilter = new Tone.Filter({ type: "lowpass", frequency: 800, rolloff: -24 });
      const bass = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 4, oscillator: { type: "square" },
        envelope: { attack: 0.02, decay: 0.12, sustain: 0.6, release: 0.3 },
      } as any);
      bass.volume.value = -14; bass.connect(bassFilter); bassFilter.connect(masterComp);

      // ── Arp — through shared reverb via delay ──
      const arpFilter = new Tone.Filter({ type: "lowpass", frequency: 3000, rolloff: -12 });
      const arpDelay = new Tone.FeedbackDelay({ delayTime: "16n", feedback: 0.2, wet: 0.15 });
      const arp = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 6, oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.08, sustain: 0.15, release: 0.25 },
      } as any);
      arp.volume.value = -18; arp.connect(arpFilter); arpFilter.connect(arpDelay); arpDelay.connect(sharedReverb);

      // ── Drone — through shared reverb ──
      const droneFilter = new Tone.Filter({ type: "lowpass", frequency: 600, rolloff: -12 });
      const drone = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 3, oscillator: { type: "sine" },
        envelope: { attack: 1.5, decay: 1.5, sustain: 0.8, release: 2 },
      } as any);
      drone.volume.value = -24; drone.connect(droneFilter); droneFilter.connect(sharedReverb);
      drone.triggerAttack([m2f(36), m2f(43)], Tone.now());

      const lfo = new Tone.LFO(0.05, 100, 500); lfo.connect(droneFilter.frequency); lfo.start();
      const fft = new Tone.FFT(128); Tone.getDestination().connect(fft);

      // ── Drums — dry output (keeps drums tight and punchy) ──
      const kick = new Tone.MembraneSynth({
        pitchDecay: 0.04, octaves: 5, oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.3 },
      });
      kick.volume.value = -8; kick.connect(masterComp);

      const snare = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.13, sustain: 0, release: 0.1 },
      });
      snare.volume.value = -14;
      const snareFilter = new Tone.Filter({ type: "bandpass", frequency: 3000, Q: 1 });
      snare.connect(snareFilter); snareFilter.connect(masterComp);

      const hihat = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
        harmonicity: 5.1, modulationIndex: 28, resonance: 4000, octaves: 1.5,
      } as any);
      hihat.volume.value = -22; hihat.connect(masterComp);

      const clap = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
      });
      clap.volume.value = -16;
      const clapFilter = new Tone.Filter({ type: "bandpass", frequency: 1500, Q: 1.5 });
      clap.connect(clapFilter); clapFilter.connect(masterComp);

      audioRef.current = {
        ld: lead, sb: sub, pd: pad, bs: bass, ar: arp, dn: drone,
        kick, snare, hihat, clap,
        fi: mainFilter, pf: padFilter, bf: bassFilter, af: arpFilter, df: droneFilter,
        rv: sharedReverb, dl: delay, ch: chorus,
        mc: masterComp, ml: masterLimiter,
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
