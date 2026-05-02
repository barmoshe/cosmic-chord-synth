import { useEffect, useMemo, useState } from "react";
import LoadingScreen from "./components/LoadingScreen";
import Landing from "./components/Landing";
import Cockpit from "./cockpit/Cockpit";
import DebugTelemetryHUD from "./cockpit/DebugTelemetryHUD";
import { useBootSequence } from "./hooks/useBootSequence";
import { useFlightLoop } from "./hooks/useFlightLoop";
import { SYNTHSIM_PALETTE } from "./styles";

type Phase = "booting" | "preflight" | "flying";

const FADE_DELAY_MS = 350;

const SynthSimApp = () => {
  const { progress, ready } = useBootSequence();
  const [phase, setPhase] = useState<Phase>("booting");
  const [loaderGone, setLoaderGone] = useState(false);

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

  return (
    <div
      className="relative min-h-[100dvh] w-full overflow-hidden"
      style={{ background: SYNTHSIM_PALETTE.bg }}
    >
      {phase !== "flying" && (
        <Landing visible={ready} onPreflight={() => setPhase("flying")} />
      )}

      {flying && <Cockpit flight={flight} phase="FLYING" />}
      {flying && devMode && <DebugTelemetryHUD telemetryRef={flight.telemetryRef} />}

      {!loaderGone && <LoadingScreen progress={progress} fadingOut={ready} />}
    </div>
  );
};

export default SynthSimApp;
