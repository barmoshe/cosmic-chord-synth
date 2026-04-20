import { useEffect, useState } from "react";
import type { AudioEngine } from "../shared/types";

export type WebMidiStatus = "unsupported" | "denied" | "idle" | "connected";

/* useWebMidi — subscribes the browser's Web MIDI API to the lead voice.
   CC 74 (Brightness) → filter cutoff sweep, CC 91 (Reverb Send) → reverb wet.
   Hot-swaps devices via the statechange event so connecting a controller
   mid-session works without a reload. */
export function useWebMidi(engineRef: React.MutableRefObject<AudioEngine | null>, enabled = true) {
  const [status, setStatus] = useState<WebMidiStatus>("idle");
  const [devices, setDevices] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const nav = navigator as Navigator & {
      requestMIDIAccess?: (options?: { sysex: boolean }) => Promise<any>;
    };
    if (typeof nav.requestMIDIAccess !== "function") {
      setStatus("unsupported");
      return;
    }

    let access: any = null;
    let unmounted = false;

    const handleMessage = (msg: MIDIMessageEvent) => {
      const eng = engineRef.current;
      if (!eng || !eng.isReady()) return;
      const data = msg.data;
      if (!data || data.length < 2) return;
      const cmd = data[0] & 0xf0;
      if (cmd === 0x90 && data[2] > 0) {
        eng.midiNoteOn(data[1], data[2] / 127);
      } else if (cmd === 0x80 || (cmd === 0x90 && data[2] === 0)) {
        eng.midiNoteOff(data[1]);
      } else if (cmd === 0xb0) {
        const cc = data[1];
        const val = data[2] / 127;
        if (cc === 74) eng.setFilterCutoff(400 + val * 5800, 0.05);
        else if (cc === 91) eng.setReverbWet(val, 0.2);
      }
    };

    const attachInputs = (inputs: Iterable<any>) => {
      const names: string[] = [];
      for (const input of inputs as any) {
        names.push(input.name || "MIDI Input");
        input.onmidimessage = handleMessage;
      }
      if (!unmounted) {
        setDevices(names);
        setStatus(names.length > 0 ? "connected" : "idle");
      }
    };

    nav.requestMIDIAccess({ sysex: false })
      .then((a: any) => {
        if (unmounted) return;
        access = a;
        attachInputs(a.inputs.values());
        a.onstatechange = () => attachInputs(a.inputs.values());
      })
      .catch(() => {
        if (!unmounted) setStatus("denied");
      });

    return () => {
      unmounted = true;
      if (access) {
        try {
          for (const input of access.inputs.values() as any) input.onmidimessage = null;
          access.onstatechange = null;
        } catch { /* noop */ }
      }
    };
  }, [engineRef, enabled]);

  return { status, devices };
}

// Minimal type shim — navigator.requestMIDIAccess types aren't in lib.dom by default.
interface MIDIMessageEvent {
  data?: Uint8Array;
}
