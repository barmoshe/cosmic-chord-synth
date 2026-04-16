import { useEffect, useRef, useState } from "react";

interface GyroHandle {
  requestPermission: () => Promise<"granted" | "denied" | "unsupported">;
  permission: "unknown" | "granted" | "denied" | "unsupported";
  tiltX: React.MutableRefObject<number>;
  tiltY: React.MutableRefObject<number>;
}

export function useGyroInput(): GyroHandle {
  const tiltX = useRef(0);
  const tiltY = useRef(0);
  const [permission, setPermission] = useState<GyroHandle["permission"]>("unknown");
  const attachedRef = useRef(false);

  const attachListener = () => {
    if (attachedRef.current) return;
    attachedRef.current = true;
    const handler = (e: DeviceOrientationEvent) => {
      // gamma: left/right tilt in degrees [-90, 90], beta: front/back tilt [-180, 180]
      const gamma = e.gamma ?? 0;
      const beta = e.beta ?? 0;
      // Scale to [-1, 1]-ish
      tiltX.current = Math.max(-1, Math.min(1, gamma / 45));
      tiltY.current = Math.max(-1, Math.min(1, (beta - 45) / 45));
    };
    window.addEventListener("deviceorientation", handler);
  };

  const requestPermission: GyroHandle["requestPermission"] = async () => {
    const DOE = window.DeviceOrientationEvent as unknown as
      | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> })
      | undefined;
    if (!DOE) {
      setPermission("unsupported");
      return "unsupported";
    }
    if (typeof DOE.requestPermission === "function") {
      try {
        const res = await DOE.requestPermission();
        if (res === "granted") {
          attachListener();
          setPermission("granted");
          return "granted";
        }
        setPermission("denied");
        return "denied";
      } catch {
        setPermission("denied");
        return "denied";
      }
    }
    // Non-iOS: no permission needed
    attachListener();
    setPermission("granted");
    return "granted";
  };

  useEffect(() => {
    // Auto-attach on non-iOS where no permission is needed
    const DOE = window.DeviceOrientationEvent as unknown as
      | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> })
      | undefined;
    if (DOE && typeof DOE.requestPermission !== "function") {
      attachListener();
      setPermission("granted");
    }
  }, []);

  return { requestPermission, permission, tiltX, tiltY };
}
