import { useEffect, useRef } from "react";
import { PhysicsEngine, makeSolarSystem } from "../physics/engine";
import type { Body, FieldImpulse, PhysicsEvent, Vec3 } from "../physics/types";

interface PhysicsHookOpts {
  running: boolean;
}

export interface PhysicsHandle {
  bodiesRef: React.MutableRefObject<Body[]>;
  drainEvents: () => PhysicsEvent[];
  spawnSpark: (pos: Vec3, vel: Vec3, color: Vec3, scaleDegree: number, octave: number) => void;
  applyField: (f: FieldImpulse) => void;
  setGravityBias: (x: number, y: number, z: number) => void;
  reset: () => void;
}

export function usePhysicsEngine(opts: PhysicsHookOpts): PhysicsHandle {
  const engineRef = useRef<PhysicsEngine | null>(null);
  const bodiesRef = useRef<Body[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(performance.now());
  const runningRef = useRef(opts.running);

  // Init sim once
  if (engineRef.current === null) {
    engineRef.current = new PhysicsEngine(makeSolarSystem({ moonCount: 9, cometCount: 2 }));
    bodiesRef.current = engineRef.current.getBodies();
  }

  useEffect(() => {
    runningRef.current = opts.running;
  }, [opts.running]);

  useEffect(() => {
    function tick(t: number) {
      const dtMs = t - lastTimeRef.current;
      lastTimeRef.current = t;
      // Clamp dt to avoid jumps after tab-switch
      const dt = Math.min(0.033, Math.max(0.001, dtMs / 1000));
      const eng = engineRef.current;
      if (eng && runningRef.current && !document.hidden) {
        eng.step(dt, t);
        bodiesRef.current = eng.getBodies();
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const drainEvents = () => engineRef.current?.drainEvents() ?? [];

  const spawnSpark = (pos: Vec3, vel: Vec3, color: Vec3, scaleDegree: number, octave: number) => {
    engineRef.current?.spawnSpark({ pos, vel, color, scaleDegree, octave, ttlMs: 6000 });
  };

  const applyField = (f: FieldImpulse) => {
    engineRef.current?.addField(f);
  };

  const setGravityBias = (x: number, y: number, z: number) => {
    engineRef.current?.setGravityBias(x, y, z);
  };

  const reset = () => {
    engineRef.current = new PhysicsEngine(makeSolarSystem({ moonCount: 9, cometCount: 2 }));
    bodiesRef.current = engineRef.current.getBodies();
  };

  return { bodiesRef, drainEvents, spawnSpark, applyField, setGravityBias, reset };
}
