import { useTelemetry } from "../cockpit/TelemetryContext";

const StallBanner = () => {
  const t = useTelemetry();
  if (!t.stallWarning && !t.overspeed) return null;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none flex flex-col gap-1 items-center font-mono uppercase tracking-[0.3em] text-[11px] sm:text-sm"
      style={{ top: "8px" }}
      role="alert"
      aria-live="assertive"
    >
      {t.stallWarning && (
        <span
          data-testid="stall-warning"
          className="px-2 py-1 animate-pulse"
          style={{
            background: "rgba(230,69,69,0.2)",
            color: "#ff8a8a",
            border: "1px solid #e64545",
          }}
        >
          STALL
        </span>
      )}
      {t.overspeed && (
        <span
          data-testid="overspeed-warning"
          className="px-2 py-1 animate-pulse"
          style={{
            background: "rgba(230,140,69,0.2)",
            color: "#ffb56a",
            border: "1px solid #e68c45",
          }}
        >
          OVERSPEED
        </span>
      )}
    </div>
  );
};

export default StallBanner;
