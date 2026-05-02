import { createContext, useContext, useEffect, useState } from "react";
import type { FlightLoopHandle } from "../hooks/useFlightLoop";
import type { Telemetry } from "../engine/types";

const TelemetryCtx = createContext<Telemetry | null>(null);

interface TelemetryProviderProps {
  flight: FlightLoopHandle;
  intervalMs?: number;
  children: React.ReactNode;
}

export const TelemetryProvider = ({
  flight,
  intervalMs = 100,
  children,
}: TelemetryProviderProps) => {
  const [t, setT] = useState<Telemetry>(flight.telemetryRef.current);

  useEffect(() => {
    const id = window.setInterval(() => {
      setT({ ...flight.telemetryRef.current });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [flight, intervalMs]);

  return <TelemetryCtx.Provider value={t}>{children}</TelemetryCtx.Provider>;
};

export const useTelemetry = (): Telemetry => {
  const t = useContext(TelemetryCtx);
  if (!t) {
    throw new Error("useTelemetry must be used inside <TelemetryProvider>");
  }
  return t;
};
