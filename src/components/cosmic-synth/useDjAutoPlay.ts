import { useEffect } from "react";
import * as Tone from "tone";
import { Draw } from "tone";
import { SCALES, PROGS, DJ_SECTIONS, DRUM_PATTERNS, ARP_MODES, BASE_MIDI, MIDI_RANGE, NOTE_NAMES } from "./constants";
import { m2f, lerp, pick, genMotif, devMotif, buildMatrix, wPick, getArpNote, noteColor } from "./helpers";

export type DrumLane = "kick" | "clap" | "hat" | "snare";
export type DrumPattern = { kick: number[]; clap: number[]; hat: number[]; snare: number[] };

export interface DjUi {
  setPhase: (p: string) => void;
  setNextPhase: (p: string) => void;
  setProgress: (v: number) => void;    // 0..1 within section
  setBeat: (b: number) => void;        // 0..3 quarter-note within bar
  setStep: (step: number, pattern: DrumPattern) => void;  // 16n tick + current bar's drum grid
  onDrumHit: (name: DrumLane, vel: number) => void;       // fires in same frame as audio hit
  setEnergy: (e: number) => void;                          // 0..1
  setBpm: (bpm: number) => void;                           // transport bpm
}

// Per-bar pattern variation — jitters velocities, sprinkles occasional ghost hits on empty steps.
// Intensity 0..1 controls how much drift is applied (higher = more lively).
function variatePattern(
  base: DrumPattern,
  intensity: number,
): DrumPattern {
  const jitter = (v: number) => v === 0 ? 0 : Math.max(0, Math.min(1, v * (1 + (Math.random() - 0.5) * 0.35 * intensity)));
  const lanes: DrumLane[] = ["kick", "clap", "hat", "snare"];
  const out: any = {};
  const ghostChance = { kick: 0.05, clap: 0.07, hat: 0.18, snare: 0.06 } as Record<DrumLane, number>;
  const ghostVel   = { kick: 0.35, clap: 0.25, hat: 0.2, snare: 0.18 } as Record<DrumLane, number>;
  for (const lane of lanes) {
    const src = base[lane];
    const row = new Array(16);
    for (let i = 0; i < 16; i++) {
      if (src[i] > 0) {
        row[i] = jitter(src[i]);
      } else if (Math.random() < ghostChance[lane] * intensity) {
        row[i] = ghostVel[lane] * (0.6 + Math.random() * 0.4);
      } else {
        row[i] = 0;
      }
    }
    out[lane] = row;
  }
  return out;
}

const DJ_VOICE_IDS = ["dj-ml", "dj-bs", "dj-ar"] as const;
type DjVoiceId = typeof DJ_VOICE_IDS[number];

