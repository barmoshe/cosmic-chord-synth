interface FloatingBananasProps {
  visible: boolean;
}

interface BananaSlot {
  top: string;
  size: number;
  duration: string;
  delay: string;
  bobDuration: string;
  bobDelay: string;
  rotateStart: number;
  rotateEnd: number;
  opacity: number;
  /** Which peel cycle variant — different timings per banana so the herd
   *  visibly peels + re-peels out of phase. */
  peelDuration: string;
  peelDelay: string;
}

// Top band of drifting bananas — each cycles from just off the left edge to
// just off the right edge while gently bobbing on the Y axis, like banana
// leaves blown off the canopy. Sizes + speeds are staggered to create depth.
const BANANAS: BananaSlot[] = [
  { top: "1%",  size: 64, duration: "38s", delay: "-4s",  bobDuration: "5.2s", bobDelay: "0s",    rotateStart: -18, rotateEnd: 12,  opacity: 0.95, peelDuration: "6.4s",  peelDelay: "0s"    },
  { top: "3%",  size: 42, duration: "46s", delay: "-18s", bobDuration: "6.4s", bobDelay: "-1.2s", rotateStart: 24,  rotateEnd: -16, opacity: 0.8,  peelDuration: "7.8s",  peelDelay: "-2s"   },
  { top: "5%",  size: 72, duration: "32s", delay: "-10s", bobDuration: "4.6s", bobDelay: "-2s",   rotateStart: -8,  rotateEnd: 28,  opacity: 1.0,  peelDuration: "5.6s",  peelDelay: "-4s"   },
  { top: "32%", size: 48, duration: "52s", delay: "-30s", bobDuration: "5.8s", bobDelay: "-0.4s", rotateStart: 14,  rotateEnd: -22, opacity: 0.85, peelDuration: "9.2s",  peelDelay: "-3.4s" },
  { top: "38%", size: 56, duration: "42s", delay: "-24s", bobDuration: "5.0s", bobDelay: "-3s",   rotateStart: -26, rotateEnd: 18,  opacity: 0.9,  peelDuration: "6.8s",  peelDelay: "-1s"   },
  { top: "2%",  size: 38, duration: "58s", delay: "-40s", bobDuration: "7.2s", bobDelay: "-2.6s", rotateStart: 6,   rotateEnd: -32, opacity: 0.7,  peelDuration: "8.4s",  peelDelay: "-5s"   },
];

// Anatomical crescent — built from a single closed path inspired by the
// Cavendish profile common in minimalist vector banana references
// (SVGRepo, Vecteezy, FreeSVG). Three ridge lines give the fruit its
// characteristic "seam" appearance, plus a calyx + stem + ripe spots +
// a glossy highlight following the outer curve.
function BananaBody() {
  return (
    <g className="banana-body">
      {/* Cast shadow beneath the fruit */}
      <path
        d="M 14 50 Q 28 22 64 18 Q 102 14 118 34 Q 120 46 108 50 Q 84 44 60 50 Q 34 58 14 50 Z"
        fill="#2a180c"
        opacity="0.28"
        transform="translate(1.5 3)"
      />
      {/* Main body — outer curved crescent */}
      <path
        d="M 12 46 Q 24 16 60 12 Q 102 10 118 30 Q 122 44 110 52 Q 106 40 92 38 Q 72 36 52 44 Q 34 54 22 58 Q 12 54 12 46 Z"
        fill="url(#fb-peel)"
        stroke="#8b6914"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Back ridge (deeper shadow, wraps the inside of the curve) */}
      <path
        d="M 18 46 Q 26 32 44 28 Q 68 24 96 32"
        stroke="#b8881c"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
      {/* Centre ridge */}
      <path
        d="M 22 40 Q 38 22 68 20 Q 96 20 112 32"
        stroke="#d4a817"
        strokeWidth="0.9"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
      {/* Glossy top-light highlight */}
      <path
        d="M 26 30 Q 46 14 78 14 Q 100 16 114 28"
        stroke="#fff8b0"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      {/* Ripe freckles — small amber dots scattered along the belly */}
      <circle cx="40"  cy="46" r="0.9" fill="#7a4a10" opacity="0.6" />
      <circle cx="58"  cy="50" r="0.7" fill="#7a4a10" opacity="0.5" />
      <circle cx="76"  cy="48" r="1.0" fill="#7a4a10" opacity="0.55" />
      <circle cx="92"  cy="46" r="0.8" fill="#7a4a10" opacity="0.6" />
      {/* Blossom-end bruise (the tip at left) */}
      <ellipse cx="14" cy="48" rx="3.2" ry="2.2" fill="#5a3220" opacity="0.7" />
      {/* Stem + calyx at the top-right */}
      <path
        d="M 118 30 Q 124 22 128 22"
        stroke="#5a3220"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="120" cy="28" rx="4" ry="2.6" fill="#3c2010" />
    </g>
  );
}

