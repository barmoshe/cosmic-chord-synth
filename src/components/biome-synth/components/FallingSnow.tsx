interface FallingSnowProps {
  visible: boolean;
}

interface FlakeSlot {
  left: string;
  size: number;
  duration: string;
  delay: string;
  swayDuration: string;
  swayDelay: string;
  opacity: number;
}

// DOM layer of large drifting snowflakes, layered over the canvas snow for
// foreground parallax. Canvas stays cheap — these large DOM flakes add depth
// and a real feel of snowfall in front of the scene.
const FLAKES: FlakeSlot[] = [
  { left: "3%",  size: 10, duration: "14s", delay: "-2s",   swayDuration: "4.2s", swayDelay: "0s",    opacity: 0.95 },
  { left: "9%",  size: 6,  duration: "22s", delay: "-11s",  swayDuration: "5.0s", swayDelay: "-1s",   opacity: 0.6 },
  { left: "15%", size: 12, duration: "12s", delay: "-5s",   swayDuration: "3.6s", swayDelay: "-2.1s", opacity: 1 },
  { left: "22%", size: 7,  duration: "19s", delay: "-14s",  swayDuration: "4.8s", swayDelay: "-0.5s", opacity: 0.7 },
  { left: "30%", size: 9,  duration: "16s", delay: "-8s",   swayDuration: "4.0s", swayDelay: "-1.8s", opacity: 0.85 },
  { left: "37%", size: 5,  duration: "24s", delay: "-20s",  swayDuration: "5.4s", swayDelay: "-0.2s", opacity: 0.55 },
  { left: "45%", size: 11, duration: "13s", delay: "-4s",   swayDuration: "3.8s", swayDelay: "-2.4s", opacity: 0.95 },
  { left: "52%", size: 7,  duration: "20s", delay: "-13s",  swayDuration: "4.6s", swayDelay: "-1.1s", opacity: 0.7 },
  { left: "60%", size: 13, duration: "11s", delay: "-6s",   swayDuration: "3.4s", swayDelay: "-2.7s", opacity: 1 },
  { left: "67%", size: 6,  duration: "23s", delay: "-16s",  swayDuration: "5.2s", swayDelay: "-0.7s", opacity: 0.6 },
  { left: "74%", size: 9,  duration: "17s", delay: "-9s",   swayDuration: "4.4s", swayDelay: "-1.4s", opacity: 0.8 },
  { left: "81%", size: 7,  duration: "21s", delay: "-18s",  swayDuration: "4.9s", swayDelay: "-0.3s", opacity: 0.7 },
  { left: "88%", size: 11, duration: "15s", delay: "-7s",   swayDuration: "3.9s", swayDelay: "-2s",   opacity: 0.9 },
  { left: "95%", size: 6,  duration: "25s", delay: "-19s",  swayDuration: "5.1s", swayDelay: "-1.5s", opacity: 0.6 },
];

const FLAKE_GLYPH = (
  <svg viewBox="-10 -10 20 20" aria-hidden="true" width="100%" height="100%">
    <g fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round">
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        return (
          <g key={i}>
            <line x1="0" y1="0" x2={cos * 9} y2={sin * 9} />
            <line
              x1={cos * 5} y1={sin * 5}
              x2={cos * 5 + Math.cos(a + 0.6) * 3}
              y2={sin * 5 + Math.sin(a + 0.6) * 3}
            />
            <line
              x1={cos * 5} y1={sin * 5}
              x2={cos * 5 + Math.cos(a - 0.6) * 3}
              y2={sin * 5 + Math.sin(a - 0.6) * 3}
            />
          </g>
        );
      })}
    </g>
  </svg>
);

export default function FallingSnow({ visible }: FallingSnowProps) {
  return (
    <div className="falling-snow-overlay" data-visible={visible ? "true" : "false"} aria-hidden="true">
      {FLAKES.map((f, i) => (
        <div
          key={i}
          className="falling-flake"
          style={{
            left: f.left,
            width: `${f.size}px`,
            height: `${f.size}px`,
            opacity: f.opacity,
            animationDuration: f.duration,
            animationDelay: f.delay,
          }}
        >
          <div
            className="falling-flake-sway"
            style={{
              animationDuration: f.swayDuration,
              animationDelay: f.swayDelay,
            }}
          >
            <span className="flake-shell">{FLAKE_GLYPH}</span>
          </div>
        </div>
      ))}

      <style>{`
        .falling-snow-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 5;
          opacity: 0;
          transition: opacity 0.8s ease-out;
          overflow: hidden;
        }
        .falling-snow-overlay[data-visible="true"] { opacity: 1; }

        .falling-flake {
          position: absolute;
          top: -5%;
          animation-name: flake-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          filter: drop-shadow(0 0 3px rgba(255,255,255,0.85));
          will-change: transform;
        }
        .falling-flake-sway {
          width: 100%;
          height: 100%;
          animation-name: flake-sway;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }
        .flake-shell {
          display: block;
          width: 100%;
          height: 100%;
        }
        .flake-shell svg { display: block; }

        @keyframes flake-fall {
          from { transform: translateY(0); }
          to   { transform: translateY(120vh) rotate(360deg); }
        }
        @keyframes flake-sway {
          from { margin-left: -12px; }
          to   { margin-left: 12px; }
        }

        @media (max-width: 480px) {
          .falling-flake:nth-child(2n) { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .falling-flake, .falling-flake-sway { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
