interface PenguinColonyProps {
  visible: boolean;
}

// Foreground DOM penguin standing proud near the edges of the scene. The
// canvas already animates a small roaming flock — these are the static,
// large-scale characters that give the biome its identity. Pairs of adult +
// chick, rocking gently so the scene feels alive.

function Penguin({ chick = false, accent = "#ff9a33" }: { chick?: boolean; accent?: string }) {
  // viewBox: 100x160 for adult, 100x110 for chick. Using CSS width to scale.
  const h = chick ? 110 : 160;
  return (
    <svg viewBox={`0 0 100 ${h}`} aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id={`body-${chick ? "c" : "a"}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#2d3547" />
          <stop offset="70%" stopColor="#141925" />
          <stop offset="100%" stopColor="#0a0d15" />
        </linearGradient>
        <linearGradient id={`belly-${chick ? "c" : "a"}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e5f0f8" />
        </linearGradient>
      </defs>

      {chick ? (
        <>
          {/* Chick — fluffier, rounder, grey */}
          <ellipse cx="50" cy={h - 6} rx="28" ry="5" fill="rgba(60,100,140,0.35)" />
          {/* feet */}
          <ellipse cx="40" cy={h - 8} rx="7" ry="3.5" fill={accent} />
          <ellipse cx="60" cy={h - 8} rx="7" ry="3.5" fill={accent} />
          {/* body (fluffy grey) */}
          <ellipse cx="50" cy={h - 40} rx="30" ry="40" fill="#8a95a8" />
          {/* belly */}
          <ellipse cx="50" cy={h - 34} rx="20" ry="30" fill="url(#belly-c)" />
          {/* head */}
          <circle cx="50" cy={h - 84} r="26" fill="#8a95a8" />
          {/* cheek lighter */}
          <ellipse cx="50" cy={h - 82} rx="18" ry="14" fill="#c9d1de" />
          {/* eyes */}
          <circle cx="42" cy={h - 88} r="2.6" fill="#0b0f18" />
          <circle cx="58" cy={h - 88} r="2.6" fill="#0b0f18" />
          <circle cx="43" cy={h - 89} r="0.8" fill="#ffffff" />
          <circle cx="59" cy={h - 89} r="0.8" fill="#ffffff" />
          {/* beak */}
          <polygon points={`44,${h - 78} 56,${h - 78} 50,${h - 72}`} fill={accent} />
        </>
      ) : (
        <>
          {/* Adult — classic emperor silhouette */}
          <ellipse cx="50" cy={h - 4} rx="32" ry="5" fill="rgba(60,100,140,0.45)" />
          {/* feet */}
          <ellipse cx="38" cy={h - 6} rx="9"  ry="4" fill={accent} />
          <ellipse cx="62" cy={h - 6} rx="9"  ry="4" fill={accent} />
          {/* tail */}
          <polygon points={`30,${h - 20} 50,${h - 10} 70,${h - 20}`} fill="#0a0d15" />
          {/* body */}
          <path
            d={`M 22 ${h - 80}
                C 22 ${h - 130}, 78 ${h - 130}, 78 ${h - 80}
                C 78 ${h - 22}, 22 ${h - 22}, 22 ${h - 80} Z`}
            fill={`url(#body-a)`}
          />
          {/* belly */}
          <path
            d={`M 32 ${h - 82}
                C 32 ${h - 120}, 68 ${h - 120}, 68 ${h - 82}
                C 68 ${h - 30}, 32 ${h - 30}, 32 ${h - 82} Z`}
            fill={`url(#belly-a)`}
          />
          {/* head */}
          <circle cx="50" cy={h - 128} r="22" fill="#141925" />
          {/* cheek golden patch — emperor penguin look */}
          <path
            d="M 30 36 Q 44 24 54 34 Q 48 46 38 44 Z"
            transform={`translate(0, ${h - 160})`}
            fill="#ffd778"
            opacity="0.85"
          />
          {/* eye */}
          <circle cx="58" cy={h - 130} r="3"   fill="#ffffff" />
          <circle cx="59" cy={h - 130} r="1.6" fill="#0b0f18" />
          {/* beak */}
          <polygon points={`66,${h - 128} 82,${h - 124} 66,${h - 120}`} fill={accent} />
          <line x1={`66`} y1={`${h - 124}`} x2={`82`} y2={`${h - 124}`} stroke="rgba(180,90,10,0.5)" strokeWidth="0.8" />
          {/* flipper */}
          <ellipse cx="21" cy={h - 82} rx="7" ry="22" fill="#0a0d15" transform={`rotate(-10 21 ${h - 82})`} />
        </>
      )}
    </svg>
  );
}

export default function PenguinColony({ visible }: PenguinColonyProps) {
  return (
    <div className="penguin-colony-overlay" data-visible={visible ? "true" : "false"} aria-hidden="true">
      <div className="penguin penguin-1"><Penguin /></div>
      <div className="penguin penguin-2"><Penguin chick /></div>
      <div className="penguin penguin-3"><Penguin /></div>
      <div className="penguin penguin-4"><Penguin chick /></div>

      <style>{`
        .penguin-colony-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          isolation: isolate;
          z-index: 4;
          opacity: 0;
          transition: opacity 0.8s ease-out;
          overflow: hidden;
        }
        .penguin-colony-overlay[data-visible="true"] { opacity: 1; }

        .penguin {
          position: absolute;
          bottom: 2%;
          transform-origin: 50% 100%;
          filter: drop-shadow(0 6px 10px rgba(30,60,100,0.35));
          animation: penguin-waddle 2.4s ease-in-out infinite alternate;
          will-change: transform;
        }
        .penguin svg { width: 100%; height: 100%; display: block; }

        .penguin-1 { left: 2%;   width: 120px; animation-duration: 2.6s; }
        .penguin-2 { left: 12%;  width: 70px;  animation-duration: 2.1s; animation-delay: -0.8s; bottom: 1.5%; }
        .penguin-3 { right: 4%;  width: 130px; animation-duration: 2.8s; animation-delay: -1.2s; }
        .penguin-4 { right: 15%; width: 72px;  animation-duration: 2.3s; animation-delay: -0.4s; bottom: 1.5%; }

        @keyframes penguin-waddle {
          0%   { transform: translateY(0)    rotate(-2deg); }
          50%  { transform: translateY(-2px) rotate(0deg); }
          100% { transform: translateY(0)    rotate(2deg); }
        }

        @media (max-width: 640px) {
          .penguin-1 { width: 84px; }
          .penguin-2 { width: 52px; }
          .penguin-3 { width: 90px; }
          .penguin-4 { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .penguin { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
