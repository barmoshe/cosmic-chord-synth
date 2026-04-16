import { useEffect } from "react";
import * as Tone from "tone";
import { Draw } from "tone";
import { SCALES, SCALE_ORDER, PROGS, DJ_SECTIONS, RHY, BASS_PAT, ARP_MODES, BASE_MIDI, MIDI_RANGE } from "./constants";
import { m2f, lerp, pick, genMotif, devMotif, buildMatrix, wPick, getArpNote, noteColor } from "./helpers";

export function useDjAutoPlay(
  autoPlay: boolean,
  audioRef: React.MutableRefObject<any>,
  engineRef: React.MutableRefObject<any>,
  scaleRef: React.MutableRefObject<string>,
  djState: React.MutableRefObject<any>,
  setDjSection: (s: string) => void,
) {
  useEffect(() => {
    const dj = djState.current;
    if (!autoPlay || !audioRef.current) {
      dj.on = false;
      if (dj.iv != null) { Tone.getTransport().clear(dj.iv); dj.iv = null; }
      try {
        audioRef.current?.ld?.releaseAll(); audioRef.current?.sb?.releaseAll();
        audioRef.current?.pd?.releaseAll(); audioRef.current?.bs?.releaseAll();
        audioRef.current?.ar?.releaseAll(); audioRef.current?.dn?.releaseAll();
      } catch {}
      setDjSection(""); return;
    }
    dj.on = true; dj.si = 0; dj.tis = 0; dj.tt = 0; dj.oct = 4; dj.deg = 0; dj.cf = 0.15; dj.ce = 0.1;
    const sn = () => SCALES[scaleRef.current];
    const sec = () => DJ_SECTIONS[dj.si % DJ_SECTIONS.length];
    let prog = (PROGS[scaleRef.current] || PROGS.minor)[0];
    dj.ci = 0; dj.motif = genMotif(sn().notes); dj.am = pick(ARP_MODES); dj.as = 0;

    // Cache matrix — only rebuild on scale/section change
    let cachedMatrix: Record<number, Record<number, number>> = buildMatrix(sn().notes);
    let cachedScale = scaleRef.current;
    let lastFilterVal = -1;

    function secRhy(s: any) { return s.d < 0.3 ? RHY.sparse : s.d < 0.5 ? RHY.quarter : s.d < 0.7 ? pick([RHY.syncopated, RHY.quarter]) : s.d < 0.85 ? RHY.driving : pick([RHY.dense, RHY.driving]); }
    function secBass(s: any) { return s.e < 0.4 ? BASS_PAT.whole : s.e < 0.7 ? BASS_PAT.octave : BASS_PAT.bounce; }
    let rhy = secRhy(sec()); dj.ri = 0; let bRhy = secBass(sec()); dj.bi = 0;

    function transition() {
      const s = sec();
      Draw.schedule(() => { setDjSection(s.name); }, Tone.now());
      rhy = secRhy(s); dj.ri = 0; bRhy = secBass(s); dj.bi = 0;
      dj.tf = s.ft; dj.te = s.e; dj.am = pick(ARP_MODES); dj.as = 0;
      try {
        const [at, dc, su, rl] = s.adsr;
        audioRef.current.ld.set({ envelope: { attack: at, decay: dc, sustain: su, release: rl } });
        audioRef.current.rv.wet.value = s.rv;
        audioRef.current.dl.wet.value = s.dw;
      } catch {}
      // Rebuild matrix only on scale change
      if (scaleRef.current !== cachedScale) {
        cachedMatrix = buildMatrix(sn().notes);
        cachedScale = scaleRef.current;
      }
      const sc2 = sn();
      switch (s.algo) {
        case "motif": dj.phrase = [...dj.motif]; break;
        case "sequence": dj.phrase = devMotif(dj.motif, "sequence", sc2.notes.length); break;
        case "develop": dj.phrase = devMotif(dj.motif, pick(["transpose", "invert", "ornament"]), sc2.notes.length); break;
        case "fragment": dj.phrase = devMotif(dj.motif, "fragment", sc2.notes.length); break;
        case "climax": dj.phrase = [...devMotif(dj.motif, "ornament", sc2.notes.length), ...devMotif(dj.motif, "transpose", sc2.notes.length)]; break;
        default: dj.phrase = [];
      }
      dj.pp = 0;
      if (dj.si % 3 === 0) { const ps = PROGS[scaleRef.current] || PROGS.minor; prog = pick(ps); dj.ci = 0; }
    }
    transition();

    const transport = Tone.getTransport();
    // Only set BPM if transport isn't already running (sequencer may have priority)
    if (transport.state !== "started") {
      transport.bpm.value = 94;
    }

    dj.iv = transport.scheduleRepeat((time) => {
      if (!audioRef.current || !dj.on) return;
      const s = sec(), sc2 = sn(), notes = sc2.notes, chords = sc2.chords;
      // Refresh matrix cache if scale changed
      if (scaleRef.current !== cachedScale) { cachedMatrix = buildMatrix(notes); cachedScale = scaleRef.current; }
      const matrix = cachedMatrix;

      dj.tt++; dj.tis++;
      dj.ce += (dj.te - dj.ce) * 0.06;
      dj.cf += (dj.tf - dj.cf) * 0.04;
      const E = dj.ce;
      if (s.sweep) { dj.cf = lerp(s.ft * 0.3, s.ft, Math.min(dj.tis / (s.bars * 4), 1)); }

      // Throttle filter rampTo — only when value changes significantly
      const newFilterVal = Math.round(200 + dj.cf * 5800);
      if (Math.abs(newFilterVal - lastFilterVal) > 100) {
        lastFilterVal = newFilterVal;
        try { audioRef.current.fi.frequency.rampTo(newFilterVal, 0.3); } catch {}
      }

      if (dj.tis >= s.bars * 4) { dj.tis = 0; dj.si++; transition(); return; }
      dj.ct++;
      if (dj.ct >= 4) {
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
        if (dj.tt % 8 === 0) {
          try {
            const rn = notes[prog[dj.ci] % notes.length];
            audioRef.current.dn.releaseAll(time + 0.1);
            audioRef.current.dn.triggerAttack([m2f(36 + rn), m2f(36 + rn + 7)], time + 0.15);
          } catch {}
        }
      }

      const rC = rhy[dj.ri % rhy.length]; dj.ri++; const durS = rC[0] * 0.14;

      // Melody — scheduled against precise audio clock time
      if (s.l.ml > 0 && dj.phrase.length > 0) {
        const restProb = E < 0.2 ? 0.5 : E < 0.4 ? 0.25 : 0.08;
        if (Math.random() > restProb) {
          let di: number;
          if (dj.pp < dj.phrase.length) { di = dj.phrase[dj.pp]; dj.pp++; }
          else { di = wPick(matrix[dj.deg]); dj.deg = di; }
          dj.oct = E > 0.6 ? 5 : 4;
          const midi = dj.oct * 12 + notes[di % notes.length];
          const vel = Math.min((0.1 + E * 0.6) * rC[1] * s.l.ml, 0.85);
          try {
            audioRef.current.ld.triggerAttackRelease(m2f(midi), durS * 0.8, time, vel);
          } catch {}
          if (engineRef.current) {
            Draw.schedule(() => {
              const fx = ((midi - BASE_MIDI) / MIDI_RANGE) * window.innerWidth;
              const fy = (1 - E) * window.innerHeight;
              const [wx, wy, wz] = engineRef.current.s2w(fx, fy);
              engineRef.current.addRipple(wx, wy, wz, noteColor(midi));
              engineRef.current.emitParticles(wx, wy, wz, noteColor(midi), Math.floor(6 + E * 16), E);
            }, time);
          }
        }
      }

      // Bass — scheduled against precise audio clock
      if (s.l.bs > 0) {
        const bC = bRhy[dj.bi % bRhy.length]; dj.bi++;
        if (bC[1] > 0) {
          const bn = notes[prog[dj.ci] % notes.length];
          const bassMidi = 36 + bn;
          try { audioRef.current.bs.triggerAttackRelease(m2f(bassMidi), bC[0] * 0.12, time + 0.01, Math.min((0.2 + E * 0.5) * bC[1] * s.l.bs, 0.8)); } catch {}
          if (engineRef.current) {
            Draw.schedule(() => {
              const bx = window.innerWidth * 0.5;
              const by = window.innerHeight * 0.85;
              const [wx, wy, wz] = engineRef.current.s2w(bx, by);
              engineRef.current.addRipple(wx, wy, wz, noteColor(bassMidi));
              engineRef.current.emitParticles(wx, wy, wz, noteColor(bassMidi), Math.floor(3 + E * 6), E * 0.7);
            }, time);
          }
        }
      }

      // Arp — every 3rd tick
      if (s.l.ar > 0 && dj.ac.length > 0 && dj.tt % 3 === 0) {
        const an = getArpNote(dj.ac, dj.as, dj.am); dj.as++;
        const arpMidi = 60 + an;
        try { audioRef.current.ar.triggerAttackRelease(m2f(arpMidi), 0.1, time + 0.02, Math.min((0.12 + E * 0.3) * s.l.ar, 0.7)); } catch {}
        if (engineRef.current) {
          Draw.schedule(() => {
            const ax = ((arpMidi - BASE_MIDI) / MIDI_RANGE) * window.innerWidth;
            const ay = window.innerHeight * 0.3;
            const [wx, wy, wz] = engineRef.current.s2w(ax, ay);
            engineRef.current.emitParticles(wx, wy, wz, noteColor(arpMidi), Math.floor(2 + E * 5), E * 0.5);
          }, time);
        }
      }

      // Counter melody
      if (s.l.ct > 0 && dj.tt % 8 === 5) {
        const cD = wPick(matrix[dj.deg]);
        const ctMidi = 60 + notes[cD % notes.length];
        try { audioRef.current.ld.triggerAttackRelease(m2f(ctMidi), 0.08, time + 0.03, Math.min((0.08 + E * 0.25) * s.l.ct, 0.6)); } catch {}
        if (engineRef.current) {
          Draw.schedule(() => {
            const cx = ((ctMidi - BASE_MIDI) / MIDI_RANGE) * window.innerWidth;
            const cy = window.innerHeight * 0.5;
            const [wx, wy, wz] = engineRef.current.s2w(cx, cy);
            engineRef.current.addRipple(wx, wy, wz, noteColor(ctMidi));
            engineRef.current.emitParticles(wx, wy, wz, noteColor(ctMidi), Math.floor(3 + E * 6), E * 0.6);
          }, time);
        }
      }

      if (s.riser && dj.tt % 3 === 0) { dj.rf = lerp(200, 2000, dj.tis / (s.bars * 4)); try { audioRef.current.af.frequency.rampTo(dj.rf, 0.3); } catch {} }
    }, "16n");

    if (transport.state !== "started") transport.start();

    return () => {
      const t = Tone.getTransport();
      if (djState.current.iv != null) { t.clear(djState.current.iv); djState.current.iv = null; }
    };
  }, [autoPlay]);
}
