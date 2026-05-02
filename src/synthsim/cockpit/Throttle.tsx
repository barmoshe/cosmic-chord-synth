import { useCallback, useEffect, useRef, useState } from "react";
import { SYNTHSIM_PALETTE } from "../styles";

interface ThrottleProps {
  onChange: (throttle: number) => void;
  initial?: number;
  width?: number;
  height?: number;
}

const Throttle = ({ onChange, initial = 0, width = 56, height = 220 }: ThrottleProps) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  const [value, setValue] = useState(initial);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onChangeRef.current(value);
  }, [value]);

  const setFromY = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const t = 1 - (clientY - rect.top) / rect.height;
    const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
    setValue(clamped);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleDown = (e: PointerEvent) => {
      if (pointerRef.current !== null) return;
      pointerRef.current = e.pointerId;
      track.setPointerCapture(e.pointerId);
      setFromY(e.clientY);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(6);
    };
    const handleMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerRef.current) return;
      setFromY(e.clientY);
    };
    const handleUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerRef.current) return;
      pointerRef.current = null;
      try {
        track.releasePointerCapture(e.pointerId);
      } catch {
        /* released already */
      }
    };

    track.addEventListener("pointerdown", handleDown);
    track.addEventListener("pointermove", handleMove);
    track.addEventListener("pointerup", handleUp);
    track.addEventListener("pointercancel", handleUp);

    return () => {
      track.removeEventListener("pointerdown", handleDown);
      track.removeEventListener("pointermove", handleMove);
      track.removeEventListener("pointerup", handleUp);
      track.removeEventListener("pointercancel", handleUp);
    };
  }, [setFromY]);

  return (
    <div
      ref={trackRef}
      className="relative select-none"
      style={{
        width,
        height,
        border: `1px solid ${SYNTHSIM_PALETTE.line}`,
        background: "rgba(255,255,255,0.02)",
        touchAction: "none",
      }}
    >
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{
          height: `${value * 100}%`,
          background: `linear-gradient(to top, ${SYNTHSIM_PALETTE.accent} 0%, rgba(232,232,238,0.3) 100%)`,
          transition: "height 30ms linear",
        }}
      />
      <div
        className="absolute left-0 right-0 font-mono text-[10px] text-center pointer-events-none"
        style={{
          bottom: 6,
          color: SYNTHSIM_PALETTE.bg,
          mixBlendMode: "difference",
          letterSpacing: "0.2em",
        }}
      >
        {Math.round(value * 100)}
      </div>
    </div>
  );
};

export default Throttle;
