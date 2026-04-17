interface JumpingMonkeysProps {
  visible: boolean;
}

type Anim = "jump" | "walk" | "flip";

interface MonkeySlot {
  left: string;
  bottom: string;
  scale: number;
  anim: Anim;
  delay: string;
  speed: string;
  flip?: boolean;
}

/* ── Sprite grid (monkeys.svg) ──
   Sheet is 1024×384, 8 columns × 3 rows of 128px cells.
   Rendered at 128px square → background-size 800% 300%.
   Row 0 (y=0)    → JUMP  · 4 frames ( -0% · -100% · -200% · -300% )
   Row 1 (y=-128) → WALK  · 6 frames ( animates to -600%, row stays at -50% of 200% inner)
   Row 2 (y=-256) → FLIP  · 8 frames ( animates to -800%, full row )                        */

const SLOTS: MonkeySlot[] = [
  // Walking troupe on the ground
  { left: "6%",   bottom: "6%",  scale: 0.9, anim: "walk", delay: "0s",    speed: "1.1s" },
  { left: "22%",  bottom: "5%",  scale: 1.0, anim: "jump", delay: "0.2s",  speed: "0.9s" },
  { left: "42%",  bottom: "7%",  scale: 1.15, anim: "walk", delay: "0.4s", speed: "1.25s", flip: true },
  { left: "62%",  bottom: "4%",  scale: 0.95, anim: "jump", delay: "0.55s", speed: "0.85s" },
  { left: "80%",  bottom: "6%",  scale: 1.0, anim: "walk", delay: "0.7s",  speed: "1.05s" },
  // Showoff flipper in the middle foreground
  { left: "35%",  bottom: "18%", scale: 0.8, anim: "flip", delay: "0.1s",  speed: "1.4s" },
  // High vine-swinger
  { left: "72%",  bottom: "55%", scale: 0.7, anim: "flip", delay: "0.8s",  speed: "1.8s", flip: true },
];

