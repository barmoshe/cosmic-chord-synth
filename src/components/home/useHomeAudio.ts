import { useCallback, useEffect, useMemo, useRef } from "react";
import * as Tone from "tone";
import { SCALES, THEME_PRESETS, type ThemeId } from "@/components/biome-synth/shared/constants";
import { devMotif, genMotif, m2f } from "@/components/biome-synth/shared/helpers";

export interface HomeAudioStartOptions {
  onBeat?: (beat: number) => void;
  onComplete?: () => void;
}

export interface HomeAudio {
  start: (opts: HomeAudioStartOptions) => Promise<void>;
  stopTeaser: () => void;
  previewBiome: (id: ThemeId) => void;
  getFFT: () => Float32Array | null;
}

interface Internals {
  built: boolean;
  starting: boolean;
  disposed: boolean;
  pad?: Tone.PolySynth;
  lead?: Tone.Synth;
  reverb?: Tone.Freeverb;
  fft?: Tone.FFT;
  scheduleIds: number[];
  beatTimeouts: number[];
  completeTimeout?: number;
}

const TEASER_BPM = 120;
const TEASER_SECONDS = 8;
const TEASER_BEATS = 8;

// I → vi → IV → V in C major, voiced as warm 5-note chords (Cmaj9, Am9, Fmaj7add13, G7add9).
const CHORDS: number[][] = [
  [48, 55, 59, 62, 64],
  [45, 52, 55, 59, 64],
  [41, 48, 52, 57, 60],
  [43, 50, 53, 57, 62],
];
const RESOLVE_MIDI = 72; // C5 — final lead resolution

// Per-biome tonic for hover previews; pitched up to lead range.
const BIOME_TONIC: Record<ThemeId, number> = {
  space: 60,
  jungle: 62,
  sea: 67,
  cyberpunk: 65,
};

export function useHomeAudio(): HomeAudio {
  const ref = useRef<Internals>({
    built: false,
    starting: false,
    disposed: false,
    scheduleIds: [],
    beatTimeouts: [],
  });

  const buildGraph = useCallback(() => {
    const i = ref.current;
    if (i.built || i.disposed) return;

    const reverb = new Tone.Freeverb({ roomSize: 0.86, dampening: 3800, wet: 0.45 });
    const fft = new Tone.FFT(64);
    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.9, decay: 0.5, sustain: 0.65, release: 2.4 },
    });
    pad.maxPolyphony = 6;
    pad.volume.value = -10;

    const lead = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.04, decay: 0.3, sustain: 0.2, release: 0.7 },
    });
    lead.volume.value = -14;

    pad.connect(reverb);
    lead.connect(reverb);
    reverb.connect(fft);
    fft.toDestination();

    i.pad = pad;
    i.lead = lead;
    i.reverb = reverb;
    i.fft = fft;
    i.built = true;
  }, []);

  const clearSchedules = useCallback(() => {
    const i = ref.current;
    i.scheduleIds.forEach((id) => Tone.Transport.clear(id));
    i.scheduleIds = [];
    i.beatTimeouts.forEach((id) => window.clearTimeout(id));
    i.beatTimeouts = [];
    if (i.completeTimeout !== undefined) {
      window.clearTimeout(i.completeTimeout);
      i.completeTimeout = undefined;
    }
  }, []);

  const stopTeaser = useCallback(() => {
    const i = ref.current;
    clearSchedules();
    Tone.Transport.stop();
    Tone.Transport.cancel(0);
    i.pad?.releaseAll();
  }, [clearSchedules]);

  const start = useCallback(
    async ({ onBeat, onComplete }: HomeAudioStartOptions) => {
      const i = ref.current;
      if (i.starting || i.disposed) return;
      i.starting = true;
      try {
        await Tone.start();
        buildGraph();
        if (i.disposed) return;

        const pad = i.pad;
        const lead = i.lead;
        if (!pad || !lead) return;

        Tone.Transport.bpm.value = TEASER_BPM;
        Tone.Transport.cancel(0);
        Tone.Transport.stop();
        Tone.Transport.position = 0;

        // Pad chords — one per bar (2 sec) at 120 BPM 4/4.
        CHORDS.forEach((chord, idx) => {
          const id = Tone.Transport.schedule((t) => {
            pad.releaseAll(t);
            pad.triggerAttackRelease(chord.map(m2f), "2n.", t, 0.4);
          }, `${idx}:0:0`);
          i.scheduleIds.push(id);
        });

        // Lead motifs across bars 2 and 3, riding the chord changes.
        const scale = SCALES.pentatonic.notes;
        const motifA = genMotif(scale, 4);
        const motifB = devMotif(motifA, "ornament", scale.length);

        const scheduleMotif = (
          motif: number[],
          bar: number,
          baseChord: number[],
          velocity: number,
        ) => {
          const root = baseChord[0] + 24;
          motif.forEach((degree, step) => {
            const midi = root + scale[degree % scale.length];
            const time = `${bar}:${step}:0`;
            const id = Tone.Transport.schedule((t) => {
              lead.triggerAttackRelease(m2f(midi), "8n", t, velocity);
            }, time);
            i.scheduleIds.push(id);
          });
        };

        scheduleMotif(motifA, 1, CHORDS[1], 0.55);
        scheduleMotif(motifB, 2, CHORDS[2], 0.7);

        const resolveId = Tone.Transport.schedule((t) => {
          lead.triggerAttackRelease(m2f(RESOLVE_MIDI), "2n", t, 0.65);
        }, "3:2:0");
        i.scheduleIds.push(resolveId);

        Tone.Transport.start();

        for (let b = 1; b <= TEASER_BEATS; b += 1) {
          const id = window.setTimeout(() => onBeat?.(b), b * 1000);
          i.beatTimeouts.push(id);
        }

        i.completeTimeout = window.setTimeout(() => {
          stopTeaser();
          onComplete?.();
        }, TEASER_SECONDS * 1000 + 250);
      } finally {
        i.starting = false;
      }
    },
    [buildGraph, stopTeaser],
  );

  const previewBiome = useCallback((id: ThemeId) => {
    const i = ref.current;
    if (!i.built || !i.lead) return;
    const root = BIOME_TONIC[id];
    const scaleName = THEME_PRESETS[id].scale;
    const scale = (SCALES[scaleName] ?? SCALES.pentatonic).notes;
    const degree = scale[Math.floor(Math.random() * scale.length)];
    i.lead.triggerAttackRelease(m2f(root + degree), "8n", undefined, 0.5);
  }, []);

  const getFFT = useCallback(() => {
    const i = ref.current;
    if (!i.fft) return null;
    const value = i.fft.getValue();
    return value instanceof Float32Array ? value : null;
  }, []);

  useEffect(() => {
    const i = ref.current;
    return () => {
      i.disposed = true;
      clearSchedules();
      try {
        Tone.Transport.stop();
        Tone.Transport.cancel(0);
      } catch {
        /* transport may already be torn down */
      }
      i.pad?.dispose();
      i.lead?.dispose();
      i.reverb?.dispose();
      i.fft?.dispose();
      i.pad = undefined;
      i.lead = undefined;
      i.reverb = undefined;
      i.fft = undefined;
      i.built = false;
    };
  }, [clearSchedules]);

  return useMemo(
    () => ({ start, stopTeaser, previewBiome, getFFT }),
    [start, stopTeaser, previewBiome, getFFT],
  );
}
