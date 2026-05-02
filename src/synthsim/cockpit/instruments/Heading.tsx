import { useTelemetry } from "../TelemetryContext";
import { pad3, polar } from "./instrumentChrome";

const DIR_LABELS: Array<{ deg: number; label: string }> = [
  { deg: 0, label: "N" },
  { deg: 30, label: "3" },
  { deg: 60, label: "6" },
  { deg: 90, label: "E" },
  { deg: 120, label: "12" },
  { deg: 150, label: "15" },
  { deg: 180, label: "S" },
  { deg: 210, label: "21" },
  { deg: 240, label: "24" },
  { deg: 270, label: "W" },
  { deg: 300, label: "30" },
  { deg: 330, label: "33" },
];

const TICKS = (() => {
  const out: Array<{ deg: number; major: boolean }> = [];
  for (let d = 0; d < 360; d += 5) {
    out.push({ deg: d, major: d % 30 === 0 });
  }
  return out;
})();

const Heading = () => {
  const t = useTelemetry();
  const cardRotation = -t.headingDeg;

  return (
    <svg
      viewBox="-100 -100 200 200"
      data-testid="hsi-svg"
      className="w-full h-full"
      role="img"
      aria-label="heading indicator"
    >
      <circle cx="0" cy="0" r="98" fill="#0a0a0f" stroke="#3a3a44" strokeWidth="2" />

      <g data-testid="hsi-card" transform={`rotate(${cardRotation})`}>
        {TICKS.map(({ deg, major }) => {
          const inner = polar(0, 0, major ? 64 : 70, deg);
          const outer = polar(0, 0, 78, deg);
          return (
            <line
              key={deg}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#cfcfd6"
              strokeWidth={major ? 1.4 : 0.7}
            />
          );
        })}

        {DIR_LABELS.map(({ deg, label }) => {
          const p = polar(0, 0, 52, deg);
          const isCardinal = label.length === 1;
          return (
            <text
              key={deg}
              x={p.x}
              y={p.y + 4}
              fill={isCardinal ? "#fff" : "#cfcfd6"}
              fontSize={isCardinal ? 14 : 10}
              fontFamily="monospace"
              fontWeight={isCardinal ? "700" : "400"}
              textAnchor="middle"
              transform={`rotate(${deg}, ${p.x}, ${p.y})`}
            >
              {label}
            </text>
          );
        })}
      </g>

      <polygon points="0,-86 -5,-78 5,-78" fill="#ffd84d" />

      <rect x="-22" y="-12" width="44" height="22" fill="#0a0a0f" stroke="#ffd84d" strokeWidth="1" />
      <text
        data-testid="hsi-value"
        x="0"
        y="5"
        fill="#ffd84d"
        fontSize="14"
        fontFamily="monospace"
        textAnchor="middle"
        fontWeight="600"
      >
        {pad3(t.headingDeg)}
      </text>

      <text
        x="0"
        y="78"
        fill="#cfcfd6"
        fontSize="9"
        fontFamily="monospace"
        textAnchor="middle"
        letterSpacing="0.15em"
      >
        HDG
      </text>
    </svg>
  );
};

export default Heading;
