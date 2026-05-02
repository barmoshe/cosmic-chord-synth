import { useTelemetry } from "../TelemetryContext";
import { clamp, polar } from "./instrumentChrome";

const FPM_MAX = 2000;

const fpmToDeg = (fpm: number) => clamp(fpm / FPM_MAX, -1, 1) * 90 - 90;

const TICKS = [-2000, -1500, -1000, -500, 0, 500, 1000, 1500, 2000];

const Variometer = () => {
  const t = useTelemetry();
  const needleDeg = fpmToDeg(t.verticalSpeedFpm);

  return (
    <svg
      viewBox="-100 -100 200 200"
      data-testid="vsi-svg"
      className="w-full h-full"
      role="img"
      aria-label="vertical speed indicator"
    >
      <circle cx="0" cy="0" r="98" fill="#0a0a0f" stroke="#3a3a44" strokeWidth="2" />

      {TICKS.map((fpm) => {
        const deg = fpmToDeg(fpm);
        const major = Math.abs(fpm) % 1000 === 0;
        const inner = polar(0, 0, major ? 60 : 66, deg);
        const outer = polar(0, 0, 70, deg);
        return (
          <g key={fpm}>
            <line
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#cfcfd6"
              strokeWidth={major ? 1.4 : 0.8}
            />
            {major && (() => {
              const pl = polar(0, 0, 48, deg);
              return (
                <text
                  x={pl.x}
                  y={pl.y + 3.5}
                  fill="#cfcfd6"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {Math.abs(fpm) / 1000}
                </text>
              );
            })()}
          </g>
        );
      })}

      <text
        x="0"
        y="-32"
        fill="#cfcfd6"
        fontSize="7"
        fontFamily="monospace"
        textAnchor="middle"
      >
        UP
      </text>
      <text
        x="0"
        y="42"
        fill="#cfcfd6"
        fontSize="7"
        fontFamily="monospace"
        textAnchor="middle"
      >
        DN
      </text>

      <g data-testid="vsi-needle" transform={`rotate(${needleDeg})`}>
        <path d="M 0 -68 L -2.5 6 L 2.5 6 Z" fill="#fff" />
        <circle cx="0" cy="0" r="4" fill="#fff" />
      </g>

      <text
        x="0"
        y="78"
        fill="#cfcfd6"
        fontSize="8"
        fontFamily="monospace"
        textAnchor="middle"
        letterSpacing="0.15em"
      >
        VS x1000
      </text>
    </svg>
  );
};

export default Variometer;
