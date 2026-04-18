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
  { left: "6%",   bottom: "6%",  scale: 0.9,  anim: "walk", delay: "0s",    speed: "1.1s" },
  { left: "22%",  bottom: "5%",  scale: 1.0,  anim: "jump", delay: "0.2s",  speed: "0.9s" },
  { left: "42%",  bottom: "7%",  scale: 1.15, anim: "walk", delay: "0.4s",  speed: "1.25s", flip: true },
  { left: "62%",  bottom: "4%",  scale: 0.95, anim: "jump", delay: "0.55s", speed: "0.85s" },
  { left: "80%",  bottom: "6%",  scale: 1.0,  anim: "walk", delay: "0.7s",  speed: "1.05s" },
  // Mid-ground flipper
  { left: "35%",  bottom: "18%", scale: 0.8,  anim: "flip", delay: "0.1s",  speed: "1.4s" },
  // Secondary flipper — relocated from bottom:55% so it no longer climbs into the HUD band
  { left: "70%",  bottom: "22%", scale: 0.55, anim: "flip", delay: "0.8s",  speed: "1.8s", flip: true },
];

export default function JumpingMonkeys({ visible }: JumpingMonkeysProps) {
  return (
    <div className="jungle-overlay" data-visible={visible ? "true" : "false"}>
      {/* Shared gradients for trees + bananas. Lives once per overlay. */}
      <svg className="jungle-defs" aria-hidden="true" width="0" height="0">
        <defs>
          <linearGradient id="t-trunk" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor="#6b3b1e"/>
            <stop offset="60%"  stopColor="#3a2415"/>
            <stop offset="100%" stopColor="#1a0e07"/>
          </linearGradient>
          <linearGradient id="t-frond" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%"   stopColor="#2d8f5a"/>
            <stop offset="60%"  stopColor="#206d44"/>
            <stop offset="100%" stopColor="#0c2a1b"/>
          </linearGradient>
          <radialGradient id="t-frond-back" cx="50%" cy="50%" r="60%">
            <stop offset="0%"   stopColor="#143d28"/>
            <stop offset="100%" stopColor="#081a11"/>
          </radialGradient>
          <radialGradient id="t-coconut" cx="35%" cy="30%" r="70%">
            <stop offset="0%"   stopColor="#a47148"/>
            <stop offset="60%"  stopColor="#6b3b1e"/>
            <stop offset="100%" stopColor="#2a180e"/>
          </radialGradient>
          <linearGradient id="b-banana" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#fff085"/>
            <stop offset="55%"  stopColor="#facc15"/>
            <stop offset="100%" stopColor="#a16207"/>
          </linearGradient>
        </defs>
      </svg>

      {/* ── Back layer: vines + silhouette palm ── */}
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

        {/* Back palm — silhouette, 5 dark fronds, no coconuts */}
        <svg className="jungle-tree jungle-tree-back" viewBox="0 0 220 340" aria-hidden="true">
          <path
            d="M 102 340 Q 104 260 102 190 Q 100 120 112 60 L 120 60 Q 116 120 118 190 Q 116 260 114 340 Z"
            fill="#081a11"
          />
          <g transform="translate(116 60)">
            <g transform="rotate(-75)"><path d="M 0 0 Q 48 -10 100 -18 Q 62 10 8 14 Z" fill="url(#t-frond-back)"/></g>
            <g transform="rotate(-35)"><path d="M 0 0 Q 56 -8 112 -20 Q 68 12 10 14 Z" fill="url(#t-frond-back)"/></g>
            <g transform="rotate(5)"><path  d="M 0 0 Q 58  -4 116 -8  Q 70 14 10 14 Z" fill="url(#t-frond-back)"/></g>
            <g transform="rotate(45)"><path d="M 0 0 Q 56 -8 112 -20 Q 68 12 10 14 Z" fill="url(#t-frond-back)"/></g>
            <g transform="rotate(85)"><path d="M 0 0 Q 48 -10 100 -18 Q 62 10 8 14 Z" fill="url(#t-frond-back)"/></g>
          </g>
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

      {/* ── Front layer: ferns + front palms + banana/coconut clusters ── */}
      <div className="jungle-scene-front">
        {/* Front-left palm — coconut palm */}
        <svg className="jungle-tree jungle-tree-left" viewBox="0 0 220 360" aria-hidden="true">
          {/* Trunk (tapered, with bark ticks) */}
          <path
            d="M 98 360 Q 102 280 100 200 Q 98 130 112 58 L 124 58 Q 118 130 120 200 Q 118 280 116 360 Z"
            fill="url(#t-trunk)"
          />
          <line x1="102" y1="108" x2="122" y2="108" stroke="#1a0e07" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
          <line x1="103" y1="178" x2="121" y2="178" stroke="#1a0e07" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
          <line x1="105" y1="252" x2="119" y2="252" stroke="#1a0e07" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
          {/* Crown */}
          <g transform="translate(118 58)">
            <g transform="rotate(-85)"><path d="M 0 0 Q 52 -16 108 -26 Q 64  8 10 16 Z" fill="url(#t-frond)" opacity="0.92"/></g>
            <g transform="rotate(-50)"><path d="M 0 0 Q 60 -14 120 -28 Q 72 10 12 16 Z" fill="url(#t-frond)"/></g>
            <g transform="rotate(-18)"><path d="M 0 0 Q 62 -8  124 -14 Q 74 14 12 16 Z" fill="url(#t-frond)"/></g>
            <g transform="rotate(12)"><path  d="M 0 0 Q 62 -6  124 -10 Q 74 16 12 16 Z" fill="url(#t-frond)"/></g>
            <g transform="rotate(40)"><path  d="M 0 0 Q 60 -12 120 -26 Q 72 12 12 16 Z" fill="url(#t-frond)"/></g>
            <g transform="rotate(72)"><path  d="M 0 0 Q 52 -16 104 -28 Q 62  8 10 16 Z" fill="url(#t-frond)" opacity="0.92"/></g>
            <g transform="rotate(110)"><path d="M 0 0 Q 44 -6  92  -8  Q 56 14 10 16 Z" fill="url(#t-frond)" opacity="0.85"/></g>
            {/* Coconut cluster at crown base */}
            <g className="jungle-coconuts">
              <circle cx="-4"  cy="10" r="6"   fill="url(#t-coconut)" stroke="#2a180e" strokeWidth="1"/>
              <circle cx="8"   cy="12" r="6.5" fill="url(#t-coconut)" stroke="#2a180e" strokeWidth="1"/>
              <circle cx="2"   cy="18" r="5.5" fill="url(#t-coconut)" stroke="#2a180e" strokeWidth="1"/>
            </g>
          </g>
        </svg>

        {/* Front-right palm — banana palm */}
        <svg className="jungle-tree jungle-tree-right" viewBox="0 0 220 340" aria-hidden="true">
          {/* Trunk */}
          <path
            d="M 104 340 Q 100 260 102 180 Q 104 120 94 56 L 106 56 Q 116 120 114 180 Q 116 260 112 340 Z"
            fill="url(#t-trunk)"
          />
          <line x1="98"  y1="104" x2="114" y2="104" stroke="#1a0e07" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
          <line x1="99"  y1="172" x2="113" y2="172" stroke="#1a0e07" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
          <line x1="101" y1="240" x2="111" y2="240" stroke="#1a0e07" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
          {/* Crown — mirrored (this tree faces left) */}
          <g transform="translate(100 56)">
            <g transform="rotate(85)"><path  d="M 0 0 Q 52 -16 108 -26 Q 64  8 10 16 Z" fill="url(#t-frond)" opacity="0.92"/></g>
            <g transform="rotate(50)"><path  d="M 0 0 Q 60 -14 120 -28 Q 72 10 12 16 Z" fill="url(#t-frond)"/></g>
            <g transform="rotate(18)"><path  d="M 0 0 Q 62 -8  124 -14 Q 74 14 12 16 Z" fill="url(#t-frond)"/></g>
            <g transform="rotate(-12)"><path d="M 0 0 Q 62 -6  124 -10 Q 74 16 12 16 Z" fill="url(#t-frond)"/></g>
            <g transform="rotate(-40)"><path d="M 0 0 Q 60 -12 120 -26 Q 72 12 12 16 Z" fill="url(#t-frond)"/></g>
            <g transform="rotate(-72)"><path d="M 0 0 Q 52 -16 104 -28 Q 62  8 10 16 Z" fill="url(#t-frond)" opacity="0.92"/></g>
            {/* Banana cluster — stem anchored at (0,0) inside the crown translate. */}
            <g className="jungle-banana-cluster jungle-banana-cluster-right">
              <ellipse cx="0" cy="-2" rx="7" ry="3" fill="#3f2a15"/>
              <path transform="rotate(-36)" d="M 0 0 Q 3 14 -3 30 Q -9 40 1 42 Q 11 38 12 24 Q 12 8 5 -2 Z" fill="url(#b-banana)" stroke="#8b6914" strokeWidth="1"/>
              <path transform="rotate(-18)" d="M 0 0 Q 3 16 -3 34 Q -9 44 1 46 Q 11 42 12 26 Q 12 8 5 -2 Z" fill="url(#b-banana)" stroke="#8b6914" strokeWidth="1"/>
              <path                         d="M 0 0 Q 3 18 -3 36 Q -9 46 1 48 Q 11 44 12 28 Q 12 8 5 -2 Z" fill="url(#b-banana)" stroke="#8b6914" strokeWidth="1"/>
              <path transform="rotate(18)"  d="M 0 0 Q 3 16 -3 34 Q -9 44 1 46 Q 11 42 12 26 Q 12 8 5 -2 Z" fill="url(#b-banana)" stroke="#8b6914" strokeWidth="1"/>
              <path transform="rotate(36)"  d="M 0 0 Q 3 14 -3 30 Q -9 40 1 42 Q 11 38 12 24 Q 12 8 5 -2 Z" fill="url(#b-banana)" stroke="#8b6914" strokeWidth="1"/>
            </g>
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
             header, audio badge, theme pill and try-v2 chip live. */
          isolation: isolate;
          z-index: 3;
          opacity: 0;
          transition: opacity 0.6s ease-out;
          overflow: hidden;
          clip-path: inset(34% 0 0 0);
        }
        @media (max-width: 480px) {
          .jungle-overlay { clip-path: inset(40% 0 0 0); }
        }
        .jungle-overlay[data-visible="true"] { opacity: 1; }

        .jungle-defs { position: absolute; width: 0; height: 0; }

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

        /* Tree silhouettes along bottom */
        .jungle-tree {
          position: absolute;
          bottom: 0;
          width: auto;
          filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.55));
        }
        .jungle-tree-back  { left: 42%; height: 60%; opacity: 0.75; transform: translateX(-50%); }
        .jungle-tree-left  { left: -3%; height: 66%; opacity: 0.97; }
        .jungle-tree-right { right: -4%; height: 60%; opacity: 0.97; }

        /* Banana cluster — pivot at the stem attachment (0,0 in its local
           rotated crown space). transform-origin is pinned so the sway rotates
           around the branch junction, not through the fruit mass. */
        .jungle-banana-cluster {
          transform-origin: 0 0;
          transform-box: fill-box;
          animation: banana-sway 4.2s ease-in-out infinite;
        }
        .jungle-banana-cluster-right {
          animation-duration: 4.6s;
          animation-delay: -0.6s;
        }
        @keyframes banana-sway {
          0%, 100% { transform: rotate(-5deg); }
          50%      { transform: rotate(7deg); }
        }

        /* Coconut cluster — gentle micro-bob so fruit feels weighty */
        .jungle-coconuts {
          transform-origin: 0 0;
          transform-box: fill-box;
          animation: coconut-bob 5.4s ease-in-out infinite;
        }
        @keyframes coconut-bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(1px); }
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
          .jungle-banana-cluster-right,
          .jungle-coconuts,
          .jungle-vine { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
