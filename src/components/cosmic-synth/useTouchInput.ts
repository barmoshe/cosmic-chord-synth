import { useEffect } from "react";
import * as Tone from "tone";
import { SCALES, BASE_MIDI, MIDI_RANGE, NOTE_NAMES, isMobile } from "./constants";
import { m2f, quantize, noteColor, haptic } from "./helpers";

export function useTouchInput(
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>,
  audioRef: React.MutableRefObject<any>,
  engineRef: React.MutableRefObject<any>,
  touchesRef: React.MutableRefObject<Map<any, any>>,
  scaleRef: React.MutableRefObject<string>,
  phase: string,
  resetUIHide: () => void,
) {
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || phase !== "play") return;

    // Throttle filter rampTo — only when value changes significantly
    let lastFilterFreq = 0;

    // Coalesce touchmove events to one processed move per finger per animation frame
    const pendingMoves = new Map<any, { x: number; y: number }>();
    let rafHandle: number | null = null;

    // Safety cleanup: release all voices when no touches are active
    let cleanupTimer: ReturnType<typeof setTimeout> | null = null;
    function scheduleVoiceCleanup() {
      if (cleanupTimer) clearTimeout(cleanupTimer);
      cleanupTimer = setTimeout(() => {
        if (touchesRef.current.size === 0 && audioRef.current) {
          try {
            audioRef.current.ld.releaseAll(Tone.now());
            audioRef.current.sb.releaseAll(Tone.now());
          } catch {}
        }
      }, 120);
    }

    // Returns true if the tap/click hit a drum-star (and triggered its drum). Caller skips noteOn.
    function tryDrumTap(x: number, y: number): boolean {
      const eng = engineRef.current;
      if (!eng?.pickDrumStar || !eng?.triggerDrum) return false;
      const name = eng.pickDrumStar(x, y);
      if (!name) return false;
      eng.triggerDrum(name, 0.9, false);
      resetUIHide();
      return true;
    }

    function noteOn(id: any, x: number, y: number) {
      if (!audioRef.current) return;
      if (cleanupTimer) { clearTimeout(cleanupTimer); cleanupTimer = null; }
      resetUIHide();
      const sn = SCALES[scaleRef.current].notes;
      const midi = quantize(Math.round(BASE_MIDI + (x / window.innerWidth) * MIDI_RANGE), sn);
      const freq = m2f(midi);
      const brightness = 1 - y / window.innerHeight;
      const vel = 0.25 + brightness * 0.45;
      const cut = 300 + brightness * 5500;
      const now = Tone.now();
      try {
        audioRef.current.ld.triggerAttack(freq, now, vel);
        audioRef.current.sb.triggerAttack(m2f(midi - 12), now, vel * 0.5);
        audioRef.current.fi.frequency.rampTo(cut, 0.08);
        audioRef.current.pd.volume.rampTo(-28, 0.05);
        audioRef.current.pd.volume.rampTo(-20, 0.4, now + 0.1);
      } catch {}
      haptic(12);
      const col = noteColor(midi);
      if (engineRef.current) {
        const [wx, wy, wz] = engineRef.current.s2w(x, y);
        engineRef.current.addRipple(wx, wy, wz, col);
        engineRef.current.emitParticles(wx, wy, wz, col, isMobile ? 15 : 30, vel);
      }
      touchesRef.current.set(id, { midi, freq, subFreq: m2f(midi - 12), x, y, note: NOTE_NAMES[midi % 12] });
    }

    function processMove(id: any, x: number, y: number) {
      if (!audioRef.current || !touchesRef.current.has(id)) return;
      const prev = touchesRef.current.get(id);
      const sn = SCALES[scaleRef.current].notes;
      const midi = quantize(Math.round(BASE_MIDI + (x / window.innerWidth) * MIDI_RANGE), sn);
      const freq = m2f(midi);
      if (midi !== prev.midi) {
        const now = Tone.now();
        const brightness = 1 - y / window.innerHeight;
        const subFreq = m2f(midi - 12);
        try {
          // Release old note and attack new one with enough offset for voice recycling
          audioRef.current.ld.triggerRelease(prev.freq, now);
          audioRef.current.sb.triggerRelease(prev.subFreq, now);
          audioRef.current.ld.triggerAttack(freq, now + 0.02, 0.2 + brightness * 0.35);
          audioRef.current.sb.triggerAttack(subFreq, now + 0.02, 0.18);
        } catch {}
        haptic(6);
        prev.midi = midi; prev.freq = freq; prev.subFreq = subFreq; prev.note = NOTE_NAMES[midi % 12];
      }
      const newCut = 300 + (1 - y / window.innerHeight) * 5500;
      if (Math.abs(newCut - lastFilterFreq) > 150) {
        lastFilterFreq = newCut;
        try { audioRef.current.fi.frequency.rampTo(newCut, 0.08); } catch {}
      }
      prev.x = x; prev.y = y;
    }

    function flushMoves() {
      rafHandle = null;
      for (const [id, p] of pendingMoves) processMove(id, p.x, p.y);
      pendingMoves.clear();
    }

    function noteMove(id: any, x: number, y: number) {
      pendingMoves.set(id, { x, y });
      if (rafHandle === null) rafHandle = requestAnimationFrame(flushMoves);
    }

    function noteOff(id: any) {
      const info = touchesRef.current.get(id);
      if (info && audioRef.current) {
        try {
          audioRef.current.ld.triggerRelease(info.freq, Tone.now());
          audioRef.current.sb.triggerRelease(info.subFreq, Tone.now());
        } catch {}
      }
      touchesRef.current.delete(id);
      // When all touches are gone, schedule a safety releaseAll to free any stuck voices
      if (touchesRef.current.size === 0) {
        scheduleVoiceCleanup();
      }
    }

    const drumTapIds = new Set<any>();    // touches that hit a drum star — never create a note
    const onTS = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        if (tryDrumTap(t.clientX, t.clientY)) { drumTapIds.add(t.identifier); continue; }
        noteOn(t.identifier, t.clientX, t.clientY);
      }
    };
    const onTM = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        if (drumTapIds.has(t.identifier)) continue;
        noteMove(t.identifier, t.clientX, t.clientY);
      }
    };
    const onTE = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (drumTapIds.delete(t.identifier)) continue;
        noteOff(t.identifier);
      }
    };
    const onMD = (e: MouseEvent) => {
      if (tryDrumTap(e.clientX, e.clientY)) { drumTapIds.add("m"); return; }
      noteOn("m", e.clientX, e.clientY);
    };
    const onMM = (e: MouseEvent) => {
      if (drumTapIds.has("m")) return;
      if (touchesRef.current.has("m")) noteMove("m", e.clientX, e.clientY);
    };
    const onMU = () => {
      if (drumTapIds.delete("m")) return;
      noteOff("m");
    };

    cv.addEventListener("touchstart", onTS, { passive: false });
    cv.addEventListener("touchmove", onTM, { passive: false });
    cv.addEventListener("touchend", onTE); cv.addEventListener("touchcancel", onTE);
    cv.addEventListener("mousedown", onMD); cv.addEventListener("mousemove", onMM);
    cv.addEventListener("mouseup", onMU); cv.addEventListener("mouseleave", onMU);

    return () => {
      if (cleanupTimer) clearTimeout(cleanupTimer);
      if (rafHandle !== null) cancelAnimationFrame(rafHandle);
      pendingMoves.clear();
      cv.removeEventListener("touchstart", onTS); cv.removeEventListener("touchmove", onTM);
      cv.removeEventListener("touchend", onTE); cv.removeEventListener("touchcancel", onTE);
      cv.removeEventListener("mousedown", onMD); cv.removeEventListener("mousemove", onMM);
      cv.removeEventListener("mouseup", onMU); cv.removeEventListener("mouseleave", onMU);
    };
  }, [phase, resetUIHide]);
}
