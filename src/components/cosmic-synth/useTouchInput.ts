import { useEffect } from "react";
import * as Tone from "tone";
import { SCALES, BASE_MIDI, MIDI_RANGE, NOTE_NAMES, isMobile } from "./constants";
import { m2f, quantize, noteColor, haptic } from "./helpers";
import type { AudioEngine } from "./types";

export function useTouchInput(
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>,
  audioEngine: React.MutableRefObject<AudioEngine | null>,
  engineRef: React.MutableRefObject<any>,
  touchesRef: React.MutableRefObject<Map<any, any>>,
  scaleRef: React.MutableRefObject<string>,
  phase: string,
  resetUIHide: () => void,
  sceneKey?: string,
) {
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || phase !== "play") return;

    let lastNoteChangeTime = 0;
    const MIN_NOTE_CHANGE_INTERVAL = 0.06;

    const pendingMoves = new Map<any, { x: number; y: number }>();
    let rafHandle: number | null = null;

    let cleanupTimer: ReturnType<typeof setTimeout> | null = null;
    function scheduleVoiceCleanup() {
      if (cleanupTimer) clearTimeout(cleanupTimer);
      cleanupTimer = setTimeout(() => {
        if (touchesRef.current.size === 0) {
          audioEngine.current?.releaseAllLead(Tone.now());
        }
      }, 120);
    }

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
      if (!audioEngine.current?.isReady()) return;
      if (cleanupTimer) { clearTimeout(cleanupTimer); cleanupTimer = null; }
      resetUIHide();
      const sn = SCALES[scaleRef.current].notes;
      const midi = quantize(Math.round(BASE_MIDI + (x / window.innerWidth) * MIDI_RANGE), sn);
      const brightness = 1 - y / window.innerHeight;
      const vel = 0.25 + brightness * 0.45;
      audioEngine.current.noteOn(midi, vel, x, y);
      haptic(12);
      const col = noteColor(midi);
      if (engineRef.current) {
        const [wx, wy, wz] = engineRef.current.s2w(x, y);
        engineRef.current.addRipple(wx, wy, wz, col);
        engineRef.current.emitParticles(wx, wy, wz, col, isMobile ? 15 : 30, vel);
      }
      touchesRef.current.set(id, { midi, freq: m2f(midi), subFreq: m2f(midi - 12), x, y, note: NOTE_NAMES[midi % 12] });
    }

    function processMove(id: any, x: number, y: number) {
      if (!audioEngine.current?.isReady() || !touchesRef.current.has(id)) return;
      const prev = touchesRef.current.get(id);
      const sn = SCALES[scaleRef.current].notes;
      const midi = quantize(Math.round(BASE_MIDI + (x / window.innerWidth) * MIDI_RANGE), sn);
      if (midi !== prev.midi) {
        const now = Tone.now();
        if (now - lastNoteChangeTime < MIN_NOTE_CHANGE_INTERVAL) return;
        lastNoteChangeTime = now;
        const brightness = 1 - y / window.innerHeight;
        audioEngine.current.noteOff(prev.midi);
        audioEngine.current.noteOn(midi, 0.2 + brightness * 0.35, x, y);
        haptic(6);
        prev.midi = midi;
        prev.freq = m2f(midi);
        prev.subFreq = m2f(midi - 12);
        prev.note = NOTE_NAMES[midi % 12];
      }
      const newCut = 300 + (1 - y / window.innerHeight) * 5500;
      audioEngine.current.setFilterCutoff(newCut, 0.08);
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
      if (info) audioEngine.current?.noteOff(info.midi);
      touchesRef.current.delete(id);
      if (touchesRef.current.size === 0) scheduleVoiceCleanup();
    }

    const drumTapIds = new Set<any>();
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
  }, [phase, resetUIHide, audioEngine, engineRef, touchesRef, scaleRef, canvasRef, sceneKey]);
}
