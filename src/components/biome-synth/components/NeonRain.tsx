interface NeonRainProps {
  visible: boolean;
}

// Procedural-feeling rain streaks via CSS keyframes. Each streak gets a
// deterministic left/delay/duration so the pattern looks dense without JS.
// Purely decorative (pointer-events: none).

const STREAK_COUNT = 56;

const STREAKS = Array.from({ length: STREAK_COUNT }, (_, i) => {
  // Simple LCG-ish scatter so we get a pleasing stable distribution.
  const r1 = ((i * 73) % 100) / 100;
  const r2 = ((i * 37 + 11) % 100) / 100;
  const r3 = ((i * 53 + 29) % 100) / 100;
  return {
    left: r1 * 100,
    delay: -r2 * 1.8,
    duration: 0.55 + r3 * 0.9,
    height: 28 + r1 * 60,
    hue: i % 5 === 0 ? "#ff2bd6" : i % 3 === 0 ? "#9d00ff" : "#21e7ff",
    opacity: 0.25 + r2 * 0.55,
  };
});

export default function NeonRain({ visible }: NeonRainProps) {
  return (
    <div className="cyber-rain-overlay" data-visible={visible ? "true" : "false"}>
      {STREAKS.map((s, i) => (
        <span
          key={i}
          className="cyber-rain-drop"
          style={{
            left: `${s.left}%`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            height: `${s.height}px`,
            background: `linear-gradient(to bottom, transparent 0%, ${s.hue} 65%, #ffffff 100%)`,
            opacity: s.opacity,
            boxShadow: `0 0 6px ${s.hue}`,
          }}
        />
      ))}

      <style>{`
        .cyber-rain-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          opacity: 0;
          transition: opacity 0.8s ease-out;
          overflow: hidden;
        }
        .cyber-rain-overlay[data-visible="true"] { opacity: 1; }

        .cyber-rain-drop {
          position: absolute;
          top: -80px;
          width: 1.5px;
          will-change: transform;
          animation-name: cyber-rain-fall;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
          mix-blend-mode: screen;
        }

        @keyframes cyber-rain-fall {
          0%   { transform: translateY(0); }
          100% { transform: translateY(110vh); }
        }

        @media (max-width: 480px) {
          .cyber-rain-drop:nth-child(2n) { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cyber-rain-overlay { display: none; }
        }
      `}</style>
    </div>
  );
}
