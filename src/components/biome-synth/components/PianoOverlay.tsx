import { useEffect, useRef, useState } from "react";
import type { AudioEngine } from "../shared/types";
import { NOTE_NAMES } from "../shared/constants";

/* Computer-keyboard → piano map starting at C4.
   Two rows: AS...K = naturals, W,E,T,Y,U,O,P = sharps. */
const KEY_MAP: Record<string, number> = {
  a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71,
  k: 72, o: 73, l: 74, p: 75, ";": 76,
};

interface PianoOverlayProps {
  open: boolean;
  onClose: () => void;
  audioEngine: React.MutableRefObject<AudioEngine | null>;
}

/* PianoOverlay — slide-up panel showing the computer keyboard → MIDI mapping.
   Highlights pressed keys live and triggers noteOn/Off on the audio engine.
   Toggle with `Z`. */
export default function PianoOverlay({ open, onClose, audioEngine }: PianoOverlayProps) {
  const [pressed, setPressed] = useState<Set<number>>(new Set());
  const pressedRef = useRef(pressed);
  pressedRef.current = pressed;

  useEffect(() => {
    if (!open) {
      const eng = audioEngine.current;
      pressedRef.current.forEach((m) => eng?.midiNoteOff(m));
      setPressed(new Set());
      return;
    }
    const handleDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const midi = KEY_MAP[e.key.toLowerCase()];
      if (midi === undefined) return;
      e.preventDefault();
      const eng = audioEngine.current;
      if (!eng || !eng.isReady()) return;
      eng.midiNoteOn(midi, 0.7);
      setPressed((prev) => {
        const next = new Set(prev);
        next.add(midi);
        return next;
      });
    };
    const handleUp = (e: KeyboardEvent) => {
      const midi = KEY_MAP[e.key.toLowerCase()];
      if (midi === undefined) return;
      const eng = audioEngine.current;
      eng?.midiNoteOff(midi);
      setPressed((prev) => {
        const next = new Set(prev);
        next.delete(midi);
        return next;
      });
    };
    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    };
  }, [open, audioEngine]);

  if (!open) return null;

  const keys = Object.entries(KEY_MAP)
    .map(([k, midi]) => ({ key: k, midi, isSharp: [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12) }))
    .sort((a, b) => a.midi - b.midi);

  return (
    <div className="biome-piano" role="dialog" aria-label="Keyboard piano">
      <button
        type="button"
        className="biome-piano-close"
        onClick={onClose}
        aria-label="Close piano"
      >
        ×
      </button>
      <div className="biome-piano-title">PRESS Z TO TOGGLE · A–; + W,E,T,Y,U,O,P</div>
      <div className="biome-piano-keys">
        {keys.map(({ key, midi, isSharp }) => {
          const active = pressed.has(midi);
          return (
            <div
              key={key}
              className={`biome-piano-key${isSharp ? " is-sharp" : ""}${active ? " is-active" : ""}`}
              aria-label={`${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`}
            >
              <span className="biome-piano-key-char">{key.toUpperCase()}</span>
              <span className="biome-piano-key-note">
                {NOTE_NAMES[((midi % 12) + 12) % 12]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
