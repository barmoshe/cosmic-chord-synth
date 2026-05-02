import type { FlightLoopHandle } from "../hooks/useFlightLoop";
import Hud from "../hud/Hud";
import StallBanner from "../hud/StallBanner";
import { TelemetryProvider } from "./TelemetryContext";
import Throttle from "./Throttle";
import WorldBackground from "./WorldBackground";
import Yoke, { type YokeAxes } from "./Yoke";
import AttitudeIndicator from "./instruments/AttitudeIndicator";
import Airspeed from "./instruments/Airspeed";
import Altimeter from "./instruments/Altimeter";
import Heading from "./instruments/Heading";
import Variometer from "./instruments/Variometer";

interface CockpitProps {
  flight: FlightLoopHandle;
  phase?: string;
}

const Cockpit = ({ flight, phase }: CockpitProps) => {
  const handleYoke = (axes: YokeAxes) => {
    flight.controlsRef.current.aileron = axes.x;
    flight.controlsRef.current.elevator = -axes.y;
  };
  const handleThrottle = (t: number) => {
    flight.controlsRef.current.throttle = t;
  };

  return (
    <TelemetryProvider flight={flight}>
      <WorldBackground />

      <div className="fixed inset-0 flex flex-col pointer-events-none">
        <div className="pointer-events-auto">
          <Hud phase={phase} />
        </div>

        <div className="relative flex-1 flex flex-col items-center pt-2 px-2 gap-2 min-h-0">
          <div className="relative w-[min(46vw,260px)] aspect-square">
            <AttitudeIndicator />
            <StallBanner />
          </div>

          <div className="grid grid-cols-4 gap-1 w-full max-w-[420px]">
            <div className="aspect-square">
              <Airspeed />
            </div>
            <div className="aspect-square">
              <Altimeter />
            </div>
            <div className="aspect-square">
              <Heading />
            </div>
            <div className="aspect-square">
              <Variometer />
            </div>
          </div>

          <div className="flex-1" />
        </div>

        <div
          className="absolute left-0 bottom-0 pointer-events-auto"
          style={{
            paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <Yoke onChange={handleYoke} size={170} />
        </div>

        <div
          className="absolute right-0 bottom-0 pointer-events-auto"
          style={{
            paddingRight: "max(0.75rem, env(safe-area-inset-right))",
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <Throttle onChange={handleThrottle} height={210} width={56} />
        </div>
      </div>
    </TelemetryProvider>
  );
};

export default Cockpit;
