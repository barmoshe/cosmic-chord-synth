import { useEffect, useState } from "react";
import { useTelemetry } from "../cockpit/TelemetryContext";
import { SYNTHSIM_PALETTE } from "../styles";

const formatClock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const hh = Math.floor(s / 3600).toString().padStart(2, "0");
  const mm = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `T+${hh}:${mm}:${ss}`;
};

interface HudProps {
  phase?: string;
}

const Hud = ({ phase = "FLYING" }: HudProps) => {
  const t = useTelemetry();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => {
      setElapsed((performance.now() - start) / 1000);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const fuelSegments = 8;
  const filled = Math.round(t.fuel * fuelSegments);

  return (
    <div
      className="w-full font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] flex items-center justify-between px-3"
      style={{
        paddingTop: "max(0.25rem, env(safe-area-inset-top))",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
        paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        paddingBottom: "0.25rem",
        color: SYNTHSIM_PALETTE.fg,
        background: "rgba(10,10,15,0.7)",
        borderBottom: `1px solid ${SYNTHSIM_PALETTE.line}`,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      role="status"
    >
      <span data-testid="hud-phase" style={{ color: SYNTHSIM_PALETTE.accent }}>
        {phase}
      </span>
      <span data-testid="hud-clock">{formatClock(elapsed)}</span>
      <span data-testid="hud-fuel" className="flex items-center gap-1">
        FUEL
        <span className="inline-flex gap-[2px]">
          {Array.from({ length: fuelSegments }).map((_, i) => (
            <span
              key={i}
              data-filled={i < filled ? "true" : "false"}
              style={{
                display: "inline-block",
                width: 6,
                height: 8,
                background: i < filled ? SYNTHSIM_PALETTE.fg : SYNTHSIM_PALETTE.line,
              }}
            />
          ))}
        </span>
      </span>
    </div>
  );
};

export default Hud;