// Peel flap — a leaf-like triangular segment that pivots from the stem to
// simulate a peel opening and closing on a slow cycle. Uses transform-origin
// at the stem base (x:118,y:30 in viewBox units) so the flap swings outward
// like a real banana peel being pulled back.
function BananaPeelFlap() {
  return (
    <g className="banana-peel-flap">
      <path
        d="M 118 30 Q 126 8 108 6 Q 94 8 98 22 Q 106 28 118 30 Z"
        fill="#fff085"
        stroke="#8b6914"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Inner cream — the revealed fruit flesh under the peel tip */}
      <path
        d="M 112 14 Q 118 10 120 16"
        stroke="#fef3c7"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

function BananaGlyph() {
  return (
    <svg viewBox="0 0 140 72" aria-hidden="true">
      <defs>
        <linearGradient id="fb-peel" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor="#fff59d" />
          <stop offset="35%"  stopColor="#ffe14d" />
          <stop offset="75%"  stopColor="#facc15" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>
      <BananaBody />
      <BananaPeelFlap />
    </svg>
  );
}

export default function FloatingBananas({ visible }: FloatingBananasProps) {
  return (
    <div className="floating-bananas-overlay" data-visible={visible ? "true" : "false"}>
      {BANANAS.map((b, i) => (
        <div
          key={i}
          className="floating-banana"
          style={{
            top: b.top,
            width: `${b.size}px`,
            opacity: b.opacity,
            animationDuration: b.duration,
            animationDelay: b.delay,
          }}
        >
          <div
            className="floating-banana-bob"
            style={{
              animationDuration: b.bobDuration,
              animationDelay: b.bobDelay,
              ['--rot-start' as string]: `${b.rotateStart}deg`,
              ['--rot-end' as string]: `${b.rotateEnd}deg`,
              ['--peel-duration' as string]: b.peelDuration,
              ['--peel-delay' as string]: b.peelDelay,
            }}
          >
            <BananaGlyph />
          </div>
        </div>
      ))}

      <style>{`
        .floating-bananas-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 4;
          opacity: 0;
          transition: opacity 0.8s ease-out;
          overflow: hidden;
        }
        .floating-bananas-overlay[data-visible="true"] { opacity: 1; }

        .floating-banana {
          position: absolute;
          left: 0;
          animation-name: banana-drift;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
          filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.5));
        }

        .floating-banana-bob {
          animation-name: banana-bob;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }

        .floating-banana-bob svg {
          width: 100%;
          height: auto;
          display: block;
        }

        /* Drift: just off the left edge (-12vw) to past the right (112vw). */
        @keyframes banana-drift {
          from { transform: translateX(-12vw); }
          to   { transform: translateX(112vw); }
        }

        /* Bob + rotate: gentle vertical wobble + slow tumble within a range
           so each banana keeps its own character instead of spinning uniformly. */
        @keyframes banana-bob {
          from { transform: translateY(-6px) rotate(var(--rot-start, -10deg)); }
          to   { transform: translateY( 6px) rotate(var(--rot-end,   10deg)); }
        }

        /* ── Sprite-style peel animation ──
           Frame-stepped via steps(4) so the peel flap snaps open → half-open
           → fully open → closed, mirroring the 4-frame banana cycle baked
           into /public/fruits.svg row 3. The flap pivots at (118,30) in the
           SVG's own coordinate space, which is the stem base. */
        .banana-peel-flap {
          transform-origin: 118px 30px;
          animation-name: banana-peel;
          animation-duration: var(--peel-duration, 6s);
          animation-delay: var(--peel-delay, 0s);
          animation-timing-function: steps(4, jump-none);
          animation-iteration-count: infinite;
        }
        @keyframes banana-peel {
          0%   { transform: rotate(0deg)    translate(0 0); }
          25%  { transform: rotate(-22deg)  translate(-1px -3px); }
          50%  { transform: rotate(-46deg)  translate(-3px -6px); }
          75%  { transform: rotate(-72deg)  translate(-6px -9px); }
          100% { transform: rotate(0deg)    translate(0 0); }
        }

        /* Banana body subtly squashes in sync with the peel for a soft
           "ripening breath" — keeps the scene feeling alive even between peels. */
        .banana-body {
          transform-origin: 64px 40px;
          animation-name: banana-breathe;
          animation-duration: var(--peel-duration, 6s);
          animation-delay: var(--peel-delay, 0s);
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes banana-breathe {
          0%, 100% { transform: scale(1, 1); }
          50%      { transform: scale(1.03, 0.97); }
        }

        /* Mobile — thin the herd so the top band doesn't get busy on small
           screens. Keeps the 3 largest bananas, hides the smaller distant ones. */
        @media (max-width: 480px) {
          .floating-banana:nth-child(2),
          .floating-banana:nth-child(4),
          .floating-banana:nth-child(6) { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .floating-banana,
          .floating-banana-bob,
          .banana-peel-flap,
          .banana-body { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
