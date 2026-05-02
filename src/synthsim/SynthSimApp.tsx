import { useCallback, useEffect, useMemo, useState } from "react";
import LoadingScreen from "./components/LoadingScreen";
import Landing from "./components/Landing";
import Cockpit from "./cockpit/Cockpit";
import DebugTelemetryHUD from "./cockpit/DebugTelemetryHUD";
import { useBootSequence } from "./hooks/useBootSequence";
import { useFlightLoop } from "./hooks/useFlightLoop";
import { usePhase } from "./hooks/usePhase";
import { useSoundEngine } from "./hooks/useSoundEngine";
import { useTelemetrySound } from "./hooks/useTelemetrySound";
import { DEFAULT_PROFILE } from "./sound/profiles";
import { SYNTHSIM_PALETTE } from "./styles";

type Phase = "booting" | "preflight" | "flying";

const FADE_DELAY_MS = 350;

const SynthSimApp = () => {
  const { progress, ready } = useBootSequence();
  const [phase, setPhase] = useState<Phase>("booting");
  const [loaderGone, setLoaderGone] = useState(false);
  const [starting, setStarting] = useState(false);

  const devMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("dev") === "1";
  }, []);

  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => {
      setLoaderGone(true);
      setPhase((p) => (p === "booting" ? "preflight" : p));
    }, FADE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [ready]);

  const flying = phase === "flying";
  const flight = useFlightLoop(flying);
  const { engine: sound } = useSoundEngine();
  const flightPhase = usePhase(flight, flying);
  useTelemetrySound(flight, sound, flying, DEFAULT_PROFILE, flightPhase.patch);

  useEffect(() => {
    if (!flying) return;
    if (!sound.isReady()) return;
    sound.setDrumPattern(flightPhase.pattern);
  }, [flightPhase.pattern, flying, sound]);

  const handlePreflight = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    try {
      await sound.start();
    } finally {
      setStarting(false);
      setPhase("flying");
    }
  }, [sound, starting]);

  return (
    <div
      className="relative min-h-[100dvh] w-full overflow-hidden"
      style={{ background: SYNTHSIM_PALETTE.bg }}
    >
      {phase !== "flying" && (
        <Landing
          visible={ready}
          starting={starting}
          onPreflight={handlePreflight}
        />
      )}

      {flying && <Cockpit flight={flight} phase={flightPhase.phase} />}
      {flying && devMode && <DebugTelemetryHUD telemetryRef={flight.telemetryRef} />}

      {!loaderGone && <LoadingScreen progress={progress} fadingOut={ready} />}
    </div>
  );
};

export default SynthSimApp;
