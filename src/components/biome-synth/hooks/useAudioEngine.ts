import { useRef, useCallback, useMemo } from "react";
import * as Tone from "tone";
import { m2f } from "../shared/helpers";
import { SMOOTH, isMobile, THEME_PRESETS } from "../shared/constants";
import type { AnalysisData, AudioEngine, DrumName, LeadEnvelope, ThemeId } from "../shared/types";

interface InternalGraph {
  lead: Tone.PolySynth;
  sub: Tone.PolySynth;
  pad: Tone.PolySynth;
  bass: Tone.PolySynth;
  arp: Tone.PolySynth;
  drone: Tone.PolySynth;
  kick: Tone.MembraneSynth;
  snare: Tone.NoiseSynth;
  hihat: Tone.MetalSynth;
  clap: Tone.NoiseSynth;
  leadFilter: Tone.Filter;
  padFilter: Tone.Filter;
  bassFilter: Tone.Filter;
  arpFilter: Tone.Filter;
  droneFilter: Tone.Filter;
  snareFilter: Tone.Filter;
  clapFilter: Tone.Filter;
  reverb: Tone.Freeverb;
  delay: Tone.FeedbackDelay;
  chorus: Tone.Chorus;
  masterComp: Tone.Compressor;
  masterLimiter: Tone.Limiter;
  fft: Tone.FFT;
  lfo: Tone.LFO;
  activeLead: Map<number, number>;
  droneOn: boolean;
  kickPitch: string;
  // Ambience bus: a single looping Tone.Player → Tone.Volume → masterComp.
  // Bypasses the per-voice reverb so the pre-baked spatial character of each
  // recording stays intact; the master limiter still catches any peaks.
  ambientVolume: Tone.Volume;
  ambientPlayer: Tone.Player | null;
  ambientUrl: string | null;
}

