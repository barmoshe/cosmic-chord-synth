import { useEffect, useState } from "react";
import LoadingScreen from "./components/LoadingScreen";
import Landing from "./components/Landing";
import DebugTelemetryHUD from "./cockpit/DebugTelemetryHUD";
import Throttle from "./cockpit/Throttle";
import Yoke, { type YokeAxes } from "./cockpit/Yoke";
import { useBootSequence } from "./hooks/useBootSequence";
import { useFlightLoop } from "./hooks/useFlightLoop";
import { SYNTHSIM_PALETTE } from "./styles";

type Phase = "booting" | "preflight" | "flying";

const FADE_DELAY_MS = 350;

const SynthSimApp = () => {
  const { progress, ready } = useBootSequence();
  const [phase, setPhase] = useState<Phase>("booting");
  const [loaderGone, setLoaderGone] = useState(false);

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

  const handleYoke = (axes: YokeAxes) => {
    flight.controlsRef.current.aileron = axes.x;
    flight.controlsRef.current.elevator = -axes.y;
  };

  const handleThrottle = (t: number) => {
    flight.controlsRef.current.throttle = t;
  };

  return (
    <div
      className="relative min-h-[100dvh] w-full overflow-hidden"
      style={{ background: SYNTHSIM_PALETTE.bg }}
    >
      {phase !== "flying" && (
        <Landing visible={ready} onPreflight={() => setPhase("flying")} />
      )}

      {flying && (
        <>
          <DebugTelemetryHUD telemetryRef={flight.telemetryRef} />
          <div
            className="fixed left-0 bottom-0"
            style={{
              paddingLeft: "max(1rem, env(safe-area-inset-left))",
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            }}
          >
            <Yoke onChange={handleYoke} size={170} />
          </div>
          <div
            className="fixed right-0 bottom-0"
            style={{
              paddingRight: "max(1rem, env(safe-area-inset-right))",
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            }}
          >
            <Throttle onChange={handleThrottle} height={210} width={52} />
          </div>
        </>
      )}

      {!loaderGone && <LoadingScreen progress={progress} fadingOut={ready} />}
    </div>
  );
};

export default SynthSimApp;
