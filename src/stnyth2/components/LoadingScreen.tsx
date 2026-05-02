import { cn } from "@/lib/utils";
import { STNYTH2_PALETTE } from "../styles";

interface LoadingScreenProps {
  progress: number;
  fadingOut: boolean;
}

const LABEL = "STNYTH2";
const OUTER_RADIUS = 32;
const INNER_RADIUS = 18;
const OUTER_CIRCUMFERENCE = 2 * Math.PI * OUTER_RADIUS;
const INNER_CIRCUMFERENCE = 2 * Math.PI * INNER_RADIUS;

const LoadingScreen = ({ progress, fadingOut }: LoadingScreenProps) => {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center",
        "transition-opacity ease-out",
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
      style={{
        background: `radial-gradient(ellipse at center, #14141c 0%, ${STNYTH2_PALETTE.bg} 70%)`,
        color: STNYTH2_PALETTE.fg,
        transitionDuration: "350ms",
      }}
      aria-hidden={fadingOut}
    >
      <div className="relative h-20 w-20">
        <svg
          viewBox="0 0 80 80"
          className="absolute inset-0 h-full w-full -rotate-90"
          fill="none"
        >
          <circle
            cx="40"
            cy="40"
            r={OUTER_RADIUS}
            stroke={STNYTH2_PALETTE.line}
            strokeWidth="1"
          />
          <circle
            cx="40"
            cy="40"
            r={OUTER_RADIUS}
            stroke={STNYTH2_PALETTE.accent}
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray={OUTER_CIRCUMFERENCE}
            style={{
              strokeDashoffset:
                OUTER_CIRCUMFERENCE - (progress / 100) * OUTER_CIRCUMFERENCE,
              transition: "stroke-dashoffset 80ms linear",
            }}
          />
          <circle
            cx="40"
            cy="40"
            r={INNER_RADIUS}
            stroke={STNYTH2_PALETTE.line}
            strokeWidth="1"
            strokeDasharray={`${INNER_CIRCUMFERENCE / 4} ${INNER_CIRCUMFERENCE}`}
            style={{
              transformOrigin: "40px 40px",
              animation: "stnyth2-spin 2.4s linear infinite",
            }}
          />
        </svg>
      </div>

      <div
        className="mt-8 flex gap-[6px] font-mono text-[11px] uppercase"
        style={{ letterSpacing: "0.4em", color: STNYTH2_PALETTE.muted }}
      >
        {LABEL.split("").map((ch, i) => (
          <span
            key={i}
            style={{
              opacity: 0,
              animation: `stnyth2-letter-in 360ms ease-out ${100 + i * 60}ms forwards`,
            }}
          >
            {ch}
          </span>
        ))}
      </div>

      <div
        className="mt-6 h-px w-[120px] overflow-hidden"
        style={{ background: STNYTH2_PALETTE.line }}
      >
        <div
          className="h-full origin-left"
          style={{
            background: STNYTH2_PALETTE.accent,
            transform: `scaleX(${progress / 100})`,
            transition: "transform 80ms linear",
          }}
        />
      </div>

      <style>{`
        @keyframes stnyth2-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes stnyth2-letter-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
