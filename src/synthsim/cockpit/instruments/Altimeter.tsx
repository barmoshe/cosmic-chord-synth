import { useTelemetry } from "../TelemetryContext";

const PX_PER_FT = 0.2;
const VIEW_W = 100;
const VIEW_H = 200;
const CENTER_Y = VIEW_H / 2;

const Altimeter = () => {
  const t = useTelemetry();
  const alt = t.altitudeFt;
  const altRound = Math.round(alt);
  const base = Math.floor(alt / 100) * 100;
  const frac = alt - base;

  const ticks: Array<{ value: number; major: boolean }> = [];
  for (let i = -5; i <= 5; i++) {
    const value = base + i * 100;
    if (value < -1000) continue;
    ticks.push({ value, major: value % 500 === 0 });
  }

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      data-testid="alt-svg"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="altimeter"
    >
      <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="#0a0a0f" stroke="#3a3a44" strokeWidth="1" />

      <defs>
        <clipPath id="alt-tape-clip">
          <rect x="0" y="0" width={VIEW_W} height={VIEW_H} />
        </clipPath>
      </defs>

      <g clipPath="url(#alt-tape-clip)">
        {ticks.map(({ value, major }) => {
          const y = CENTER_Y + (frac - (value - base)) * PX_PER_FT;
          return (
            <g key={value}>
              <line
                x1={0}
                y1={y}
                x2={major ? 22 : 14}
                y2={y}
                stroke="#cfcfd6"
                strokeWidth={major ? 1.2 : 0.8}
              />
              {major && (
                <text
                  x={26}
                  y={y + 3}
                  fill="#cfcfd6"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {value}
                </text>
              )}
            </g>
          );
        })}
      </g>

      <line x1={0} y1={CENTER_Y} x2={VIEW_W} y2={CENTER_Y} stroke="#ffd84d" strokeWidth="1.2" />
      <rect
        x={VIEW_W - 56}
        y={CENTER_Y - 11}
        width="54"
        height="22"
        fill="#0a0a0f"
        stroke="#ffd84d"
        strokeWidth="1"
      />
      <text
        data-testid="alt-value"
        x={VIEW_W - 4}
        y={CENTER_Y + 5}
        fill="#ffd84d"
        fontSize="14"
        fontFamily="monospace"
        textAnchor="end"
        fontWeight="600"
      >
        {altRound}
      </text>

      <text
        x={VIEW_W / 2}
        y={VIEW_H - 6}
        fill="#cfcfd6"
        fontSize="8"
        fontFamily="monospace"
        textAnchor="middle"
        letterSpacing="0.15em"
      >
        ALT FT
      </text>
    </svg>
  );
};

export default Altimeter;
