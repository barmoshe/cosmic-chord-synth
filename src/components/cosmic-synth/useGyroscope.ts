import { useEffect, useCallback } from "react";
import { SCALES, SCALE_ORDER } from "./constants";
import { noteColor, haptic } from "./helpers";

export function useGyroscope(
  phase: string,
  gyroRef: React.MutableRefObject<any>,
  scaleRef: React.MutableRefObject<string>,
  flashIntensity: React.MutableRefObject<number>,
  engineRef: React.MutableRefObject<any>,
  setScale: (s: string) => void,
  setFlash: (s: string) => void,
  setGyroPrompt: (v: boolean) => void,
) {
  // Gyroscope + Accelerometer
  useEffect(() => {
    if (phase !== "play") return;
    const g = gyroRef.current;
    const orientHandler = (e: DeviceOrientationEvent) => {
      g.on = true; g.beta = e.beta || 0; g.gamma = e.gamma || 0; g.alpha = e.alpha || 0;
    };
    const motionHandler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      g.accelX = acc.x || 0; g.accelY = acc.y || 0; g.accelZ = acc.z || 0;
      // Shake detection
      const magnitude = Math.sqrt(g.accelX ** 2 + g.accelY ** 2 + g.accelZ ** 2);
      if (magnitude > 25) {
        const now = Date.now();
        if (now - g.lastShakeTime > 600) {
          g.lastShakeTime = now;
          g.shake = 1;
          // Shake triggers scale change + visual burst
          const si = SCALE_ORDER.indexOf(scaleRef.current);
          const newScale = SCALE_ORDER[(si + 1) % SCALE_ORDER.length];
          setScale(newScale); scaleRef.current = newScale;
          flashIntensity.current = 1.5;
          setFlash(SCALES[newScale].label);
          setTimeout(() => setFlash(""), 1500);
          haptic([30, 50, 30, 50, 30]);
          // Emit burst particles from center
          if (engineRef.current) {
            const col = noteColor(60);
            for (let i = 0; i < 5; i++) {
              engineRef.current.emitParticles(
                (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200,
                col, 15, 1
              );
            }
          }
        }
      }
    };

    if (typeof DeviceOrientationEvent !== "undefined" && typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      setGyroPrompt(true);
    } else {
      window.addEventListener("deviceorientation", orientHandler);
      window.addEventListener("devicemotion", motionHandler);
      g.on = true;
    }
    return () => {
      window.removeEventListener("deviceorientation", orientHandler);
      window.removeEventListener("devicemotion", motionHandler);
    };
  }, [phase]);

  const grantGyro = useCallback(async () => {
    setGyroPrompt(false);
    try {
      const g = gyroRef.current;
      const s = await (DeviceOrientationEvent as any).requestPermission();
      if (s === "granted") {
        window.addEventListener("deviceorientation", (e: DeviceOrientationEvent) => {
          g.on = true; g.beta = e.beta || 0; g.gamma = e.gamma || 0; g.alpha = e.alpha || 0;
        });
      }
      // Also request motion permission (iOS 13+)
      if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
        const ms = await (DeviceMotionEvent as any).requestPermission();
        if (ms === "granted") {
          window.addEventListener("devicemotion", (e: DeviceMotionEvent) => {
            const acc = e.accelerationIncludingGravity;
            if (!acc) return;
            g.accelX = acc.x || 0; g.accelY = acc.y || 0; g.accelZ = acc.z || 0;
            const magnitude = Math.sqrt(g.accelX ** 2 + g.accelY ** 2 + g.accelZ ** 2);
            if (magnitude > 25) {
              const now = Date.now();
              if (now - g.lastShakeTime > 600) {
                g.lastShakeTime = now; g.shake = 1;
                haptic([30, 50, 30]);
              }
            }
          });
        }
      }
    } catch {}
  }, []);

  return { grantGyro };
}
