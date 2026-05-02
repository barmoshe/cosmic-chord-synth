import { useTelemetry } from "../TelemetryContext";
import { arcPath, clamp, polar } from "./instrumentChrome";

const KT_MIN = 0;
const KT_MAX = 200;
const ARC_START = -135;
const ARC_END = 135;
const ARC_SPAN = ARC_END - ARC_START;

const ktToDeg = (kt: number) => ARC_START + (clamp(kt, KT_MIN, KT_MAX) / KT_MAX) * ARC_SPAN;

const ticks = (() => {
  const out: Array<{ kt: number; major: boolean }> = [];
  for (let kt = KT_MIN; kt <= KT_MAX; kt += 10) {
    out.push({ kt, major: kt % 20 === 0 });
  }
  return out;
})();

const Airspeed = () => {
  const t = useTelemetry();
  const needleDeg = ktToDeg(t.airspeedKt);

  return (
    <svg
      viewBox="-100 -100 200 200"
      data-testid="asi-svg"
      className="w-full h-full"
      role="img"
      aria-label="airspeed indicator"
    >
      <circle cx="0" cy="0" r="98" fill="#0a0a0f" stroke="#3a3a44" strokeWidth="2" />

      <g fill="none" strokeWidth="6">
        <path d={arcPath(0, 0, 78, ktToDeg(35), ktToDeg(85))} stroke="#fff" />
        <path d={arcPath(0, 0, 78, ktToDeg(47), ktToDeg(127))} stroke="#3ec27a" />
        <path d={arcPath(0, 0, 78, ktToDeg(127), ktToDeg(160))} stroke="#e6c547" />
      </g>

      {(() => {
        const a = polar(0, 0, 70, ktToDeg(160));
        const b = polar(0, 0, 86, ktToDeg(160));
        return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#e64545" strokeWidth="3" />;
      })()}

      {ticks.map(({ kt, major }) => {
        const inner = polar(0, 0, major ? 60 : 66, ktToDeg(kt));
        const outer = polar(0, 0, 70, ktToDeg(kt));
        return (
          <line
            key={kt}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="#fff"
            strokeWidth={major ? 1.5 : 0.8}
          />
        );
      })}

      {ticks
        .filter((tk) => tk.major)
        .map(({ kt }) => {
          const p = polar(0, 0, 50, ktToDeg(kt));
          return (
            <text
              key={kt}
              x={p.x}
              y={p.y + 3.5}
              fill="#cfcfd6"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {kt}
            </text>
          );
        })}

      <g data-testid="asi-needle" transform={`rotate(${needleDeg})`}>
        <path d="M 0 -68 L -2.5 6 L 2.5 6 Z" fill="#fff" />
        <circle cx="0" cy="0" r="4" fill="#fff" />
      </g>

      <text
        x="0"
        y="78"
        fill="#cfcfd6"
        fontSize="9"
        fontFamily="monospace"
        textAnchor="middle"
        letterSpacing="0.15em"
      >
        KIAS
      </text>
    </svg>
  );
};

export default Airspeed;