function buildGraph(): InternalGraph {
  const masterLimiter = new Tone.Limiter(-1).toDestination();
  const masterComp = new Tone.Compressor({
    threshold: -18, ratio: 3, attack: 0.003, release: 0.1, knee: 6,
  }).connect(masterLimiter);

  // Freeverb — synchronous comb/allpass reverb. No async IR generation to
  // stall on iOS Safari; audio is usable the moment the graph is wired up.
  const reverb = new Tone.Freeverb({
    roomSize: isMobile ? 0.7 : 0.82,
    dampening: 3500,
    wet: isMobile ? 0.22 : 0.3,
  });
  reverb.connect(masterComp);

  const delay = new Tone.FeedbackDelay({
    delayTime: "8n.",
    feedback: 0.28,
    wet: 0.14,
    maxDelay: 1,
  });
  delay.connect(reverb);

  // Serial FX chain for lead: chorus -> delay -> reverb -> masterComp.
  const chorus = new Tone.Chorus({
    frequency: 0.6, delayTime: 3.5, depth: 0.4, wet: isMobile ? 0 : 0.14,
  }).start();
  chorus.connect(delay);

  const leadFilter = new Tone.Filter({ type: "lowpass", frequency: 4500, rolloff: -12 });
  leadFilter.connect(chorus);

  const lead = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: isMobile ? 3 : 4,
    oscillator: isMobile
      ? { type: "sawtooth" }
      : { type: "fatsawtooth", spread: 20, count: 2 },
    envelope: { attack: 0.05, decay: 0.25, sustain: 0.4, release: 0.35 },
  } as any);
  lead.volume.value = -10;
  lead.connect(leadFilter);

  const sub = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: isMobile ? 2 : 3,
    oscillator: { type: "sine" },
    envelope: { attack: 0.08, decay: 0.2, sustain: 0.5, release: 0.3 },
  } as any);
  sub.volume.value = -18;
  sub.connect(leadFilter);

  const padFilter = new Tone.Filter({ type: "lowpass", frequency: 1200, rolloff: -12 });
  padFilter.connect(reverb);
  const pad = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: isMobile ? 3 : 6,
    oscillator: { type: "sine" },
    envelope: { attack: 0.5, decay: 0.6, sustain: 0.6, release: 1.0 },
  } as any);
  pad.volume.value = -22;
  pad.connect(padFilter);

  const bassFilter = new Tone.Filter({ type: "lowpass", frequency: 800, rolloff: -24 });
  bassFilter.connect(masterComp);
  const bass = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: isMobile ? 2 : 4,
    oscillator: { type: "square" },
    envelope: { attack: 0.02, decay: 0.12, sustain: 0.6, release: 0.3 },
  } as any);
  bass.volume.value = -14;
  bass.connect(bassFilter);

  const arpFilter = new Tone.Filter({ type: "lowpass", frequency: 3000, rolloff: -12 });
  arpFilter.connect(delay);
  const arp = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: isMobile ? 3 : 6,
    oscillator: { type: "triangle" },
    envelope: { attack: 0.01, decay: 0.08, sustain: 0.15, release: 0.25 },
  } as any);
  arp.volume.value = -18;
  arp.connect(arpFilter);

  const droneFilter = new Tone.Filter({ type: "lowpass", frequency: 600, rolloff: -12 });
  droneFilter.connect(reverb);
  const drone = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 3,
    oscillator: { type: "sine" },
    envelope: { attack: 1.5, decay: 1.5, sustain: 0.8, release: 2 },
  } as any);
  drone.volume.value = -24;
  drone.connect(droneFilter);

  const lfo = new Tone.LFO(0.05, 100, 500);
  lfo.connect(droneFilter.frequency);
  lfo.start();

  const fft = new Tone.FFT(128);
  Tone.getDestination().connect(fft);

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.04, octaves: 5, oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.3 },
  });
  kick.volume.value = -8;
  kick.connect(masterComp);

  const snareFilter = new Tone.Filter({ type: "bandpass", frequency: 3000, Q: 1 });
  snareFilter.connect(masterComp);
  const snare = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.13, sustain: 0, release: 0.1 },
  });
  snare.volume.value = -14;
  snare.connect(snareFilter);

  const hihat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
    harmonicity: 5.1, modulationIndex: 28, resonance: 4000, octaves: 1.5,
  } as any);
  hihat.volume.value = -22;
  hihat.connect(masterComp);

  const clapFilter = new Tone.Filter({ type: "bandpass", frequency: 1500, Q: 1.5 });
  clapFilter.connect(masterComp);
  const clap = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
  });
  clap.volume.value = -16;
  clap.connect(clapFilter);

  // Ambience bus — starts at -Infinity dB so there's no click when the first
  // sample loads. playAmbient() ramps this up to the preset's target.
  const ambientVolume = new Tone.Volume(-Infinity);
  ambientVolume.connect(masterComp);

  return {
    lead, sub, pad, bass, arp, drone,
    kick, snare, hihat, clap,
    leadFilter, padFilter, bassFilter, arpFilter, droneFilter, snareFilter, clapFilter,
    reverb, delay, chorus,
    masterComp, masterLimiter,
    fft, lfo,
    activeLead: new Map<number, number>(),
    droneOn: false,
    kickPitch: "C1",
    ambientVolume,
    ambientPlayer: null,
    ambientUrl: null,
  };
}

