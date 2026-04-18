interface JungleFloraProps {
  visible: boolean;
}

// Inline SVG flora for the jungle theme — coconut palms, banana plants, and
// ground fruit scattered across three parallax layers (far/mid/near). Sits
// below JumpingMonkeys (z:3) but above the canvas, fading in with the play
// phase just like the monkey overlay.

function CoconutPalm() {
  return (
    <svg viewBox="0 0 180 440" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="palm-trunk" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%"  stopColor="#2a180c" />
          <stop offset="55%" stopColor="#5a3220" />
          <stop offset="100%" stopColor="#3c2010" />
        </linearGradient>
      </defs>

      {/* Trunk — gentle S-curve with bark bands */}
      <path
        d="M 86 440 Q 70 340 92 230 Q 114 130 96 50"
        stroke="url(#palm-trunk)"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
      {[410, 360, 310, 260, 210, 160, 110].map((y, i) => (
        <line
          key={i}
          x1={i % 2 === 0 ? 80 : 90}
          y1={y}
          x2={i % 2 === 0 ? 100 : 110}
          y2={y - 3}
          stroke="#1a0e06"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
      ))}

      {/* Fronds — 7 arcs radiating from the crown */}
      {[
        { d: "M 96 50 Q 40 30 8 70",   stroke: "#0c2a1b", rot: 0 },
        { d: "M 96 50 Q 160 32 180 78", stroke: "#0c2a1b", rot: 0 },
        { d: "M 96 50 Q 30 60 0 120",  stroke: "#206d44", rot: 0 },
        { d: "M 96 50 Q 168 58 178 128", stroke: "#206d44", rot: 0 },
        { d: "M 96 50 Q 50 18 62 -6",  stroke: "#2d8f5a", rot: 0 },
        { d: "M 96 50 Q 140 22 134 -4", stroke: "#2d8f5a", rot: 0 },
        { d: "M 96 50 Q 96 10 92 -10", stroke: "#206d44", rot: 0 },
      ].map((f, i) => (
        <path
          key={i}
          d={f.d}
          stroke={f.stroke}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
      ))}

      {/* Leaflets — short lines hinting at feathered palm fronds */}
      {[
        [60, 36, 48, 28], [44, 40, 32, 30], [28, 50, 18, 40],
        [132, 36, 144, 28], [148, 40, 160, 30], [164, 50, 174, 40],
        [50, 60, 38, 58], [30, 80, 14, 78],
        [142, 60, 154, 58], [162, 80, 178, 78],
        [72, 24, 66, 10], [120, 24, 126, 10],
      ].map((pt, i) => (
        <line
          key={i}
          x1={pt[0]} y1={pt[1]} x2={pt[2]} y2={pt[3]}
          stroke="#143d28"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
      ))}

      {/* Coconut cluster at the crown base */}
      {[
        { cx: 78,  cy: 72 },
        { cx: 96,  cy: 78 },
        { cx: 114, cy: 72 },
      ].map((c, i) => (
        <g key={i}>
          <ellipse cx={c.cx} cy={c.cy} rx="8" ry="9" fill="#3c2010" />
          <ellipse cx={c.cx} cy={c.cy} rx="5" ry="6" fill="#6b3b1e" opacity="0.8" />
          <ellipse cx={c.cx - 2} cy={c.cy - 2} rx="1.6" ry="1.8" fill="#fef3c7" opacity="0.9" />
        </g>
      ))}
    </svg>
  );
}

