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
}

// Top band of drifting bananas — each cycles from just off the left edge to
// just off the right edge while gently bobbing on the Y axis, like banana
// leaves blown off the canopy. Sizes + speeds are staggered to create depth.
const BANANAS: BananaSlot[] = [
  { top: "1%",  size: 54, duration: "38s", delay: "-4s",  bobDuration: "5.2s", bobDelay: "0s",    rotateStart: -18, rotateEnd: 12,  opacity: 0.95 },
  { top: "3%",  size: 36, duration: "46s", delay: "-18s", bobDuration: "6.4s", bobDelay: "-1.2s", rotateStart: 24,  rotateEnd: -16, opacity: 0.8  },
  { top: "5%",  size: 62, duration: "32s", delay: "-10s", bobDuration: "4.6s", bobDelay: "-2s",   rotateStart: -8,  rotateEnd: 28,  opacity: 1.0  },
  { top: "32%", size: 42, duration: "52s", delay: "-30s", bobDuration: "5.8s", bobDelay: "-0.4s", rotateStart: 14,  rotateEnd: -22, opacity: 0.8  },
  { top: "38%", size: 48, duration: "42s", delay: "-24s", bobDuration: "5.0s", bobDelay: "-3s",   rotateStart: -26, rotateEnd: 18,  opacity: 0.85 },
  { top: "2%",  size: 32, duration: "58s", delay: "-40s", bobDuration: "7.2s", bobDelay: "-2.6s", rotateStart: 6,   rotateEnd: -32, opacity: 0.7  },
];

function BananaGlyph() {
  return (
    <svg viewBox="0 0 80 40" aria-hidden="true">
      <defs>
        <linearGradient id="fb-peel" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#fff59d" />
          <stop offset="45%" stopColor="#ffe14d" />
          <stop offset="100%" stopColor="#d4a817" />
        </linearGradient>
      </defs>
      {/* Shadow */}
      <path
        d="M 4 18 Q 24 -4 62 6 Q 72 10 74 16 Q 66 10 52 10 Q 26 8 8 22 Z"
        fill="#3c2010"
        opacity="0.35"
        transform="translate(1.5 2)"
      />
      {/* Banana body */}
      <path
        d="M 4 18 Q 24 -4 62 6 Q 72 10 74 16 Q 66 10 52 10 Q 26 8 8 22 Z"
        fill="url(#fb-peel)"
        stroke="#8b6914"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Stem */}
      <path
        d="M 62 6 Q 66 2 70 3"
        stroke="#5a3220"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tip browning */}
      <circle cx="6" cy="19.5" r="2.2" fill="#6b3b1e" opacity="0.7" />
      {/* Highlight */}
      <path
        d="M 18 10 Q 36 2 56 6"
        stroke="#fff8b0"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
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
          filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.45));
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

        /* Drift: just off the left edge (-12%) to past the right (112%). */
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

        /* Mobile — thin the herd so the top band doesn't get busy on small
           screens. Keeps the 3 largest bananas, hides the smaller distant ones. */
        @media (max-width: 480px) {
          .floating-banana:nth-child(2),
          .floating-banana:nth-child(4),
          .floating-banana:nth-child(6) { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .floating-banana,
          .floating-banana-bob { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
