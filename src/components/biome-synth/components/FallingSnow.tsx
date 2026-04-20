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
// foreground parallax. Canvas stays cheap — these ~24 flakes add depth.
const FLAKES: FlakeSlot[] = [
  { left: "6%",  size: 6,  duration: "18s", delay: "-2s",  swayDuration: "4.2s", swayDelay: "0s",    opacity: 0.8 },
  { left: "14%", size: 4,  duration: "24s", delay: "-11s", swayDuration: "5.0s", swayDelay: "-1s",   opacity: 0.55 },
  { left: "22%", size: 9,  duration: "16s", delay: "-5s",  swayDuration: "3.6s", swayDelay: "-2.1s", opacity: 0.85 },
  { left: "30%", size: 5,  duration: "22s", delay: "-14s", swayDuration: "4.8s", swayDelay: "-0.5s", opacity: 0.6 },
  { left: "38%", size: 7,  duration: "19s", delay: "-8s",  swayDuration: "4.0s", swayDelay: "-1.8s", opacity: 0.75 },
  { left: "46%", size: 4,  duration: "26s", delay: "-20s", swayDuration: "5.4s", swayDelay: "-0.2s", opacity: 0.5 },
  { left: "54%", size: 8,  duration: "17s", delay: "-4s",  swayDuration: "3.8s", swayDelay: "-2.4s", opacity: 0.8 },
  { left: "62%", size: 5,  duration: "21s", delay: "-13s", swayDuration: "4.6s", swayDelay: "-1.1s", opacity: 0.65 },
  { left: "70%", size: 9,  duration: "15s", delay: "-6s",  swayDuration: "3.4s", swayDelay: "-2.7s", opacity: 0.9 },
  { left: "78%", size: 4,  duration: "25s", delay: "-16s", swayDuration: "5.2s", swayDelay: "-0.7s", opacity: 0.55 },
  { left: "86%", size: 6,  duration: "20s", delay: "-9s",  swayDuration: "4.4s", swayDelay: "-1.4s", opacity: 0.7 },
  { left: "94%", size: 5,  duration: "23s", delay: "-18s", swayDuration: "4.9s", swayDelay: "-0.3s", opacity: 0.6 },
];

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
            <span className="flake-shell" />
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
          position: absolute; inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle at 40% 35%, rgba(255,255,255,0.95) 0%, rgba(200,230,255,0.55) 55%, rgba(140,180,220,0));
          box-shadow: 0 0 8px rgba(200,230,255,0.6), 0 0 14px rgba(140,243,228,0.25);
        }

        @keyframes flake-fall {
          from { transform: translateY(0); }
          to   { transform: translateY(120vh); }
        }
        @keyframes flake-sway {
          from { margin-left: -10px; }
          to   { margin-left: 10px; }
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
