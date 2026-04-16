import { useEffect } from "react";
import * as Tone from "tone";
import { Draw } from "tone";
import { SCALES, PROGS, DJ_SECTIONS, DRUM_PATTERNS, ARP_MODES, BASE_MIDI, MIDI_RANGE, NOTE_NAMES } from "./constants";
import { m2f, lerp, pick, genMotif, devMotif, buildMatrix, wPick, getArpNote, noteColor } from "./helpers";

export interface DjUi {
  setPhase: (p: string) => void;
  setNextPhase: (p: string) => void;
  setProgress: (v: number) => void;    // 0..1 within section
  setBeat: (b: number) => void;        // 0..3 quarter-note within bar
  bumpKick: (v: number) => void;       // 0..1 velocity for meter
  bumpClap: (v: number) => void;
  bumpHat: (v: number) => void;
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
      Draw.schedule(() => {
        ui.setPhase(s.name);
        ui.setNextPhase(next.name);
        ui.setProgress(0);
      }, Tone.now());

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
      const pattern = DRUM_PATTERNS[s.drums] || DRUM_PATTERNS.drift;

      // ── DRUMS (the spine) ──
      const kv = pattern.kick[step];
      if (kv > 0) {
        try { audioRef.current.kick?.triggerAttackRelease("C1", "8n", time, kv); } catch {}
        const eng = engineRef.current;
        Draw.schedule(() => {
          if (eng?.kickPulse) eng.kickPulse(kv);
          ui.bumpKick(kv);
        }, time);
      }
      const cv = pattern.clap[step];
      if (cv > 0) {
        try { audioRef.current.clap?.triggerAttackRelease("16n", time, cv); } catch {}
        const eng = engineRef.current;
        Draw.schedule(() => {
          if (eng?.shockwave) eng.shockwave([0.51, 0.55, 0.97], 1.4);   // periwinkle shock
          if (eng?.flash) eng.flash(0.18 * cv);
          if (eng?.emitParticles) {
            const n = Math.floor(6 + cv * 8);
            for (let i = 0; i < n; i++) {
              const a = (i / n) * Math.PI * 2;
              eng.emitParticles(Math.cos(a) * 80, (Math.random() - 0.5) * 30, Math.sin(a) * 80, [0.65, 0.55, 0.98], 1, 0.5 + cv * 0.5);
            }
          }
          ui.bumpClap(cv);
        }, time);
      }
      const hv = pattern.hat[step];
      if (hv > 0) {
        try { audioRef.current.hihat?.triggerAttackRelease("32n", time, hv * 0.6); } catch {}
        const eng = engineRef.current;
        Draw.schedule(() => {
          if (eng?.sparkleCloud) eng.sparkleCloud([0.13, 0.83, 0.93], Math.max(2, Math.floor(hv * 3)));  // cyan Aurora
          ui.bumpHat(hv);
        }, time);
      }
      const sv = pattern.snare[step];
      if (sv > 0) {
        try { audioRef.current.snare?.triggerAttackRelease("16n", time, sv); } catch {}
        const eng = engineRef.current;
        Draw.schedule(() => {
          if (eng?.flash) eng.flash(0.22 * sv);
          if (eng?.addRipple) eng.addRipple(30, 0, -30, [0.88, 0.94, 1]);   // cool white
        }, time);
      }

      // ── UI beat & progress update (every quarter) ──
      if (step % 4 === 0) {
        const beat = (step / 4) | 0;
        Draw.schedule(() => ui.setBeat(beat), time);
      }
      if (step % 2 === 0) {
        const prog01 = dj.tis / (s.bars * 16);
        Draw.schedule(() => ui.setProgress(prog01), time);
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
