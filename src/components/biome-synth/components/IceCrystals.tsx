interface IceCrystalsProps {
  visible: boolean;
}

// Foreground ice-crystal silhouettes anchored to the bottom edge. Pairs with
// the canvas glaciers behind — these are the close-up shards, slowly breathing.

function Shard({ hue }: { hue: string }) {
  return (
    <svg viewBox="0 0 100 160" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id={`shard-${hue}`} x1="0" x2="0" y1="1" y2="0">
          <stop offset="0%"  stopColor={hue} stopOpacity="0.85" />
          <stop offset="100%" stopColor="#eaf6ff" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      {/* base */}
      <ellipse cx="50" cy="158" rx="30" ry="5" fill="rgba(5,16,30,0.85)" />
      {/* three stacked ice spires */}
      <polygon
        points="50,6 72,110 50,158 28,110"
        fill={`url(#shard-${hue})`}
        stroke={hue}
        strokeWidth="1"
        strokeOpacity="0.6"
      />
      <polygon
        points="28,40 42,120 28,158 16,120"
        fill={`url(#shard-${hue})`}
        opacity="0.75"
      />
      <polygon
        points="72,50 84,124 72,158 62,124"
        fill={`url(#shard-${hue})`}
        opacity="0.7"
      />
      {/* tip glints */}
      <circle cx="50" cy="8"  r="2.2" fill="#ffffff" opacity="0.9" />
      <circle cx="28" cy="42" r="1.6" fill="#ffffff" opacity="0.8" />
      <circle cx="72" cy="52" r="1.6" fill="#ffffff" opacity="0.8" />
    </svg>
  );
}

export default function IceCrystals({ visible }: IceCrystalsProps) {
  return (
    <div className="ice-crystals-overlay" data-visible={visible ? "true" : "false"} aria-hidden="true">
      <div className="ice-shard ice-shard-1"><Shard hue="#8cf3e4" /></div>
      <div className="ice-shard ice-shard-2"><Shard hue="#6bd9ff" /></div>
      <div className="ice-shard ice-shard-3"><Shard hue="#b58cff" /></div>
      <div className="ice-shard ice-shard-4"><Shard hue="#a5f5d0" /></div>

      <style>{`
        .ice-crystals-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          isolation: isolate;
          z-index: 2;
          opacity: 0;
          transition: opacity 0.7s ease-out;
          overflow: hidden;
          clip-path: inset(55% 0 0 0);
        }
        .ice-crystals-overlay[data-visible="true"] { opacity: 1; }

        .ice-shard {
          position: absolute;
          bottom: 1%;
          transform-origin: 50% 100%;
          filter: drop-shadow(0 0 10px rgba(140,243,228,0.45)) drop-shadow(0 3px 6px rgba(0,0,0,0.55));
          animation: shard-breathe 6s ease-in-out infinite alternate;
          will-change: transform, opacity;
        }
        .ice-shard svg { width: 100%; height: 100%; display: block; }
        .ice-shard-1 { left: 3%;  width: 90px;  animation-duration: 5.4s; }
        .ice-shard-2 { left: 30%; width: 120px; animation-duration: 6.8s; animation-delay: -1.4s; }
        .ice-shard-3 { right: 28%; width: 105px; animation-duration: 7.4s; animation-delay: -2.6s; }
        .ice-shard-4 { right: 4%;  width: 80px;  animation-duration: 5.8s; animation-delay: -3.8s; }

        @keyframes shard-breathe {
          0%   { transform: translateY(0)    scaleY(1);    opacity: 0.9; }
          100% { transform: translateY(-3px) scaleY(1.04); opacity: 1; }
        }

        @media (max-width: 480px) {
          .ice-shard-2 { width: 92px; }
          .ice-shard-3 { width: 76px; }
          .ice-shard-4 { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ice-shard { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
