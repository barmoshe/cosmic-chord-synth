interface SeaCoralsProps {
  visible: boolean;
}

// Decorative SVG coral clusters pinned along the bottom edge.
// Canvas already simulates the dynamic almogs — this overlay adds large-scale
// coral fans + kelp silhouettes for compositional anchoring.

function CoralFan({ hue }: { hue: string }) {
  return (
    <svg viewBox="0 0 120 140" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id={`fan-${hue}`} x1="0" x2="0" y1="1" y2="0">
          <stop offset="0%"  stopColor={hue} stopOpacity="0.4" />
          <stop offset="100%" stopColor={hue} stopOpacity="0.95" />
        </linearGradient>
      </defs>
      {/* base */}
      <ellipse cx="60" cy="138" rx="26" ry="6" fill="rgba(5,20,32,0.8)" />
      {/* trunk + branches */}
      {[
        { d: "M 60 140 Q 58 110 50 80 Q 42 50 36 20" },
        { d: "M 60 140 Q 62 110 70 80 Q 78 50 84 20" },
        { d: "M 60 140 Q 60 100 60 60 Q 60 30 58 4" },
        { d: "M 60 140 Q 50 100 38 70 Q 28 50 18 30" },
        { d: "M 60 140 Q 70 100 82 70 Q 92 50 102 30" },
      ].map((b, i) => (
        <path
          key={i}
          d={b.d}
          stroke={`url(#fan-${hue})`}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      ))}
      {/* tip bulbs */}
      {[
        { cx: 36, cy: 20 }, { cx: 84, cy: 20 }, { cx: 58, cy: 4 },
        { cx: 18, cy: 30 }, { cx: 102, cy: 30 },
      ].map((b, i) => (
        <circle key={i} cx={b.cx} cy={b.cy} r="3" fill={hue} opacity="0.9" />
      ))}
    </svg>
  );
}

function Kelp() {
  return (
    <svg viewBox="0 0 60 280" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <path
        d="M 30 280 Q 22 220 32 160 Q 42 100 26 50 Q 18 20 30 0"
        stroke="#2d6a4f"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {[
        { cx: 22, cy: 240, r: 6 },
        { cx: 38, cy: 200, r: 7 },
        { cx: 26, cy: 160, r: 6 },
        { cx: 40, cy: 120, r: 7 },
        { cx: 22, cy: 80,  r: 6 },
        { cx: 32, cy: 30,  r: 6 },
      ].map((leaf, i) => (
        <ellipse
          key={i}
          cx={leaf.cx}
          cy={leaf.cy}
          rx={leaf.r}
          ry={leaf.r * 1.6}
          fill="#52b788"
          opacity="0.85"
          transform={`rotate(${i % 2 === 0 ? -25 : 20} ${leaf.cx} ${leaf.cy})`}
        />
      ))}
    </svg>
  );
}

export default function SeaCorals({ visible }: SeaCoralsProps) {
  return (
    <div className="sea-corals-overlay" data-visible={visible ? "true" : "false"}>
      <div className="sea-coral sea-coral-1"><CoralFan hue="#ff6b9d" /></div>
      <div className="sea-coral sea-coral-2"><CoralFan hue="#c77dff" /></div>
      <div className="sea-coral sea-coral-3"><CoralFan hue="#ff8e72" /></div>
      <div className="sea-kelp sea-kelp-1"><Kelp /></div>
      <div className="sea-kelp sea-kelp-2"><Kelp /></div>

      <style>{`
        .sea-corals-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          isolation: isolate;
          z-index: 2;
          opacity: 0;
          transition: opacity 0.6s ease-out;
          overflow: hidden;
          clip-path: inset(50% 0 0 0);
        }
        .sea-corals-overlay[data-visible="true"] { opacity: 1; }

        .sea-coral {
          position: absolute;
          bottom: 1%;
          transform-origin: 50% 100%;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.55));
          animation: coral-sway 5.6s ease-in-out infinite;
        }
        .sea-coral svg { width: 100%; height: 100%; display: block; }
        .sea-coral-1 { left: 4%; width: 90px; animation-duration: 5.2s; }
        .sea-coral-2 { left: 48%; width: 110px; animation-duration: 6.4s; animation-delay: -1.5s; }
        .sea-coral-3 { right: 6%; width: 80px; animation-duration: 7.1s; animation-delay: -2.8s; }

        .sea-kelp {
          position: absolute;
          bottom: 1%;
          transform-origin: 50% 100%;
          opacity: 0.85;
          filter: drop-shadow(0 3px 5px rgba(0,0,0,0.5));
          animation: kelp-sway 8s ease-in-out infinite;
        }
        .sea-kelp svg { width: 100%; height: 100%; display: block; }
        .sea-kelp-1 { left: 26%; width: 50px; height: 38%; animation-duration: 7.2s; }
        .sea-kelp-2 { right: 28%; width: 56px; height: 42%; animation-duration: 9.4s; animation-delay: -3s; }

        @keyframes coral-sway {
          0%, 100% { transform: rotate(-3deg); }
          50%      { transform: rotate(4deg); }
        }
        @keyframes kelp-sway {
          0%, 100% { transform: rotate(-5deg) skewX(-2deg); }
          50%      { transform: rotate(6deg) skewX(3deg); }
        }

        @media (max-width: 480px) {
          .sea-coral-2 { width: 84px; }
          .sea-coral-3 { width: 64px; }
          .sea-kelp-1 { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sea-coral, .sea-kelp { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
