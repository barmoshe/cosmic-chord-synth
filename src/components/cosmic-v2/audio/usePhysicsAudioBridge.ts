import { useEffect, useRef } from "react";
import * as Tone from "tone";
import type { AudioEngine } from "@/components/cosmic-synth/types";
import { SCALES, BASE_MIDI } from "@/components/cosmic-synth/constants";
import { quantize } from "@/components/cosmic-synth/helpers";
import type { PhysicsEvent } from "../physics/types";

interface BridgeOpts {
  engineRef: React.MutableRefObject<AudioEngine | null>;
  scaleIdRef: React.MutableRefObject<string>;
  drainEvents: () => PhysicsEvent[];
  onNote?: (ev: PhysicsEvent, midi: number) => void;
}

/**
 * Drains physics events each frame and converts them to musical events through
 * the v1 AudioEngine facade. Everything is scale-quantized. Rate limits are
 * enforced upstream inside the physics engine itself.
 */
export function usePhysicsAudioBridge(opts: BridgeOpts) {
  const { engineRef, scaleIdRef, drainEvents, onNote } = opts;
  const rafRef = useRef<number | null>(null);
  const tickerRef = useRef(0);

  useEffect(() => {
    function tick() {
      const engine = engineRef.current;
      if (!engine || !engine.isReady()) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const scale = SCALES[scaleIdRef.current] ?? SCALES.pentatonic;
      const notes = scale.notes;
      const events = drainEvents();
      const now = Tone.now();

      for (const ev of events) {
        const b = ev.body;
        const scaleNote = notes[((b.scaleDegree % notes.length) + notes.length) % notes.length];
        const midi = quantize(BASE_MIDI + b.octave * 12 + scaleNote - 48, notes);

        switch (ev.kind) {
          case "orbitCross": {
            const speed = ev.speed ?? 1;
            const vel = Math.min(0.9, 0.25 + speed * 0.004);
            if (b.timbre === "pad") {
              const rootIdx = (b.scaleDegree) % notes.length;
              const chord = [
                notes[rootIdx],
                notes[(rootIdx + 2) % notes.length],
                notes[(rootIdx + 4) % notes.length],
              ].map((n, i) => BASE_MIDI + b.octave * 12 + n - 48 + (i === 0 ? 0 : 0));
              engine.triggerPadChord(chord, now, vel * 0.6, "2n");
            } else if (b.timbre === "bass") {
              engine.triggerBass(midi - 12, now, vel * 0.8, "4n");
            } else if (b.timbre === "lead") {
              engine.triggerLead(midi, now, vel, "8n");
            } else if (b.timbre === "arp") {
              engine.triggerArp(midi, now, vel * 0.7, "16n");
            }
            onNote?.(ev, midi);
            break;
          }
          case "proximity": {
            engine.triggerPadChord([midi, midi + 7], now, 0.25, "2n");
            const curWet = 0.3;
            engine.setReverbWet(Math.min(0.55, curWet + 0.05), 0.4);
            setTimeout(() => engine.setReverbWet(curWet, 1.2), 300);
            onNote?.(ev, midi);
            break;
          }
          case "collision": {
            const rv = ev.speed ?? 0;
            const drum = rv > 120 ? "snare" : rv > 60 ? "clap" : rv > 20 ? "hat" : "kick";
            engine.triggerDrum(drum, Math.min(0.9, 0.3 + rv * 0.004));
            // Also emit a high accent from the spark
            if (b.kind === "spark") {
              engine.triggerArp(midi + 12, now, 0.5, "32n");
            }
            onNote?.(ev, midi);
            break;
          }
          case "perihelion": {
            engine.triggerArp(midi + 12, now, 0.45, "8n");
            onNote?.(ev, midi);
            break;
          }
          case "fieldEnter": {
            engine.setPadFilter(600, 1.5);
            engine.setDelayWet(0.25, 1.2);
            break;
          }
          case "fieldExit": {
            engine.setPadFilter(1200, 1.5);
            engine.setDelayWet(0.14, 1.2);
            break;
          }
        }
      }

      tickerRef.current++;
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [engineRef, scaleIdRef, drainEvents, onNote]);
}
