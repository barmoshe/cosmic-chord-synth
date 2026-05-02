import { useEffect, useState } from "react";
import LoadingScreen from "./components/LoadingScreen";
import Landing from "./components/Landing";
import { useBootSequence } from "./hooks/useBootSequence";
import { SYNTHSIM_PALETTE } from "./styles";

const FADE_DELAY_MS = 350;

const SynthSimApp = () => {
  const { progress, ready } = useBootSequence();
  const [loaderGone, setLoaderGone] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => setLoaderGone(true), FADE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [ready]);

  return (
    <div
      className="relative min-h-[100dvh] w-full overflow-hidden"
      style={{ background: SYNTHSIM_PALETTE.bg }}
    >
      <Landing visible={ready} />
      {!loaderGone && <LoadingScreen progress={progress} fadingOut={ready} />}
    </div>
  );
};

export default SynthSimApp;
