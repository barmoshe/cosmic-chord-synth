import { useCallback, useEffect, useRef } from "react";
import { SYNTHSIM_PALETTE } from "../styles";

export interface YokeAxes {
  x: number;
  y: number;
}

interface YokeProps {
  onChange: (axes: YokeAxes) => void;
  size?: number;
}

const SPRING_BACK_PER_SEC = 2.2;

const Yoke = ({ onChange, size = 180 }: YokeProps) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<number | null>(null);
  const axesRef = useRef<YokeAxes>({ x: 0, y: 0 });
  const targetRef = useRef<YokeAxes | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const writeThumb = useCallback((x: number, y: number) => {
    const t = thumbRef.current;
    if (!t) return;
    const radius = size / 2;
    t.style.transform = `translate(${x * radius * 0.7}px, ${y * radius * 0.7}px)`;
  }, [size]);

  useEffect(() => {
    const pad = padRef.current;
    if (!pad) return;

    const setFromEvent = (clientX: number, clientY: number) => {
      const rect = pad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (clientX - cx) / (rect.width / 2);
      const dy = (clientY - cy) / (rect.height / 2);
      const mag = Math.hypot(dx, dy);
      const cap = mag > 1 ? 1 / mag : 1;
      targetRef.current = { x: dx * cap, y: dy * cap };
    };

    const handleDown = (e: PointerEvent) => {
      if (pointerRef.current !== null) return;
      pointerRef.current = e.pointerId;
      pad.setPointerCapture(e.pointerId);
      setFromEvent(e.clientX, e.clientY);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
    };
    const handleMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerRef.current) return;
      setFromEvent(e.clientX, e.clientY);
    };
    const handleUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerRef.current) return;
      pointerRef.current = null;
      targetRef.current = null;
      try {
        pad.releasePointerCapture(e.pointerId);
      } catch {
        /* released already */
      }
    };

    pad.addEventListener("pointerdown", handleDown);
    pad.addEventListener("pointermove", handleMove);
    pad.addEventListener("pointerup", handleUp);
    pad.addEventListener("pointercancel", handleUp);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const target = targetRef.current;
      if (target) {
        axesRef.current = target;
      } else {
        const decay = Math.max(0, 1 - SPRING_BACK_PER_SEC * dt);
        axesRef.current = {
          x: axesRef.current.x * decay,
          y: axesRef.current.y * decay,
        };
        if (Math.abs(axesRef.current.x) < 0.001) axesRef.current.x = 0;
        if (Math.abs(axesRef.current.y) < 0.001) axesRef.current.y = 0;
      }
      writeThumb(axesRef.current.x, axesRef.current.y);
      onChangeRef.current(axesRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      pad.removeEventListener("pointerdown", handleDown);
      pad.removeEventListener("pointermove", handleMove);
      pad.removeEventListener("pointerup", handleUp);
      pad.removeEventListener("pointercancel", handleUp);
      cancelAnimationFrame(raf);
    };
  }, [writeThumb]);

  return (
    <div
      ref={padRef}
      className="relative rounded-full select-none"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at center, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 60%, rgba(255,255,255,0) 100%)",
        border: `1px solid ${SYNTHSIM_PALETTE.line}`,
        touchAction: "none",
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: size * 0.15,
          height: size * 0.15,
          marginLeft: -(size * 0.15) / 2,
          marginTop: -(size * 0.15) / 2,
          background: SYNTHSIM_PALETTE.line,
        }}
      />
      <div
        ref={thumbRef}
        className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
        style={{
          width: size * 0.32,
          height: size * 0.32,
          marginLeft: -(size * 0.32) / 2,
          marginTop: -(size * 0.32) / 2,
          background: SYNTHSIM_PALETTE.fg,
          opacity: 0.85,
          transition: "transform 30ms linear",
        }}
      />
    </div>
  );
};

export default Yoke;
