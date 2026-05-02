import { useEffect, useState } from "react";
import { SYNTHSIM_PALETTE } from "../styles";
import type { Telemetry } from "../engine/types";

interface DebugTelemetryHUDProps {
  telemetryRef: React.MutableRefObject<Telemetry>;
  intervalMs?: number;
}

const fmt = (v: number, digits = 0) => {
  if (!Number.isFinite(v)) return "—";
  return v.toFixed(digits);
};

const DebugTelemetryHUD = ({ telemetryRef, intervalMs = 100 }: DebugTelemetryHUDProps) => {
  const [t, setT] = useState<Telemetry>(telemetryRef.current);

  useEffect(() => {
    const id = window.setInterval(() => {
      setT({ ...telemetryRef.current });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [telemetryRef, intervalMs]);

  const rows: Array<[string, string]> = [
    ["ASI", `${fmt(t.airspeedKt)} kt`],
    ["ALT", `${fmt(t.altitudeFt)} ft`],
    ["V/S", `${t.verticalSpeedFpm >= 0 ? "+" : ""}${fmt(t.verticalSpeedFpm)} fpm`],
    ["PIT", `${fmt(t.pitchDeg, 1)}°`],
    ["ROL", `${fmt(t.rollDeg, 1)}°`],
    ["HDG", `${fmt(t.headingDeg)}°`],
    ["YAW", `${fmt(t.yawRateDps, 1)}°/s`],
    ["THR", `${fmt(t.throttle * 100)}%`],
    ["RPM", `${fmt(t.rpm * 100)}%`],
    ["FLP", `${t.flaps}`],
    ["GR ", t.gearDown ? "▼" : "▲"],
    ["GND", t.onGround ? "yes" : "no"],
    ["FUE", `${fmt(t.fuel * 100)}%`],
  ];

  return (
    <div
      className="fixed left-0 top-0 font-mono text-[10px] leading-[1.35] px-3 py-2 pointer-events-none"
      style={{
        paddingTop: "max(0.5rem, env(safe-area-inset-top))",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
        color: SYNTHSIM_PALETTE.fg,
        background: "rgba(10,10,15,0.55)",
        borderRight: `1px solid ${SYNTHSIM_PALETTE.line}`,
        borderBottom: `1px solid ${SYNTHSIM_PALETTE.line}`,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      aria-live="off"
    >
      {rows.map(([label, val]) => (
        <div key={label} className="flex gap-3 justify-between">
          <span style={{ color: SYNTHSIM_PALETTE.muted, letterSpacing: "0.08em" }}>{label}</span>
          <span>{val}</span>
        </div>
      ))}
      {(t.stallWarning || t.overspeed) && (
        <div className="mt-1 pt-1" style={{ borderTop: `1px solid ${SYNTHSIM_PALETTE.line}` }}>
          {t.stallWarning && <div style={{ color: "#ff6a6a" }}>STALL</div>}
          {t.overspeed && <div style={{ color: "#ffae6a" }}>OVERSPEED</div>}
        </div>
      )}
    </div>
  );
};

export default DebugTelemetryHUD;
