interface SwimmingFishProps {
  visible: boolean;
}

interface FishSlot {
  top: string;
  size: number;
  duration: string;
  delay: string;
  bobDuration: string;
  bobDelay: string;
  opacity: number;
  flip?: boolean;
  hue: string;
}

// Distant DOM-layer fish silhouettes drifting across the underwater band.
// The canvas boids handle the close/mid school; this overlay adds depth.
const FISH: FishSlot[] = [
  { top: "32%", size: 28, duration: "44s", delay: "-10s", bobDuration: "5.2s", bobDelay: "0s",    opacity: 0.55, hue: "#7ae582" },
  { top: "44%", size: 22, duration: "58s", delay: "-30s", bobDuration: "6.6s", bobDelay: "-2s",   opacity: 0.4,  flip: true, hue: "#6cd9ff" },
  { top: "52%", size: 36, duration: "38s", delay: "-6s",  bobDuration: "4.8s", bobDelay: "-1s",   opacity: 0.5,  hue: "#a8e6cf" },
  { top: "60%", size: 18, duration: "62s", delay: "-40s", bobDuration: "7.4s", bobDelay: "-3s",   opacity: 0.35, flip: true, hue: "#7ae582" },
  { top: "68%", size: 32, duration: "48s", delay: "-22s", bobDuration: "5.8s", bobDelay: "-0.4s", opacity: 0.5,  hue: "#6cd9ff" },
];

function FishGlyph({ hue }: { hue: string }) {
  return (
    <svg viewBox="0 0 60 26" aria-hidden="true">
      <defs>
        <linearGradient id={`fish-${hue}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={hue} stopOpacity="0.95" />
          <stop offset="100%" stopColor={hue} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <ellipse cx="28" cy="13" rx="20" ry="8" fill={`url(#fish-${hue})`} />
      <path d="M 8 13 L 0 6 L 0 20 Z" fill={hue} opacity="0.85" />
      <circle cx="42" cy="11" r="1.4" fill="rgba(0,0,0,0.7)" />
      <path d="M 28 8 Q 40 4 46 6" stroke={hue} strokeWidth="1" fill="none" opacity="0.6" />
    </svg>
  );
}

export default function SwimmingFish({ visible }: SwimmingFishProps) {
  return (
    <div className="swimming-fish-overlay" data-visible={visible ? "true" : "false"}>
      {FISH.map((f, i) => (
        <div
          key={i}
          className="swimming-fish"
          style={{
            top: f.top,
            width: `${f.size}px`,
            opacity: f.opacity,
            animationDuration: f.duration,
            animationDelay: f.delay,
          }}
        >
          <div
            className="swimming-fish-bob"
            style={{
              animationDuration: f.bobDuration,
              animationDelay: f.bobDelay,
              transform: f.flip ? "scaleX(-1)" : undefined,
            }}
          >
            <FishGlyph hue={f.hue} />
          </div>
        </div>
      ))}

      <style>{`
        .swimming-fish-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 3;
          opacity: 0;
          transition: opacity 0.8s ease-out;
          overflow: hidden;
          /* keep silhouettes inside the underwater band */
          clip-path: inset(20% 0 18% 0);
        }
        .swimming-fish-overlay[data-visible="true"] { opacity: 1; }

        .swimming-fish {
          position: absolute;
          left: 0;
          animation-name: fish-drift;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)) blur(0.5px);
        }
        .swimming-fish-bob {
          animation-name: fish-bob;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }
        .swimming-fish-bob svg { width: 100%; height: auto; display: block; }

        @keyframes fish-drift {
          from { transform: translateX(-12vw); }
          to   { transform: translateX(112vw); }
        }
        @keyframes fish-bob {
          from { transform: translateY(-6px); }
          to   { transform: translateY(6px); }
        }

        @media (max-width: 480px) {
          .swimming-fish:nth-child(2),
          .swimming-fish:nth-child(4) { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .swimming-fish, .swimming-fish-bob { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
