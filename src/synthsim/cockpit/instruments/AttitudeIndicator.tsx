import { useTelemetry } from "../TelemetryContext";
import { polar } from "./instrumentChrome";

const PX_PER_DEG = 4;
const CLIP_R = 88;

const pitchTicks = (() => {
  const out: Array<{ y: number; w: number; label?: number }> = [];
  for (let p = -30; p <= 30; p += 5) {
    if (p === 0) continue;
    const isMajor = p % 10 === 0;
    out.push({ y: p * PX_PER_DEG, w: isMajor ? 30 : 14, label: isMajor ? Math.abs(p) : undefined });
  }
  return out;
})();

const bankTickAngles = [-60, -45, -30, -20, -10, 10, 20, 30, 45, 60];

const AttitudeIndicator = () => {
  const t = useTelemetry();
  const innerTransform = `translate(0 ${t.pitchDeg * PX_PER_DEG}) rotate(${-t.rollDeg})`;

  return (
    <svg
      viewBox="-100 -100 200 200"
      data-testid="ai-svg"
      className="w-full h-full"
      role="img"
      aria-label="attitude indicator"
    >
      <defs>
        <clipPath id="ai-clip">
          <circle cx="0" cy="0" r={CLIP_R} />
        </clipPath>
      </defs>

      <circle cx="0" cy="0" r="98" fill="#0a0a0f" stroke="#3a3a44" strokeWidth="2" />

      <g clipPath="url(#ai-clip)">
        <g data-testid="ai-inner" transform={innerTransform}>
          <rect x="-400" y="-400" width="800" height="400" fill="#4a7fb0" />
          <rect x="-400" y="0" width="800" height="400" fill="#6e4a2a" />
          <line x1="-400" y1="0" x2="400" y2="0" stroke="#fff" strokeWidth="1.5" />
          {pitchTicks.map((tick) => (
            <g key={tick.y}>
              <line
                x1={-tick.w / 2}
                y1={tick.y}
                x2={tick.w / 2}
                y2={tick.y}
                stroke="#fff"
                strokeWidth="1.2"
              />
              {tick.label !== undefined && (
                <>
                  <text
                    x={-tick.w / 2 - 6}
                    y={tick.y + 3}
                    fill="#fff"
                    fontSize="8"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {tick.label}
                  </text>
                  <text
                    x={tick.w / 2 + 6}
                    y={tick.y + 3}
                    fill="#fff"
                    fontSize="8"
                    fontFamily="monospace"
                    textAnchor="start"
                  >
                    {tick.label}
                  </text>
                </>
              )}
            </g>
          ))}
        </g>
      </g>

      <g data-testid="ai-bank" transform={`rotate(${-t.rollDeg})`}>
        {bankTickAngles.map((deg) => {
          const inner = polar(0, 0, CLIP_R - 6, deg);
          const len = deg % 30 === 0 ? 10 : 5;
          const outer = polar(0, 0, CLIP_R - 6 + len, deg);
          return (
            <line
              key={deg}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#fff"
              strokeWidth={deg % 30 === 0 ? 1.5 : 1}
            />
          );
        })}
      </g>

      <polygon points="0,-86 -5,-78 5,-78" fill="#ffd84d" />

      <g fill="none" stroke="#ffd84d" strokeWidth="2.5" strokeLinecap="round">
        <line x1="-40" y1="0" x2="-12" y2="0" />
        <line x1="12" y1="0" x2="40" y2="0" />
        <line x1="-12" y1="0" x2="-12" y2="6" />
        <line x1="12" y1="0" x2="12" y2="6" />
      </g>
      <circle cx="0" cy="0" r="2.2" fill="#ffd84d" />
    </svg>
  );
};

export default AttitudeIndicator;
