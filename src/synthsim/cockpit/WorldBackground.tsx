import { useTelemetry } from "./TelemetryContext";

const PX_PER_DEG = 11;

const WorldBackground = () => {
  const t = useTelemetry();
  const pitchPx = t.pitchDeg * PX_PER_DEG;
  const rollDeg = t.rollDeg;

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: "400vmax",
          height: "400vmax",
          marginLeft: "-200vmax",
          marginTop: "-200vmax",
          transform: `translate(0px, ${pitchPx}px) rotate(${-rollDeg}deg)`,
          transformOrigin: "50% 50%",
          willChange: "transform",
        }}
      >
        <div
          className="absolute left-0 right-0 top-0"
          style={{
            height: "50%",
            background:
              "linear-gradient(to bottom, #1a3859 0%, #3d6b96 55%, #6ea3c8 92%, #8ec0d9 100%)",
          }}
        />
        <div
          className="absolute left-0 right-0 bottom-0"
          style={{
            height: "50%",
            background:
              "linear-gradient(to top, #2a1c10 0%, #4a3220 38%, #6e4a2a 75%, #8a5e34 100%)",
          }}
        />
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: "50%",
            marginTop: "-1px",
            height: "2px",
            background: "rgba(255, 255, 255, 0.55)",
            boxShadow: "0 0 12px rgba(255, 255, 255, 0.18)",
          }}
        />

        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`grid-${i}`}
            className="absolute left-0 right-0"
            style={{
              top: `${50 + (i + 1) * 1.6}%`,
              height: "1px",
              background: `rgba(255, 220, 180, ${0.1 - i * 0.008})`,
            }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, transparent 50%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </div>
  );
};

export default WorldBackground;
