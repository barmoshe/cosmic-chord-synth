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
      {/* Shared gradients + reusable symbols for trees + bananas.
          Fronds are now proper palm fronds: a curved central rachis with
          pinnae (leaflets) fanning off both sides, sized-down toward the
          tip. A bunch of bananas hangs with a back row + front row stacked
          around the stem peduncle — each banana is a crescent with a stem
          nub, body gradient highlight, and dark sepal at the tip. */}
      <svg className="jungle-defs" aria-hidden="true" width="0" height="0">
        <defs>
          <linearGradient id="t-trunk" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor="#7a4422"/>
            <stop offset="45%"  stopColor="#4a2b17"/>
            <stop offset="100%" stopColor="#1a0e07"/>
          </linearGradient>
          <linearGradient id="t-frond" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%"   stopColor="#3ea56a"/>
            <stop offset="55%"  stopColor="#206d44"/>
            <stop offset="100%" stopColor="#0c2a1b"/>
          </linearGradient>
          <linearGradient id="t-frond-back" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%"   stopColor="#143d28"/>
            <stop offset="100%" stopColor="#04120b"/>
          </linearGradient>
          <radialGradient id="t-coconut" cx="35%" cy="30%" r="70%">
            <stop offset="0%"   stopColor="#a47148"/>
            <stop offset="60%"  stopColor="#6b3b1e"/>
            <stop offset="100%" stopColor="#2a180e"/>
          </radialGradient>
          <linearGradient id="b-banana" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#fff085"/>
            <stop offset="50%"  stopColor="#facc15"/>
            <stop offset="100%" stopColor="#a16207"/>
          </linearGradient>

          {/* ── Palm frond: rachis + 12 pinnae (6 per side).
              Origin (0,0) at the base so the frond rotates around the crown
              anchor when placed via transform="rotate(…)". The rachis ends
              at (130,-10) — sweep upward-right so the frond reads as lifted. */}
          <symbol id="palm-frond" viewBox="-8 -22 148 44" overflow="visible">
            {/* upper-side pinnae (lighter) */}
            <path d="M 10 -1  Q 6 -10 16 -18 Q 14 -9 16 -3 Z"/>
            <path d="M 26 -2  Q 22 -13 36 -20 Q 32 -10 30 -4 Z"/>
            <path d="M 44 -4  Q 44 -14 58 -19 Q 54 -10 50 -5 Z"/>
            <path d="M 62 -6  Q 66 -13 78 -17 Q 74 -9 68 -7 Z"/>
            <path d="M 80 -7  Q 86 -12 94 -14 Q 92 -8 84 -8 Z"/>
            <path d="M 98 -9  Q 104 -11 110 -12 Q 108 -9 100 -10 Z"/>
            {/* lower-side pinnae */}
            <path d="M 10 1   Q 6 12 16 18 Q 14 9 16 3 Z"/>
            <path d="M 26 0   Q 22 13 36 19 Q 32 10 30 4 Z"/>
            <path d="M 44 -2  Q 44 11 58 17 Q 54 9 50 3 Z"/>
            <path d="M 62 -4  Q 66 10 78 14 Q 74 7 68 5 Z"/>
            <path d="M 80 -5  Q 86 9 94 11 Q 92 6 84 6 Z"/>
            <path d="M 98 -7  Q 104 8 110 10 Q 108 7 100 8 Z"/>
            {/* rachis sits on top of pinnae for a clean spine */}
            <path d="M 0 0 Q 65 -4 128 -10" stroke="#0c2a1b" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
          </symbol>

          {/* ── Single banana: crescent body with stem nub + dark tip.
              Origin at the stem (top), tip at ~y=38. rotate() around (0,0)
              fans the bunch around the peduncle. */}
          <symbol id="banana" viewBox="-6 -4 14 44" overflow="visible">
            {/* stem nub */}
            <path d="M -2 -2 L 2 -2 L 1.2 -4 Q 0 -4.5 -1.2 -4 Z" fill="#6b3b1e"/>
            {/* body */}
            <path d="M -1 -1 Q 4 1 6 10 Q 7 22 4 32 Q 2 36 -1 34 Q -3 28 -2 22 Q -1 12 -3 6 Q -3 1 -1 -1 Z"
                  fill="url(#b-banana)" stroke="#8b6914" strokeWidth="0.7" strokeLinejoin="round"/>
            {/* highlight streak */}
            <path d="M 2 4 Q 5 14 5 24 Q 4 30 2 33" stroke="#fff085" strokeWidth="0.7" fill="none" opacity="0.6" strokeLinecap="round"/>
            {/* dark sepal at the tip */}
            <ellipse cx="0" cy="36" rx="1.4" ry="2.2" fill="#2a180e"/>
          </symbol>
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
          <g transform="translate(116 60)" fill="url(#t-frond-back)">
            <use href="#palm-frond" transform="rotate(-82) scale(0.82)"/>
            <use href="#palm-frond" transform="rotate(-40) scale(0.9)"/>
            <use href="#palm-frond" transform="rotate(0)   scale(0.95)"/>
            <use href="#palm-frond" transform="rotate(40)  scale(0.9)"/>
            <use href="#palm-frond" transform="rotate(82)  scale(0.82)"/>
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
        {/* Front-left palm — coconut palm.
            Trunk scars (subtle curved arcs) replace old horizontal ticks —
            real palms have ring-shaped scars where old fronds dropped. */}
        <svg className="jungle-tree jungle-tree-left" viewBox="0 0 220 360" aria-hidden="true">
          <path
            d="M 98 360 Q 102 280 100 200 Q 98 130 112 58 L 124 58 Q 118 130 120 200 Q 118 280 116 360 Z"
            fill="url(#t-trunk)"
          />
          {/* curved frond scars down the trunk */}
          <path d="M 100 112 Q 111 116 123 112" stroke="#1a0e07" strokeWidth="1.2" fill="none" opacity="0.7"/>
          <path d="M 100 152 Q 111 156 122 152" stroke="#1a0e07" strokeWidth="1.2" fill="none" opacity="0.65"/>
          <path d="M 101 196 Q 111 200 122 196" stroke="#1a0e07" strokeWidth="1.1" fill="none" opacity="0.6"/>
          <path d="M 102 244 Q 111 248 121 244" stroke="#1a0e07" strokeWidth="1.0" fill="none" opacity="0.55"/>
          <path d="M 103 292 Q 111 296 120 292" stroke="#1a0e07" strokeWidth="1.0" fill="none" opacity="0.5"/>
          {/* Crown — 7 fronds around the anchor, lighter at mid-arc */}
          <g transform="translate(118 58)" fill="url(#t-frond)">
            <use href="#palm-frond" transform="rotate(-92) scale(0.85)" opacity="0.9"/>
            <use href="#palm-frond" transform="rotate(-55) scale(0.95)"/>
            <use href="#palm-frond" transform="rotate(-22) scale(1.0)"/>
            <use href="#palm-frond" transform="rotate(12)  scale(1.0)"/>
            <use href="#palm-frond" transform="rotate(45)  scale(0.95)"/>
            <use href="#palm-frond" transform="rotate(78)  scale(0.88)" opacity="0.9"/>
            <use href="#palm-frond" transform="rotate(115) scale(0.75)" opacity="0.8"/>
            {/* Coconut cluster at crown base — compact trio */}
            <g className="jungle-coconuts">
              <circle cx="-3"  cy="8"  r="4.5" fill="url(#t-coconut)" stroke="#2a180e" strokeWidth="1"/>
              <circle cx="6"   cy="10" r="5"   fill="url(#t-coconut)" stroke="#2a180e" strokeWidth="1"/>
              <circle cx="1"   cy="14" r="4"   fill="url(#t-coconut)" stroke="#2a180e" strokeWidth="1"/>
            </g>
          </g>
        </svg>

        {/* Front-right palm — banana palm, mirrored crown */}
        <svg className="jungle-tree jungle-tree-right" viewBox="0 0 220 340" aria-hidden="true">
          <path
            d="M 104 340 Q 100 260 102 180 Q 104 120 94 56 L 106 56 Q 116 120 114 180 Q 116 260 112 340 Z"
            fill="url(#t-trunk)"
          />
          {/* curved frond scars down the trunk */}
          <path d="M 96  108 Q 106 112 115 108" stroke="#1a0e07" strokeWidth="1.2" fill="none" opacity="0.7"/>
          <path d="M 97  148 Q 106 152 114 148" stroke="#1a0e07" strokeWidth="1.2" fill="none" opacity="0.65"/>
          <path d="M 98  190 Q 106 194 114 190" stroke="#1a0e07" strokeWidth="1.1" fill="none" opacity="0.6"/>
          <path d="M 99  236 Q 106 240 113 236" stroke="#1a0e07" strokeWidth="1.0" fill="none" opacity="0.55"/>
          <path d="M 100 286 Q 106 290 112 286" stroke="#1a0e07" strokeWidth="1.0" fill="none" opacity="0.5"/>
          {/* Crown — mirrored (this tree faces left) */}
          <g transform="translate(100 56)" fill="url(#t-frond)">
            <use href="#palm-frond" transform="rotate(92)  scale(0.85)" opacity="0.9"/>
            <use href="#palm-frond" transform="rotate(55)  scale(0.95)"/>
            <use href="#palm-frond" transform="rotate(22)  scale(1.0)"/>
            <use href="#palm-frond" transform="rotate(-12) scale(1.0)"/>
            <use href="#palm-frond" transform="rotate(-45) scale(0.95)"/>
            <use href="#palm-frond" transform="rotate(-78) scale(0.88)" opacity="0.9"/>
            {/* Banana bunch hanging from the crown.
                Outer translate+scale positions the bunch below the crown
                anchor. Inner group owns the CSS sway animation. Bananas
                all hang DOWN (rotate values clustered around 0), with a
                back row behind a front row for depth. */}
            <g transform="translate(6 10) scale(0.8)">
              <g className="jungle-banana-cluster jungle-banana-cluster-right">
                {/* Peduncle — the stalk where the bunch attaches. */}
                <path d="M -3 -8 Q 0 -2 -1 2 L 1 2 Q 2 -2 3 -8 Z" fill="#5a3a1a"/>
                <ellipse cx="0" cy="-1" rx="7.5" ry="3.5" fill="#3f2a15"/>
                <ellipse cx="0" cy="-3" rx="4" ry="2" fill="#6b3b1e"/>
                {/* back row — two smaller bananas tucked behind */}
                <use href="#banana" transform="rotate(-9) scale(0.82)" opacity="0.85"/>
                <use href="#banana" transform="rotate(9)  scale(0.82)" opacity="0.85"/>
                {/* front row — three bananas overlapping */}
                <use href="#banana" transform="rotate(-18)"/>
                <use href="#banana" transform="rotate(0)"/>
                <use href="#banana" transform="rotate(18)"/>
              </g>
            </g>
          </g>
        </svg>

        {/* A single fern tuft off to the side — second one removed to uncrowd
            the ground band. */}
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
             header, audio badge, theme pill and try-v2 chip live. */
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
        .jungle-tree-back  { left: 50%; height: 40%; opacity: 0.7;  transform: translateX(-50%); }
        .jungle-tree-left  { left: -12%; height: 44%; opacity: 0.95; }
        .jungle-tree-right { right: -14%; height: 42%; opacity: 0.95; }
        @media (max-width: 480px) {
          .jungle-tree-back  { height: 34%; }
          .jungle-tree-left  { height: 38%; left: -18%; }
          .jungle-tree-right { height: 36%; right: -20%; }
        }

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
          .jungle-banana-cluster,
          .jungle-banana-cluster-right,
          .jungle-coconuts,
          .jungle-flower,
          .jungle-flower-head,
          .jungle-vine { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