function disposeGraph(g: InternalGraph) {
  const nodes: Array<{ dispose?: () => void }> = [
    g.lead, g.sub, g.pad, g.bass, g.arp, g.drone,
    g.kick, g.snare, g.hihat, g.clap,
    g.leadFilter, g.padFilter, g.bassFilter, g.arpFilter, g.droneFilter, g.snareFilter, g.clapFilter,
    g.reverb, g.delay, g.chorus,
    g.masterComp, g.masterLimiter,
    g.fft, g.lfo,
    g.ambientPlayer, g.ambientVolume,
  ];
  for (const n of nodes) {
    try { n?.dispose?.(); } catch { /* node already disposed */ }
  }
  g.ambientPlayer = null;
  g.activeLead.clear();
}

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null);
  const graphRef = useRef<InternalGraph | null>(null);
  const analysisRef = useRef<AnalysisData>({ bass: 0, mid: 0, treble: 0, high: 0, vol: 0, pitch: 0 });
  const fftBuffer = useRef(new Float32Array(128));

  const analyze = useCallback(function analyze() {
    const a = analysisRef.current;
    const g = graphRef.current;
    if (!g) { a.bass = a.mid = a.treble = a.high = a.vol = a.pitch = 0; return; }
    const raw = g.fft.getValue() as Float32Array;
    let rB = 0, rM = 0, rT = 0, rH = 0, rV = 0, maxI = 0, maxV = -200;
    const len = raw.length;
    for (let i = 0; i < len; i++) {
      const db = raw[i];
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
  }, []);

  const dispose = useCallback(function dispose() {
    const g = graphRef.current;
    if (!g) return;
    try { g.lead.releaseAll(); g.sub.releaseAll(); g.pad.releaseAll(); g.bass.releaseAll(); g.arp.releaseAll(); g.drone.releaseAll(); } catch { /* context may be gone */ }
    disposeGraph(g);
    graphRef.current = null;
    // Keep engineRef.current pointing to the facade — callers can still invoke
    // isReady() (returns false) and start() (rebuilds) after a dispose.
  }, []);

  const engine = useMemo<AudioEngine>(() => ({
    async start() {
      if (graphRef.current) return true;
      try {
        const g = buildGraph();
        graphRef.current = g;
        // Startup chime — gives immediate audible confirmation that the graph
        // is wired up and the AudioContext is actually producing sound. If the
        // user hears this, any subsequent silence is a routing/input bug, not
        // an unlock bug.
        const t = Tone.now();
        g.lead.triggerAttackRelease(m2f(72), "8n", t + 0.05, 0.35);
        g.lead.triggerAttackRelease(m2f(76), "8n", t + 0.18, 0.35);
        g.lead.triggerAttackRelease(m2f(79), "4n", t + 0.32, 0.4);
        return true;
      } catch (e) {
        console.error("Audio init error:", e);
        graphRef.current = null;
        return false;
      }
    },
    dispose,
    isReady() { return graphRef.current !== null; },

    noteOn(midi, velocity, x, y) {
      const g = graphRef.current; if (!g) return;
      const freq = m2f(midi);
      const subFreq = m2f(midi - 12);
      const brightness = 1 - y / window.innerHeight;
      const cut = 300 + brightness * 5500;
      const now = Tone.now();
      try {
        g.lead.triggerAttack(freq, now, velocity);
        g.sub.triggerAttack(subFreq, now, velocity * 0.5);
        g.leadFilter.frequency.rampTo(cut, 0.08);
        g.pad.volume.rampTo(-28, 0.05);
        g.pad.volume.rampTo(-20, 0.4, now + 0.1);
      } catch { /* trigger during teardown */ }
      g.activeLead.set(midi, freq);
    },

    noteOff(midi) {
      const g = graphRef.current; if (!g) return;
      const freq = g.activeLead.get(midi);
      if (freq === undefined) return;
      const now = Tone.now();
      try {
        g.lead.triggerRelease(freq, now);
        g.sub.triggerRelease(m2f(midi - 12), now);
      } catch { /* noop */ }
      g.activeLead.delete(midi);
    },

    releaseAllLead(time) {
      const g = graphRef.current; if (!g) return;
      try { g.lead.releaseAll(time); g.sub.releaseAll(time); } catch { /* noop */ }
      g.activeLead.clear();
    },

    triggerDrum(name, velocity, time) {
      const g = graphRef.current; if (!g) return;
      try {
        if (name === "kick") g.kick.triggerAttackRelease(g.kickPitch, "8n", time, velocity);
        else if (name === "snare") g.snare.triggerAttackRelease("16n", time, velocity);
        else if (name === "hat") g.hihat.triggerAttackRelease("C2", "32n", time, velocity * 0.6);
        else if (name === "clap") g.clap.triggerAttackRelease("16n", time, velocity);
      } catch { /* noop */ }
    },

    triggerLead(midi, time, velocity, duration = "8n") {
      const g = graphRef.current; if (!g) return;
      try { g.lead.triggerAttackRelease(m2f(midi), duration, time, velocity); } catch { /* noop */ }
    },

    triggerPadChord(midis, time, velocity, duration) {
      const g = graphRef.current; if (!g) return;
      try {
        g.pad.releaseAll(time);
        const freqs = midis.map(m2f);
        if (duration !== undefined) g.pad.triggerAttackRelease(freqs, duration, time, velocity);
        else g.pad.triggerAttack(freqs, time, velocity);
      } catch { /* noop */ }
    },

    triggerBass(midi, time, velocity, duration = "4n") {
      const g = graphRef.current; if (!g) return;
      try { g.bass.triggerAttackRelease(m2f(midi), duration, time, velocity); } catch { /* noop */ }
    },

    triggerArp(midi, time, velocity, duration = "16n") {
      const g = graphRef.current; if (!g) return;
      try { g.arp.triggerAttackRelease(m2f(midi), duration, time, velocity); } catch { /* noop */ }
    },

    startDrone() {
      const g = graphRef.current; if (!g || g.droneOn) return;
      try { g.drone.triggerAttack([m2f(36), m2f(43)], Tone.now()); g.droneOn = true; } catch { /* noop */ }
    },

    stopDrone(time) {
      const g = graphRef.current; if (!g || !g.droneOn) return;
      try { g.drone.releaseAll(time); } catch { /* noop */ }
      g.droneOn = false;
    },

    setFilterCutoff(hz, rampTime = 0.08) {
      const g = graphRef.current; if (!g) return;
      try { g.leadFilter.frequency.rampTo(hz, rampTime); } catch { /* noop */ }
    },

    setPadVolume(db, rampTime = 0.3, time) {
      const g = graphRef.current; if (!g) return;
      try {
        if (time !== undefined) g.pad.volume.rampTo(db, rampTime, time);
        else g.pad.volume.rampTo(db, rampTime);
      } catch { /* noop */ }
    },

    setPadFilter(hz, rampTime = 0.8) {
      const g = graphRef.current; if (!g) return;
      try { g.padFilter.frequency.rampTo(hz, rampTime); } catch { /* noop */ }
    },

    setReverbWet(w, rampTime = 1) {
      const g = graphRef.current; if (!g) return;
      try { g.reverb.wet.rampTo(w, rampTime); } catch { /* noop */ }
    },

    setDelayWet(w, rampTime = 1) {
      const g = graphRef.current; if (!g) return;
      try { g.delay.wet.rampTo(w, rampTime); } catch { /* noop */ }
    },

    setLeadEnvelope(env: LeadEnvelope) {
      const g = graphRef.current; if (!g) return;
      try { g.lead.set({ envelope: env }); } catch { /* noop */ }
    },

    setTheme(theme: ThemeId) {
      const g = graphRef.current; if (!g) return;
      const p = THEME_PRESETS[theme];
      if (!p) return;
      try {
        // Synth voicings — change oscillator type live
        g.lead.set({ oscillator: p.lead as any, envelope: p.leadEnv });
        g.sub.set({ oscillator: p.sub as any });
        g.pad.set({ oscillator: p.pad as any, envelope: p.padEnv });
        g.bass.set({ oscillator: p.bass as any });
        g.arp.set({ oscillator: p.arp as any });
        g.drone.set({ oscillator: p.drone as any });

        // Filters
        g.leadFilter.frequency.rampTo(p.leadCutoff, 0.4);
        g.padFilter.frequency.rampTo(p.padCutoff, 0.4);
        g.snareFilter.frequency.rampTo(p.snareFilterHz, 0.3);
        g.clapFilter.frequency.rampTo(p.clapFilterHz, 0.3);

        // FX character
        g.reverb.roomSize.value = p.reverbRoom;
        g.reverb.dampening = p.reverbDamp as any;
        g.reverb.wet.rampTo(p.reverbWet, 0.6);
        g.delay.wet.rampTo(p.delayWet, 0.6);
        g.delay.delayTime.rampTo(p.delayTime, 0.4);
        g.chorus.wet.rampTo(p.chorusWet, 0.4);

        // Drum tuning
        g.kickPitch = p.kickPitch;
        g.kick.set({ envelope: { decay: p.kickDecay } as any });
        g.snare.set({ envelope: { decay: p.snareDecay } as any });
        g.hihat.set({ harmonicity: p.hatHarm, resonance: p.hatRes } as any);

        // Ambience cross-fade to the new theme's sample. Best-effort —
        // network / decode failure must not break synth retuning.
        if (p.ambientUrl) {
          this.playAmbient(p.ambientUrl, p.ambientVolumeDb, p.ambientFadeSec);
        }
      } catch (e) {
        console.warn("setTheme failed:", e);
      }
    },

    playAmbient(url: string, volumeDb: number, fadeSec: number = 2) {
      const g = graphRef.current; if (!g) return;
      if (g.ambientUrl === url && g.ambientPlayer) {
        // Same URL already playing — just ramp volume in case preset changed.
        try { g.ambientVolume.volume.rampTo(volumeDb, Math.max(0.05, fadeSec)); } catch { /* noop */ }
        return;
      }
      const prevPlayer = g.ambientPlayer;
      const fade = Math.max(0.05, fadeSec);
      try {
        const player = new Tone.Player({
          url,
          loop: true,
          autostart: false,
          fadeIn: fade,
          fadeOut: fade,
          onload: () => {
            try {
              const now = Tone.now();
              player.start(now);
              // Ramp the bus up to target — covers first-play silence and
              // also the case where volume was ducked during splash/warp.
              g.ambientVolume.volume.cancelScheduledValues(now);
              g.ambientVolume.volume.rampTo(volumeDb, fade, now);
            } catch { /* context gone */ }
          },
          onerror: (err) => { console.warn("Ambient load failed:", url, err); },
        }).connect(g.ambientVolume);
        g.ambientPlayer = player;
        g.ambientUrl = url;
      } catch (e) {
        console.warn("playAmbient failed:", e);
      }
      // Fade out + dispose the previous player once the overlap ends.
      if (prevPlayer) {
        try {
          const now = Tone.now();
          prevPlayer.fadeOut = fade;
          prevPlayer.stop(now + fade);
          setTimeout(() => {
            try { prevPlayer.dispose(); } catch { /* already gone */ }
          }, fade * 1000 + 100);
        } catch { /* already stopped */ }
      }
    },

    stopAmbient(fadeSec: number = 1) {
      const g = graphRef.current; if (!g) return;
      const fade = Math.max(0.05, fadeSec);
      try {
        g.ambientVolume.volume.rampTo(-Infinity, fade);
        const player = g.ambientPlayer;
        if (player) {
          const now = Tone.now();
          player.stop(now + fade);
          setTimeout(() => {
            try { player.dispose(); } catch { /* already gone */ }
          }, fade * 1000 + 100);
        }
        g.ambientPlayer = null;
        g.ambientUrl = null;
      } catch { /* noop */ }
    },

    setAmbientVolume(db: number, rampSec: number = 0.3) {
      const g = graphRef.current; if (!g) return;
      try { g.ambientVolume.volume.rampTo(db, Math.max(0, rampSec)); } catch { /* noop */ }
    },
  }), [dispose]);

  // Keep the ref in sync with the memoized engine instance.
  if (engineRef.current !== engine) engineRef.current = engine;

  return { engine: engineRef, analysisRef, fftBuffer, analyze, dispose };
}