export function useDjAutoPlay(
  autoPlay: boolean,
  audioRef: React.MutableRefObject<any>,
  engineRef: React.MutableRefObject<any>,
  scaleRef: React.MutableRefObject<string>,
  djState: React.MutableRefObject<any>,
  ui: DjUi,
  touchesRef: React.MutableRefObject<Map<any, any>>,
) {
  useEffect(() => {
    const dj = djState.current;
    if (!autoPlay || !audioRef.current) {
      dj.on = false;
      if (dj.iv != null) { Tone.getTransport().clear(dj.iv); dj.iv = null; }
      try {
        audioRef.current?.ld?.releaseAll(); audioRef.current?.sb?.releaseAll();
        audioRef.current?.pd?.releaseAll(); audioRef.current?.bs?.releaseAll();
        audioRef.current?.ar?.releaseAll();
      } catch {}
      DJ_VOICE_IDS.forEach(id => touchesRef.current.delete(id));
      ui.setPhase(""); ui.setNextPhase(""); ui.setProgress(0); ui.setBeat(0);
      ui.setEnergy(0);
      return;
    }

    // ── Initial DJ state ── DRIFT plays once as intro (si=0), then loop PULSE→BLOOM→SURGE→DISSOLVE (1..4→1)
    dj.on = true; dj.si = 0; dj.tis = 0; dj.tt = 0;
    dj.oct = 4; dj.deg = 0;
    dj.cf = 0.15; dj.ce = 0.1;
    dj.ct = 0; dj.ci = 0; dj.as = 0; dj.am = "up";
    dj.ac = [] as number[];

    const sn = () => SCALES[scaleRef.current];
    const sec = () => DJ_SECTIONS[dj.si];
    let prog = (PROGS[scaleRef.current] || PROGS.minor)[0];
    dj.motif = genMotif(sn().notes);
    dj.phrase = [...dj.motif];
    dj.pp = 0;

    let cachedMatrix = buildMatrix(sn().notes);
    let cachedScale = scaleRef.current;
    let lastFilterVal = -1;

    // Fresh variation recomputed at each bar boundary (step === 0); changes every 16 steps.
    let currentPattern = variatePattern(
      DRUM_PATTERNS[sec().drums] || DRUM_PATTERNS.nebula,
      0.25 + sec().e,
    );

    const pulseTimers: Record<DjVoiceId, ReturnType<typeof setTimeout> | null> = {
      "dj-ml": null, "dj-bs": null, "dj-ar": null,
    };
    function pulseGlow(id: DjVoiceId, midi: number, x: number, y: number, durMs: number) {
      const existing = pulseTimers[id];
      if (existing) clearTimeout(existing);
      touchesRef.current.set(id, {
        midi, freq: m2f(midi), subFreq: m2f(midi - 12),
        x, y, note: NOTE_NAMES[((midi % 12) + 12) % 12],
      });
      pulseTimers[id] = setTimeout(() => {
        touchesRef.current.delete(id);
        pulseTimers[id] = null;
      }, durMs);
    }

    function advanceSection() {
      // Looping rule: DRIFT (0) plays once, then cycle 1..4 → 1..4 → …
      dj.si = dj.si === 0 ? 1 : (dj.si === DJ_SECTIONS.length - 1 ? 1 : dj.si + 1);
      dj.tis = 0;
    }

    function applySection() {
      const s = sec();
      const next = DJ_SECTIONS[s === DJ_SECTIONS[DJ_SECTIONS.length - 1] ? 1 : (DJ_SECTIONS.indexOf(s) + 1) % DJ_SECTIONS.length];
      // UI state changes (phase/progress) are not audio-timed and must fire even
      // if the audio context is still unlocking — call directly, not through Tone.Draw.
      ui.setPhase(s.name);
      ui.setNextPhase(next.name);
      ui.setProgress(0);
      ui.setEnergy(s.e);
      // Seed the beat grid with this section's pattern immediately so the widget
      // shows its shape on toggle, before the first audio tick lands.
      currentPattern = variatePattern(DRUM_PATTERNS[s.drums] || DRUM_PATTERNS.nebula, 0.25 + s.e);
      ui.setStep(-1, currentPattern);

      dj.tf = s.ft; dj.te = s.e;
      dj.am = pick(ARP_MODES); dj.as = 0;
      try {
        const [at, dc, su, rl] = s.adsr;
        audioRef.current.ld.set({ envelope: { attack: at, decay: dc, sustain: su, release: rl } });
        audioRef.current.rv.wet.rampTo(s.rv, 1);
        audioRef.current.dl.wet.rampTo(s.dw, 1);
      } catch {}

      if (scaleRef.current !== cachedScale) {
        cachedMatrix = buildMatrix(sn().notes);
        cachedScale = scaleRef.current;
      }
      const scNotes = sn().notes;
      switch (s.algo) {
        case "motif":    dj.phrase = [...dj.motif]; break;
        case "develop":  dj.phrase = devMotif(dj.motif, pick(["transpose", "invert", "ornament"]), scNotes.length); break;
        case "fragment": dj.phrase = devMotif(dj.motif, "fragment", scNotes.length); break;
        case "climax":   dj.phrase = [...devMotif(dj.motif, "ornament", scNotes.length), ...devMotif(dj.motif, "transpose", scNotes.length)]; break;
        default:         dj.phrase = [];
      }
      dj.pp = 0;

      // Occasional new chord progression on wraparound
      if (dj.si === 1 && Math.random() < 0.4) {
        const ps = PROGS[scaleRef.current] || PROGS.minor;
        prog = pick(ps); dj.ci = 0;
      }

      // Galaxy transition flash
      try { engineRef.current?.sectionTransition?.(s.col); } catch {}
    }
    applySection();

    const transport = Tone.getTransport();
    if (transport.state !== "started") {
      transport.bpm.value = 94;
    }
    ui.setBpm(transport.bpm.value);

    dj.iv = transport.scheduleRepeat((time) => {
      if (!audioRef.current || !dj.on) return;
      const s = sec();
      const scNotes = sn().notes;
      const chords = sn().chords;
      if (scaleRef.current !== cachedScale) { cachedMatrix = buildMatrix(scNotes); cachedScale = scaleRef.current; }
      const matrix = cachedMatrix;

      // Energy/filter smoothing
      dj.ce += (dj.te - dj.ce) * 0.06;
      dj.cf += (dj.tf - dj.cf) * 0.04;
      const E = dj.ce;
      if (s.sweep) dj.cf = lerp(s.ft * 0.3, s.ft, Math.min(dj.tis / (s.bars * 16), 1));

      const filterVal = Math.round(200 + dj.cf * 5800);
      if (Math.abs(filterVal - lastFilterVal) > 100) {
        lastFilterVal = filterVal;
        try { audioRef.current.fi.frequency.rampTo(filterVal, 0.3); } catch {}
      }

      // Step within bar (0..15), absolute step within section
      const step = dj.tis % 16;

      // Regenerate the bar's pattern at each downbeat — dynamic drift bar-to-bar
      if (step === 0) {
        currentPattern = variatePattern(
          DRUM_PATTERNS[s.drums] || DRUM_PATTERNS.nebula,
          0.25 + E,
        );
      }

      // ── DRUMS — routed through the unified triggerDrum on the drum-stars.
      //   Audio fires synchronously here at the precise transport `time`;
      //   triggerDrum defers visuals to the matching frame internally via Tone.Draw.
      //   We ALSO schedule a parallel Tone.Draw for the DJ conductor widget so that
      //   the beat grid row-flashes land on the exact same frame as the audio hit
      //   AND the drum-star pulse — this is what keeps the widget and stars in sync.
      const eng = engineRef.current;
      const kv = currentPattern.kick[step];
      if (kv > 0 && eng?.triggerDrum) eng.triggerDrum("kick", kv, true, time);
      const cv = currentPattern.clap[step];
      if (cv > 0 && eng?.triggerDrum) eng.triggerDrum("clap", cv, true, time);
      const hv = currentPattern.hat[step];
      if (hv > 0 && eng?.triggerDrum) eng.triggerDrum("hat", hv, true, time);
      const sv = currentPattern.snare[step];
      if (sv > 0 && eng?.triggerDrum) eng.triggerDrum("snare", sv, true, time);

      // ── UI step cursor + drum-hit dispatch (every 16n) ──
      const barPattern = currentPattern;
      Draw.schedule(() => {
        ui.setStep(step, barPattern);
        if (kv > 0) ui.onDrumHit("kick", kv);
        if (cv > 0) ui.onDrumHit("clap", cv);
        if (hv > 0) ui.onDrumHit("hat", hv);
        if (sv > 0) ui.onDrumHit("snare", sv);
      }, time);

      // ── UI beat & progress update (every quarter) ──
      if (step % 4 === 0) {
        const beat = (step / 4) | 0;
        Draw.schedule(() => ui.setBeat(beat), time);
      }
      if (step % 2 === 0) {
        const prog01 = dj.tis / (s.bars * 16);
        Draw.schedule(() => ui.setProgress(prog01), time);
      }
      if (step === 0) {
        const energy = E;
        Draw.schedule(() => ui.setEnergy(energy), time);
      }

      // ── Advance tick and handle section boundary ──
      dj.tis++; dj.tt++;
      if (dj.tis >= s.bars * 16) {
        advanceSection();
        applySection();
        return;
      }

      // ── Chord change every bar (16 steps) ──
      if (step === 0) {
        dj.ct = 0; dj.ci = (dj.ci + 1) % prog.length;
        dj.ac = chords[prog[dj.ci] % chords.length] || [];
        if (s.l.pd > 0) {
          try {
            audioRef.current.pd.releaseAll(time);
            const padFreqs = dj.ac.map((n: number) => m2f(48 + n));
            audioRef.current.pd.triggerAttack(padFreqs, time + 0.02, 0.08 + E * 0.12 * s.l.pd);
            audioRef.current.pf.frequency.rampTo(400 + E * 2500, 0.8);
          } catch {}
        }
      }

      // ── Bass — quarter-note root pulses ──
      if (s.l.bs > 0 && step % 4 === 0) {
        const bn = scNotes[prog[dj.ci] % scNotes.length];
        const bassMidi = 36 + bn;
        try {
          audioRef.current.bs.triggerAttackRelease(m2f(bassMidi), "4n", time + 0.01, Math.min(0.25 + E * 0.5, 0.8) * s.l.bs);
        } catch {}
        const bx = window.innerWidth * 0.5;
        const by = window.innerHeight * 0.85;
        pulseGlow("dj-bs", bassMidi, bx, by, 280);
        const eng = engineRef.current;
        if (eng) {
          Draw.schedule(() => {
            const [wx, wy, wz] = eng.s2w(bx, by);
            eng.addRipple(wx, wy, wz, noteColor(bassMidi));
            eng.emitParticles(wx, wy, wz, noteColor(bassMidi), Math.floor(3 + E * 5), E * 0.7);
          }, time);
        }
      }

      // ── Melody — on off-beats (3rd 16th of each beat) with rest probability ──
      if (s.l.ml > 0 && dj.phrase.length > 0 && (step % 4 === 2 || (E > 0.7 && step % 2 === 0))) {
        const restProb = E < 0.2 ? 0.55 : E < 0.5 ? 0.25 : 0.08;
        if (Math.random() > restProb) {
          let di: number;
          if (dj.pp < dj.phrase.length) { di = dj.phrase[dj.pp]; dj.pp++; }
          else { di = wPick(matrix[dj.deg]); dj.deg = di; }
          dj.oct = E > 0.75 ? 5 : 4;
          const midi = dj.oct * 12 + scNotes[di % scNotes.length];
          const vel = Math.min((0.1 + E * 0.55) * s.l.ml, 0.8);
          try { audioRef.current.ld.triggerAttackRelease(m2f(midi), "8n", time, vel); } catch {}
          const fx = ((midi - BASE_MIDI) / MIDI_RANGE) * window.innerWidth;
          const fy = (1 - E) * window.innerHeight;
          pulseGlow("dj-ml", midi, fx, fy, 220);
          const eng = engineRef.current;
          if (eng) {
            Draw.schedule(() => {
              const [wx, wy, wz] = eng.s2w(fx, fy);
              eng.addRipple(wx, wy, wz, noteColor(midi));
              eng.emitParticles(wx, wy, wz, noteColor(midi), Math.floor(5 + E * 12), E);
            }, time);
          }
        }
      }

      // ── Arp — only when active, every 3rd 16th ──
      if (s.l.ar > 0 && dj.ac.length > 0 && dj.tt % 3 === 0) {
        const an = getArpNote(dj.ac, dj.as, dj.am); dj.as++;
        const arpMidi = 60 + an;
        try { audioRef.current.ar.triggerAttackRelease(m2f(arpMidi), "16n", time + 0.02, Math.min((0.12 + E * 0.3) * s.l.ar, 0.7)); } catch {}
        const ax = ((arpMidi - BASE_MIDI) / MIDI_RANGE) * window.innerWidth;
        const ay = window.innerHeight * 0.3;
        pulseGlow("dj-ar", arpMidi, ax, ay, 160);
        const eng = engineRef.current;
        if (eng) {
          Draw.schedule(() => {
            const [wx, wy, wz] = eng.s2w(ax, ay);
            eng.emitParticles(wx, wy, wz, noteColor(arpMidi), Math.floor(2 + E * 5), E * 0.5);
          }, time);
        }
      }
    }, "16n");

    if (transport.state !== "started") transport.start();

    return () => {
      const t = Tone.getTransport();
      if (djState.current.iv != null) { t.clear(djState.current.iv); djState.current.iv = null; }
      DJ_VOICE_IDS.forEach(id => {
        const tm = pulseTimers[id];
        if (tm) { clearTimeout(tm); pulseTimers[id] = null; }
        touchesRef.current.delete(id);
      });
    };
  }, [autoPlay]);
}
