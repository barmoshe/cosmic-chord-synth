import { useCallback, useEffect, useRef } from "react";
import { makeControls } from "../engine/controls";
import { FIXED_DT, makeFlightState, step } from "../engine/integrate";
import { stateToTelemetry } from "../engine/telemetry";
import type { ControlInputs, FlightState, Telemetry } from "../engine/types";

const MAX_ACCUMULATED = 0.25;

type Subscriber = (t: Telemetry) => void;

export interface FlightLoopHandle {
  stateRef: React.MutableRefObject<FlightState>;
  controlsRef: React.MutableRefObject<ControlInputs>;
  telemetryRef: React.MutableRefObject<Telemetry>;
  subscribe: (fn: Subscriber) => () => void;
}

export function useFlightLoop(running: boolean): FlightLoopHandle {
  const stateRef = useRef<FlightState>(makeFlightState());
  const controlsRef = useRef<ControlInputs>(makeControls());
  const telemetryRef = useRef<Telemetry>(
    stateToTelemetry(stateRef.current, controlsRef.current),
  );
  const subscribersRef = useRef<Set<Subscriber>>(new Set());

  const subscribe = useCallback<FlightLoopHandle["subscribe"]>((fn) => {
    subscribersRef.current.add(fn);
    fn(telemetryRef.current);
    return () => {
      subscribersRef.current.delete(fn);
    };
  }, []);

  useEffect(() => {
    if (!running) return;

    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const tick = (now: number) => {
      const frame = Math.min((now - last) / 1000, MAX_ACCUMULATED);
      last = now;
      acc += frame;
      let advanced = false;
      while (acc >= FIXED_DT) {
        stateRef.current = step(stateRef.current, controlsRef.current, FIXED_DT);
        acc -= FIXED_DT;
        advanced = true;
      }
      if (advanced) {
        const t = stateToTelemetry(stateRef.current, controlsRef.current);
        telemetryRef.current = t;
        subscribersRef.current.forEach((fn) => fn(t));
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  return { stateRef, controlsRef, telemetryRef, subscribe };
}
