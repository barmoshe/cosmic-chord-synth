interface NeonSkylineProps {
  visible: boolean;
}

// Three parallax layers of neon-lit skyscrapers. SVG silhouettes with CSS
// keyframe scans & flicker. Sits below HologramBillboards, above the canvas.
// Fades in with play phase; decorative only (pointer-events: none).

function BuildingRow({
  pattern,
  fill,
  stripe,
  windowColor,
}: {
  pattern: { w: number; h: number; x: number; windows: number }[];
  fill: string;
  stripe: string;
  windowColor: string;
}) {
  return (
    <svg viewBox="0 0 1000 400" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      {pattern.map((b, i) => {
        const top = 400 - b.h;
        return (
          <g key={i}>
            <rect x={b.x} y={top} width={b.w} height={b.h} fill={fill} />
            {/* Vertical stripe */}
            <rect x={b.x + b.w / 2 - 1} y={top + 6} width="2" height={b.h - 10} fill={stripe} opacity="0.6" />
            {/* Antenna on taller buildings */}
            {b.h > 240 && (
              <line
                x1={b.x + b.w / 2}
                y1={top}
                x2={b.x + b.w / 2}
                y2={top - 22}
                stroke={stripe}
                strokeWidth="1.2"
                opacity="0.9"
              />
            )}
            {/* Window grid */}
            {Array.from({ length: b.windows }).map((_, w) => {
              const cols = Math.max(2, Math.floor(b.w / 10));
              const row = Math.floor(w / cols);
              const col = w % cols;
              const wx = b.x + 4 + col * 8;
              const wy = top + 14 + row * 12;
              return (
                <rect
                  key={w}
                  x={wx}
                  y={wy}
                  width="3"
                  height="4"
                  fill={windowColor}
                  opacity={(w * 37) % 10 < 7 ? 0.85 : 0.25}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

const FAR_PATTERN = [
  { x: 40,  w: 60, h: 180, windows: 36 },
  { x: 120, w: 70, h: 260, windows: 60 },
  { x: 210, w: 50, h: 160, windows: 26 },
  { x: 280, w: 80, h: 300, windows: 72 },
  { x: 380, w: 60, h: 210, windows: 42 },
  { x: 460, w: 70, h: 280, windows: 60 },
  { x: 560, w: 50, h: 180, windows: 30 },
  { x: 630, w: 80, h: 340, windows: 80 },
  { x: 740, w: 60, h: 220, windows: 42 },
  { x: 820, w: 70, h: 300, windows: 66 },
  { x: 910, w: 50, h: 200, windows: 32 },
];

const MID_PATTERN = [
  { x: 0,   w: 90,  h: 230, windows: 54 },
  { x: 110, w: 110, h: 310, windows: 84 },
  { x: 240, w: 80,  h: 260, windows: 60 },
  { x: 340, w: 120, h: 340, windows: 96 },
  { x: 480, w: 90,  h: 270, windows: 66 },
  { x: 590, w: 100, h: 320, windows: 84 },
  { x: 710, w: 80,  h: 240, windows: 54 },
  { x: 810, w: 110, h: 300, windows: 78 },
  { x: 940, w: 60,  h: 220, windows: 36 },
];

const NEAR_PATTERN = [
  { x: -20, w: 140, h: 330, windows: 108 },
  { x: 140, w: 160, h: 380, windows: 144 },
  { x: 320, w: 120, h: 310, windows: 96 },
  { x: 460, w: 180, h: 360, windows: 160 },
  { x: 660, w: 130, h: 340, windows: 112 },
  { x: 810, w: 170, h: 380, windows: 156 },
  { x: 1000, w: 80, h: 280, windows: 60 },
];

export default function NeonSkyline({ visible }: NeonSkylineProps) {
  return (
    <div className="cyber-skyline-overlay" data-visible={visible ? "true" : "false"}>
      {/* Far layer — faint purple silhouettes */}
      <div className="cyber-skyline-far">
        <BuildingRow pattern={FAR_PATTERN} fill="#1a0a2a" stripe="#9d00ff" windowColor="#21e7ff" />
      </div>
      {/* Mid layer — magenta-edged mid buildings */}
      <div className="cyber-skyline-mid">
        <BuildingRow pattern={MID_PATTERN} fill="#0e0720" stripe="#ff2bd6" windowColor="#ff7ae2" />
      </div>
      {/* Near layer — foreground rooftops, cyan windows */}
      <div className="cyber-skyline-near">
        <BuildingRow pattern={NEAR_PATTERN} fill="#05040d" stripe="#21e7ff" windowColor="#21e7ff" />
      </div>
      {/* Horizon neon glow */}
      <div className="cyber-horizon-glow" aria-hidden="true" />

      <style>{`
        .cyber-skyline-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          isolation: isolate;
          z-index: 2;
          opacity: 0;
          transition: opacity 0.8s ease-out;
          overflow: hidden;
          clip-path: inset(36% 0 0 0);
          /* Reserve space at the bottom for the drum holo-cards rendered on
             the canvas (useCyberpunkScene groundReserve ~138px). Buildings
             anchor to this line instead of the viewport bottom so the drum
             row stays visible and tappable. */
          --drum-reserve: 170px;
        }
        @media (max-width: 480px) {
          .cyber-skyline-overlay { clip-path: inset(44% 0 0 0); --drum-reserve: 180px; }
        }
        .cyber-skyline-overlay[data-visible="true"] { opacity: 1; }

        .cyber-skyline-far,
        .cyber-skyline-mid,
        .cyber-skyline-near {
          position: absolute;
          left: 0; right: 0; bottom: var(--drum-reserve);
          pointer-events: none;
        }
        .cyber-skyline-far svg,
        .cyber-skyline-mid svg,
        .cyber-skyline-near svg {
          width: 100%; height: 100%; display: block;
        }

        .cyber-skyline-far {
          height: 46%;
          z-index: 1;
          opacity: 0.55;
          filter: blur(0.6px) drop-shadow(0 0 8px rgba(157, 0, 255, 0.35));
          animation: cyber-parallax-far 42s linear infinite;
        }
        .cyber-skyline-mid {
          height: 52%;
          z-index: 2;
          opacity: 0.82;
          filter: drop-shadow(0 0 10px rgba(255, 43, 214, 0.35));
          animation: cyber-parallax-mid 28s linear infinite;
        }
        .cyber-skyline-near {
          height: 58%;
          z-index: 3;
          opacity: 1;
          filter: drop-shadow(0 0 14px rgba(33, 231, 255, 0.4));
        }

        .cyber-horizon-glow {
          position: absolute;
          left: 0; right: 0;
          bottom: 36%;
          height: 12%;
          background: linear-gradient(
            to top,
            transparent 0%,
            rgba(255, 43, 214, 0.18) 40%,
            rgba(33, 231, 255, 0.12) 70%,
            transparent 100%
          );
          mix-blend-mode: screen;
          z-index: 1;
          animation: cyber-horizon-pulse 6s ease-in-out infinite;
        }

        @keyframes cyber-parallax-far {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-2%); }
        }
        @keyframes cyber-parallax-mid {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-3.5%); }
        }
        @keyframes cyber-horizon-pulse {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cyber-skyline-far,
          .cyber-skyline-mid,
          .cyber-horizon-glow { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