function PalmSilhouette() {
  return (
    <svg viewBox="0 0 160 420" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <path
        d="M 78 420 Q 62 320 86 220 Q 110 120 90 44"
        stroke="#0c2a1b"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
      {[
        "M 90 44 Q 36 24 6 68",
        "M 90 44 Q 150 26 160 72",
        "M 90 44 Q 28 54 0 116",
        "M 90 44 Q 150 56 158 122",
        "M 90 44 Q 56 12 66 -8",
        "M 90 44 Q 124 16 118 -8",
        "M 90 44 Q 90 6 86 -10",
      ].map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="#143d28"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </svg>
  );
}

function BananaPlant() {
  return (
    <svg viewBox="0 0 160 300" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="banana-leaf" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#2d8f5a" />
          <stop offset="100%" stopColor="#143d28" />
        </linearGradient>
        <linearGradient id="banana-stem" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%"  stopColor="#143d28" />
          <stop offset="50%" stopColor="#2d6a4f" />
          <stop offset="100%" stopColor="#0c2a1b" />
        </linearGradient>
      </defs>

      {/* Pseudo-stem */}
      <path
        d="M 72 300 Q 68 220 76 150 L 88 150 Q 94 220 90 300 Z"
        fill="url(#banana-stem)"
      />

      {/* Leaves — 5 elongated arched blades fanning from the crown */}
      {[
        { d: "M 82 150 Q 20 120 8 40",    rot: 0,  midX1: 82, midY1: 150, midX2: 24, midY2: 80 },
        { d: "M 82 150 Q 142 118 154 42", rot: 0,  midX1: 82, midY1: 150, midX2: 140, midY2: 82 },
        { d: "M 82 150 Q 48 90 36 0",     rot: 0,  midX1: 82, midY1: 150, midX2: 54, midY2: 60 },
        { d: "M 82 150 Q 116 90 128 2",   rot: 0,  midX1: 82, midY1: 150, midX2: 112, midY2: 62 },
        { d: "M 82 150 Q 82 80 82 -10",   rot: 0,  midX1: 82, midY1: 150, midX2: 82, midY2: 30 },
      ].map((leaf, i) => (
        <g key={i}>
          <path
            d={`${leaf.d} Q ${leaf.midX2 + 18} ${leaf.midY2 + 24} 82 150 Z`}
            fill="url(#banana-leaf)"
            opacity="0.92"
          />
          <line
            x1={leaf.midX1} y1={leaf.midY1}
            x2={leaf.midX2} y2={leaf.midY2}
            stroke="#0c2a1b"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>
      ))}

      {/* Banana bunch — 3 tiers of curved fruits hanging from the crown */}
      <g transform="translate(82 152)">
        {/* Tier 1 (top, 4 bananas) */}
        {[-14, -5, 5, 14].map((x, i) => (
          <path
            key={`t1-${i}`}
            d={`M ${x} 0 Q ${x + 2} 18 ${x + 6} 26 Q ${x + 10} 18 ${x + 4} -2 Z`}
            fill="#ffe14d"
            stroke="#8b6914"
            strokeWidth="1"
          />
        ))}
        {/* Tier 2 (middle, 3 bananas, offset) */}
        <g transform="translate(0 16)">
          {[-9, 0, 9].map((x, i) => (
            <path
              key={`t2-${i}`}
              d={`M ${x} 0 Q ${x + 2} 20 ${x + 6} 28 Q ${x + 11} 20 ${x + 4} -2 Z`}
              fill="#ffe14d"
              stroke="#8b6914"
              strokeWidth="1"
            />
          ))}
        </g>
        {/* Tier 3 (bottom, 2 bananas) */}
        <g transform="translate(0 32)">
          {[-5, 5].map((x, i) => (
            <path
              key={`t3-${i}`}
              d={`M ${x} 0 Q ${x + 2} 18 ${x + 6} 26 Q ${x + 10} 18 ${x + 4} -2 Z`}
              fill="#ffe14d"
              stroke="#8b6914"
              strokeWidth="1"
            />
          ))}
        </g>
        {/* Purple banana-heart bud at the tip */}
        <path
          d="M -4 60 Q 0 90 4 60 Q 8 74 0 92 Q -8 74 -4 60 Z"
          fill="#6d28d9"
          stroke="#3c1580"
          strokeWidth="1"
        />
        <path
          d="M -3 66 Q 0 80 3 66"
          fill="none"
          stroke="#a855f7"
          strokeWidth="0.8"
          opacity="0.9"
        />
      </g>
    </svg>
  );
}

function CoconutTrio() {
  return (
    <svg viewBox="0 0 90 32" aria-hidden="true">
      {[
        { cx: 18, cy: 20, scale: 1.0 },
        { cx: 44, cy: 22, scale: 1.15 },
        { cx: 70, cy: 20, scale: 0.95 },
      ].map((c, i) => (
        <g key={i} transform={`translate(${c.cx} ${c.cy}) scale(${c.scale})`}>
          <ellipse cx="0" cy="0" rx="11" ry="9" fill="#3c2010" />
          <ellipse cx="0" cy="-1" rx="7" ry="6" fill="#6b3b1e" opacity="0.85" />
          <ellipse cx="-3" cy="-3" rx="1.8" ry="2" fill="#fef3c7" opacity="0.9" />
        </g>
      ))}
    </svg>
  );
}

function BananaPile() {
  return (
    <svg viewBox="0 0 70 28" aria-hidden="true">
      {[
        { x: 8,  y: 20, rot: -12 },
        { x: 22, y: 16, rot: -4 },
        { x: 36, y: 18, rot: 6 },
        { x: 48, y: 14, rot: 14 },
        { x: 56, y: 22, rot: 22 },
      ].map((b, i) => (
        <path
          key={i}
          d="M 0 0 Q 4 -10 14 -10 Q 12 -4 14 0 Q 8 4 0 0 Z"
          transform={`translate(${b.x} ${b.y}) rotate(${b.rot})`}
          fill="#ffe14d"
          stroke="#8b6914"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export default function JungleFlora({ visible }: JungleFloraProps) {
  return (
    <div className="jungle-flora-overlay" data-visible={visible ? "true" : "false"}>
      {/* ── Far layer — darkened silhouettes, partly off-screen for depth ── */}
      <div className="flora-far">
        <div className="flora-palm flora-palm-far flora-palm-far-left">
          <PalmSilhouette />
        </div>
        <div className="flora-palm flora-palm-far flora-palm-far-right">
          <PalmSilhouette />
        </div>
        <div className="flora-banana flora-banana-far">
          <BananaPlant />
        </div>
      </div>

      {/* ── Mid layer — detailed framing palms + banana plant ── */}
      <div className="flora-mid">
        <div className="flora-palm flora-palm-mid-left">
          <CoconutPalm />
        </div>
        <div className="flora-palm flora-palm-mid-right">
          <CoconutPalm />
        </div>
        <div className="flora-banana flora-banana-mid">
          <BananaPlant />
        </div>
      </div>

      {/* ── Near layer — foreground ground fruit ── */}
      <div className="flora-near">
        <div className="flora-coconuts">
          <CoconutTrio />
        </div>
        <div className="flora-banana-pile">
          <BananaPile />
        </div>
      </div>

      <style>{`
        .jungle-flora-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          isolation: isolate;
          z-index: 2;
          opacity: 0;
          transition: opacity 0.6s ease-out;
          overflow: hidden;
          clip-path: inset(44% 0 0 0);
        }
        @media (max-width: 480px) {
          .jungle-flora-overlay { clip-path: inset(50% 0 0 0); }
        }
        .jungle-flora-overlay[data-visible="true"] { opacity: 1; }

        .flora-far, .flora-mid, .flora-near {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .flora-far  { z-index: 1; opacity: 0.55; }
        .flora-mid  { z-index: 2; opacity: 0.9; }
        .flora-near { z-index: 3; opacity: 1; }

        /* Generic palm wrapper */
        .flora-palm {
          position: absolute;
          transform-origin: 50% 100%;
          filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.55));
        }
        .flora-palm svg { width: 100%; height: 100%; display: block; }

        /* Far-layer silhouettes — anchored partly off-screen */
        .flora-palm-far-left {
          left: -4%;
          bottom: 2%;
          height: 58%;
          width: 24%;
          animation: palm-sway 9.2s ease-in-out infinite;
        }
        .flora-palm-far-right {
          right: -3%;
          bottom: 2%;
          height: 54%;
          width: 22%;
          transform: scaleX(-1);
          animation: palm-sway 8.1s ease-in-out infinite -2s;
        }

        /* Mid-layer detailed coconut palms */
        .flora-palm-mid-left {
          left: 3%;
          bottom: 2%;
          height: 56%;
          width: 22%;
          animation: palm-sway 7.4s ease-in-out infinite -1s;
        }
        .flora-palm-mid-right {
          right: 4%;
          bottom: 2%;
          height: 52%;
          width: 20%;
          transform: scaleX(-1);
          animation: palm-sway-mirror 8.6s ease-in-out infinite -3s;
        }

        @keyframes palm-sway {
          0%, 100% { transform: rotate(-2deg); }
          50%      { transform: rotate(3deg); }
        }
        @keyframes palm-sway-mirror {
          0%, 100% { transform: scaleX(-1) rotate(2deg); }
          50%      { transform: scaleX(-1) rotate(-3deg); }
        }

        /* Banana plants */
        .flora-banana {
          position: absolute;
          transform-origin: 50% 100%;
          filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.55));
        }
        .flora-banana svg { width: 100%; height: 100%; display: block; }

        .flora-banana-far {
          right: 36%;
          bottom: 2%;
          height: 24%;
          width: 12%;
          animation: banana-sway 6.4s ease-in-out infinite -1.5s;
        }
        .flora-banana-mid {
          right: 24%;
          bottom: 2%;
          height: 36%;
          width: 16%;
          animation: banana-sway 5.6s ease-in-out infinite;
        }
        @keyframes banana-sway {
          0%, 100% { transform: rotate(-3deg); }
          50%      { transform: rotate(4deg); }
        }

        /* Near-layer ground fruit — static, fills gaps between monkey sprites */
        .flora-coconuts {
          position: absolute;
          left: 48%;
          bottom: 3%;
          width: 78px;
          filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5));
        }
        .flora-coconuts svg { width: 100%; height: auto; display: block; }

        .flora-banana-pile {
          position: absolute;
          left: 14%;
          bottom: 3%;
          width: 60px;
          filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5));
        }
        .flora-banana-pile svg { width: 100%; height: auto; display: block; }

        /* Mobile — thin out the flora to avoid crowding next to monkeys/flowers */
        @media (max-width: 480px) {
          .flora-banana-far,
          .flora-banana-mid { display: none; }
          .flora-palm-mid-left  { height: 46%; width: 26%; }
          .flora-palm-mid-right { height: 42%; width: 24%; }
          .flora-palm-far-left  { height: 48%; width: 28%; }
          .flora-palm-far-right { height: 44%; width: 26%; }
          .flora-banana-pile    { width: 48px; left: 8%; }
          .flora-coconuts       { width: 64px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .flora-palm,
          .flora-banana { animation: none !important; }
          .flora-palm-mid-right,
          .flora-palm-far-right { transform: scaleX(-1); }
        }
      `}</style>
    </div>
  );
}