export default function JumpingMonkeys({ visible }: JumpingMonkeysProps) {
  return (
    <div className="jungle-overlay" data-visible={visible ? "true" : "false"}>
      {/* Hanging vines from the canopy */}
      <svg className="jungle-vine jungle-vine-1" viewBox="0 0 80 340" aria-hidden="true">
        <path d="M 40 0 Q 48 60 38 120 Q 28 180 44 240 Q 56 300 40 340" stroke="#143d28" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <ellipse cx="34" cy="90" rx="8" ry="3" fill="#206d44" transform="rotate(-20 34 90)"/>
        <ellipse cx="44" cy="160" rx="9" ry="3.2" fill="#2d8f5a" transform="rotate(25 44 160)"/>
        <ellipse cx="36" cy="230" rx="8" ry="3" fill="#206d44" transform="rotate(-15 36 230)"/>
        <ellipse cx="46" cy="300" rx="9" ry="3.2" fill="#2d8f5a" transform="rotate(30 46 300)"/>
      </svg>
      <svg className="jungle-vine jungle-vine-2" viewBox="0 0 80 380" aria-hidden="true">
        <path d="M 40 0 Q 30 70 42 140 Q 54 220 34 290 Q 24 340 40 380" stroke="#0c2a1b" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <ellipse cx="40" cy="110" rx="10" ry="3.5" fill="#2d6a4f" transform="rotate(15 40 110)"/>
        <ellipse cx="50" cy="190" rx="8" ry="3" fill="#206d44" transform="rotate(-25 50 190)"/>
        <ellipse cx="30" cy="270" rx="10" ry="3.5" fill="#2d6a4f" transform="rotate(20 30 270)"/>
      </svg>

      {/* Back layer trees (silhouette) */}
      <svg className="jungle-tree jungle-tree-back" viewBox="0 0 200 320" aria-hidden="true">
        <path d="M 95 320 L 96 180 Q 86 120 98 70 Q 110 40 106 10 L 114 10 Q 120 40 116 72 L 108 180 L 108 320 Z" fill="#081a11"/>
        <ellipse cx="100" cy="68" rx="58" ry="34" fill="#0e2617"/>
        <ellipse cx="70" cy="88" rx="44" ry="28" fill="#0e2617"/>
        <ellipse cx="132" cy="86" rx="48" ry="30" fill="#0e2617"/>
        <ellipse cx="100" cy="44" rx="40" ry="24" fill="#143d28"/>
      </svg>

      {/* Front layer trees with banana clusters */}
      <svg className="jungle-tree jungle-tree-left" viewBox="0 0 180 340" aria-hidden="true">
        <path d="M 82 340 L 84 180 Q 72 120 86 60 Q 100 30 96 6 L 106 6 Q 112 30 108 62 L 98 180 L 96 340 Z" fill="#0c2a1b"/>
        <ellipse cx="88" cy="58" rx="52" ry="32" fill="#174a2d"/>
        <ellipse cx="54" cy="80" rx="40" ry="26" fill="#174a2d"/>
        <ellipse cx="122" cy="74" rx="44" ry="28" fill="#174a2d"/>
        <ellipse cx="88" cy="32" rx="36" ry="22" fill="#206d44"/>
        <ellipse cx="72" cy="22" rx="24" ry="14" fill="#2d8f5a" opacity="0.9"/>
        <g className="jungle-banana-cluster">
          <path d="M 130 90 Q 138 118 132 134 Q 142 124 146 110 Q 142 96 130 90 Z" fill="#ffe14d" stroke="#8b6914" strokeWidth="1"/>
          <path d="M 118 94 Q 128 120 122 138 Q 132 128 138 112 Q 132 98 118 94 Z" fill="#ffe14d" stroke="#8b6914" strokeWidth="1"/>
          <path d="M 138 92 Q 146 112 142 126 Q 150 118 152 106 Q 146 94 138 92 Z" fill="#ffe14d" stroke="#8b6914" strokeWidth="1"/>
        </g>
      </svg>

      <svg className="jungle-tree jungle-tree-right" viewBox="0 0 180 320" aria-hidden="true">
        <path d="M 80 320 L 82 170 Q 74 110 86 58 Q 98 30 94 8 L 104 8 Q 110 30 106 60 L 96 170 L 94 320 Z" fill="#143d28"/>
        <ellipse cx="90" cy="60" rx="48" ry="30" fill="#206d44"/>
        <ellipse cx="58" cy="80" rx="36" ry="24" fill="#206d44"/>
        <ellipse cx="124" cy="74" rx="40" ry="26" fill="#206d44"/>
        <ellipse cx="90" cy="32" rx="32" ry="20" fill="#2d8f5a"/>
        <g className="jungle-banana-cluster jungle-banana-cluster-slow">
          <path d="M 54 88 Q 46 116 50 134 Q 40 124 36 108 Q 42 92 54 88 Z" fill="#ffe14d" stroke="#8b6914" strokeWidth="1"/>
          <path d="M 42 92 Q 34 112 38 128 Q 28 120 26 106 Q 34 94 42 92 Z" fill="#ffe14d" stroke="#8b6914" strokeWidth="1"/>
        </g>
      </svg>

      {/* Ground fern tufts */}
      <svg className="jungle-fern jungle-fern-1" viewBox="0 0 120 70" aria-hidden="true">
        <path d="M 60 70 Q 20 40 10 10" stroke="#143d28" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 60 70 Q 40 30 30 2" stroke="#206d44" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 60 70 Q 60 30 55 0" stroke="#2d8f5a" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 60 70 Q 80 30 90 2" stroke="#206d44" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 60 70 Q 100 40 110 10" stroke="#143d28" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>
      <svg className="jungle-fern jungle-fern-2" viewBox="0 0 120 70" aria-hidden="true">
        <path d="M 60 70 Q 25 38 15 12" stroke="#0e2617" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 60 70 Q 45 32 38 4" stroke="#174a2d" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 60 70 Q 60 30 58 0" stroke="#206d44" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 60 70 Q 75 32 82 4" stroke="#174a2d" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 60 70 Q 95 38 105 12" stroke="#0e2617" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>

      {SLOTS.map((m, i) => (
        <div
          key={i}
          className={`jungle-monkey jungle-monkey-${m.anim}${m.flip ? " is-flipped" : ""}`}
          style={{
            left: m.left,
            bottom: m.bottom,
            transform: `scale(${m.scale})${m.flip ? " scaleX(-1)" : ""}`,
          }}
        >
          <div
            className="jungle-monkey-sprite"
            style={{ animationDelay: m.delay, animationDuration: m.speed }}
          />
          {m.anim !== "flip" && (
            <div
              className="jungle-monkey-shadow"
              style={{ animationDelay: m.delay, animationDuration: m.speed }}
            />
          )}
        </div>
      ))}

      <style>{`
        .jungle-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 11;
          opacity: 0;
          transition: opacity 0.6s ease-out;
          overflow: hidden;
        }
        .jungle-overlay[data-visible="true"] { opacity: 1; }

        /* Vines hang from top edge */
        .jungle-vine {
          position: absolute;
          top: 0;
          width: auto;
          height: 44%;
          transform-origin: 50% 0%;
          animation: vine-sway 6s ease-in-out infinite;
          opacity: 0.9;
        }
        .jungle-vine-1 { left: 18%; height: 38%; animation-duration: 5.2s; }
        .jungle-vine-2 { right: 14%; height: 46%; animation-duration: 6.8s; animation-delay: -2s; }
        @keyframes vine-sway {
          0%, 100% { transform: rotate(-2deg); }
          50%      { transform: rotate(3deg); }
        }

        /* Tree silhouettes along bottom */
        .jungle-tree {
          position: absolute;
          bottom: 0;
          width: auto;
          filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.55));
        }
        .jungle-tree-back  { left: 42%; height: 58%; opacity: 0.7;  transform: translateX(-50%); }
        .jungle-tree-left  { left: -3%; height: 62%; opacity: 0.95; }
        .jungle-tree-right { right: -4%; height: 58%; opacity: 0.95; }

        .jungle-banana-cluster {
          transform-origin: 132px 92px;
          animation: banana-sway 3.2s ease-in-out infinite;
        }
        .jungle-banana-cluster-slow {
          transform-origin: 44px 96px;
          animation: banana-sway 4.6s ease-in-out infinite;
        }
        @keyframes banana-sway {
          0%, 100% { transform: rotate(-5deg); }
          50%      { transform: rotate(6deg); }
        }

        /* Ground ferns */
        .jungle-fern {
          position: absolute;
          bottom: 2%;
          width: 140px;
          height: auto;
          opacity: 0.85;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));
        }
        .jungle-fern-1 { left: 14%; }
        .jungle-fern-2 { right: 24%; }

        /* Monkey sprite base */
        .jungle-monkey {
          position: absolute;
          width: 104px;
          height: 104px;
          will-change: transform;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
        }
        @media (min-width: 768px) {
          .jungle-monkey { width: 128px; height: 128px; }
        }

        .jungle-monkey-sprite {
          position: absolute;
          inset: 0;
          background-image: url('/monkeys.svg');
          background-repeat: no-repeat;
          background-size: 800% 300%;
          image-rendering: auto;
        }

        /* Background-position percentages are relative to (image - container) travel distance.
           Sheet 1024×384, container 128×128, background-size 800% 300% → image is 8× wide, 3× tall.
           Horizontal travel = (8-1)×container = 7×container. One cell advance = container = 100/7 ≈ 14.2857%.
           Vertical: 2×container travel, row 0=0%, row 1=50%, row 2=100%.
           Frames: N frames go from 0% to (N-1)/7 * 100% — steps(N, jump-none) hits all N cells. */

        /* Row 0 — JUMP · 4 frames */
        .jungle-monkey-jump .jungle-monkey-sprite {
          animation:
            monkey-jump-frames 0.9s steps(4, jump-none) infinite,
            monkey-bounce 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
          background-position: 0% 0%;
        }
        @keyframes monkey-jump-frames {
          from { background-position: 0%       0%; }
          to   { background-position: 42.8571% 0%; }
        }

        /* Row 1 — WALK · 6 frames */
        .jungle-monkey-walk .jungle-monkey-sprite {
          animation:
            monkey-walk-frames 1.1s steps(6, jump-none) infinite,
            monkey-walk-bob 1.1s ease-in-out infinite;
          background-position: 0% 50%;
        }
        @keyframes monkey-walk-frames {
          from { background-position: 0%       50%; }
          to   { background-position: 71.4286% 50%; }
        }
        @keyframes monkey-walk-bob {
          0%, 100% { transform: translateY(0); }
          25%      { transform: translateY(-3px); }
          50%      { transform: translateY(0); }
          75%      { transform: translateY(-3px); }
        }

        /* Row 2 — FLIP · 8 frames (full row) */
        .jungle-monkey-flip .jungle-monkey-sprite {
          animation:
            monkey-flip-frames 1.4s steps(8, jump-none) infinite,
            monkey-flip-arc 1.4s ease-in-out infinite;
          background-position: 0% 100%;
        }
        @keyframes monkey-flip-frames {
          from { background-position: 0%   100%; }
          to   { background-position: 100% 100%; }
        }
        @keyframes monkey-flip-arc {
          0%   { transform: translateY(0) translateX(0); }
          50%  { transform: translateY(-40px) translateX(8px); }
          100% { transform: translateY(0) translateX(0); }
        }

        /* Flipped monkeys face left — we still want the arc/bob, so flip is applied
           on the parent and child animations operate in their own coordinate space. */
        .jungle-monkey.is-flipped .jungle-monkey-sprite { transform: scaleX(1); }

        /* Jump-specific bounce */
        @keyframes monkey-bounce {
          0%   { transform: translateY(0) scaleY(0.96); }
          30%  { transform: translateY(-46px) scaleY(1.04); }
          50%  { transform: translateY(-62px) scaleY(1.06); }
          70%  { transform: translateY(-46px) scaleY(1.04); }
          100% { transform: translateY(0) scaleY(0.96); }
        }

        .jungle-monkey-shadow {
          position: absolute;
          bottom: -14px;
          left: 50%;
          width: 74px;
          height: 12px;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.55), rgba(0,0,0,0));
          transform: translateX(-50%) scale(1);
        }
        .jungle-monkey-jump .jungle-monkey-shadow {
          animation: monkey-shadow 0.9s ease-in-out infinite;
        }
        .jungle-monkey-walk .jungle-monkey-shadow {
          animation: monkey-shadow-walk 1.1s ease-in-out infinite;
          width: 60px;
        }
        @keyframes monkey-shadow {
          0%, 100% { transform: translateX(-50%) scale(1);   opacity: 0.75; }
          50%      { transform: translateX(-50%) scale(0.35); opacity: 0.25; }
        }
        @keyframes monkey-shadow-walk {
          0%, 100% { transform: translateX(-50%) scale(1);    opacity: 0.7; }
          50%      { transform: translateX(-50%) scale(0.85); opacity: 0.55; }
        }

        @media (prefers-reduced-motion: reduce) {
          .jungle-monkey-sprite,
          .jungle-monkey-shadow,
          .jungle-banana-cluster,
          .jungle-banana-cluster-slow,
          .jungle-vine { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
