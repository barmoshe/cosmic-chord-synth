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
  // Sparse ground troupe — three monkeys, well-spaced, leaving breathing room
  // for the flower clumps and ferns.
  { left: "10%",  bottom: "6%",  scale: 0.95, anim: "walk", delay: "0s",    speed: "1.1s" },
  { left: "44%",  bottom: "5%",  scale: 1.05, anim: "jump", delay: "0.4s",  speed: "0.9s" },
  { left: "78%",  bottom: "6%",  scale: 1.0,  anim: "walk", delay: "0.7s",  speed: "1.05s", flip: true },
];

interface FlowerSlot {
  left: string;
  bottom: string;
  scale: number;
  delay: string;
  tilt: number;
}

const FLOWERS: FlowerSlot[] = [
  { left: "28%", bottom: "2%", scale: 0.95, delay: "0s",   tilt: -4 },
  { left: "60%", bottom: "3%", scale: 1.1,  delay: "1.2s", tilt:  3 },
  { left: "90%", bottom: "2%", scale: 0.85, delay: "0.6s", tilt: -2 },
];

export default function JumpingMonkeys({ visible }: JumpingMonkeysProps) {
  return (
    <div className="jungle-overlay" data-visible={visible ? "true" : "false"}>
      {/* ── Back layer: vines ── */}
      <div className="jungle-scene-back">
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
      </div>

      {/* ── Middle layer: monkeys ── */}
      <div className="jungle-scene-mid">
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
      </div>

      {/* ── Front layer: ferns + ground flowers ── */}
      <div className="jungle-scene-front">
        {/* A single fern tuft off to the side — keeps the ground band alive. */}
        <svg className="jungle-fern jungle-fern-1" viewBox="0 0 120 70" aria-hidden="true">
          <path d="M 60 70 Q 20 40 10 10" stroke="#143d28" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M 60 70 Q 40 30 30 2" stroke="#206d44" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M 60 70 Q 60 30 55 0" stroke="#2d8f5a" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M 60 70 Q 80 30 90 2" stroke="#206d44" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M 60 70 Q 100 40 110 10" stroke="#143d28" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </svg>

        {/* Ground flowers — stem (גבעול) + sprite-animated bloom head.
            The stem is a static curved SVG path with a midway leaf; the head
            is a div with background-image cycling through flowers.svg at
            steps(4, jump-none). Positions are scattered in gaps between the
            monkey troupe so the ground reads as sparse-but-alive. */}
        {FLOWERS.map((f, i) => (
          <div
            key={i}
            className="jungle-flower"
            style={{
              left: f.left,
              bottom: f.bottom,
              transform: `scale(${f.scale}) rotate(${f.tilt}deg)`,
            }}
          >
            <svg className="jungle-flower-stem" viewBox="0 0 24 60" aria-hidden="true">
              <path d="M 12 60 Q 9 42 12 24 Q 15 12 12 2" stroke="#206d44" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
              <ellipse cx="7" cy="38" rx="6" ry="2.4" fill="#2d8f5a" transform="rotate(-25 7 38)" opacity="0.9"/>
              <ellipse cx="17" cy="28" rx="5" ry="2.2" fill="#206d44" transform="rotate(30 17 28)" opacity="0.85"/>
            </svg>
            <span
              className="jungle-flower-head"
              style={{ animationDelay: f.delay }}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>

      <style>{`
        .jungle-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          /* Decorative layer. Global z:3 keeps it above the canvas but below
             every HUD element (axis 8, HUD 10, glow 12, DJ panel 14).
             isolation:isolate gives the three inner scene layers (back/mid/front)
             their own stacking context so local z-indices never leak out.
             clip-path keeps the decor out of the top viewport band where the
             header, audio badge and theme pill live. */
          isolation: isolate;
          z-index: 3;
          opacity: 0;
          transition: opacity 0.6s ease-out;
          overflow: hidden;
          clip-path: inset(42% 0 0 0);
        }
        @media (max-width: 480px) {
          .jungle-overlay { clip-path: inset(50% 0 0 0); }
        }
        .jungle-overlay[data-visible="true"] { opacity: 1; }

        .jungle-scene-back,
        .jungle-scene-mid,
        .jungle-scene-front {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .jungle-scene-back  { z-index: 1; }
        .jungle-scene-mid   { z-index: 2; }
        .jungle-scene-front { z-index: 3; }

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

        /* Ground ferns */
        .jungle-fern {
          position: absolute;
          bottom: 2%;
          width: 140px;
          height: auto;
          opacity: 0.85;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));
        }
        .jungle-fern-1 { left: 4%; opacity: 0.7; }

        /* Ground flower — stem (גבעול) below, sprite-animated bloom head on top.
           The head sits at the top of the stem via absolute positioning.
           Sprite advances through 4 frames at steps(4, jump-none) for a slow
           bloom-breathe cycle. transform-origin on the wrapper pins the sway
           at the ground so the stem bends from its root, not its tip. */
        .jungle-flower {
          position: absolute;
          width: 56px;
          height: 80px;
          transform-origin: 50% 100%;
          animation: flower-sway 5.4s ease-in-out infinite;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.45));
        }
        @keyframes flower-sway {
          0%, 100% { transform: rotate(-3deg); }
          50%      { transform: rotate(4deg); }
        }
        .jungle-flower-stem {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 56px;
        }
        .jungle-flower-head {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 56px;
          height: 56px;
          background-image: url('/flowers.svg');
          background-repeat: no-repeat;
          /* 4 horizontal frames, 1 row → 400% 100%. steps(4, jump-none) walks
             the 4 columns; end position of 100% is the last column (frame 3). */
          background-size: 400% 100%;
          background-position: 0% 0%;
          animation: flower-bloom 3.6s steps(4, jump-none) infinite;
        }
        @keyframes flower-bloom {
          from { background-position: 0%   0%; }
          to   { background-position: 100% 0%; }
        }

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
          .jungle-flower,
          .jungle-flower-head,
          .jungle-vine { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
