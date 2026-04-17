interface JumpingMonkeysProps {
  visible: boolean;
}

const MONKEY_OFFSETS = [
  { left: "8%", delay: "0s",    scale: 0.95 },
  { left: "26%", delay: "0.17s", scale: 1 },
  { left: "46%", delay: "0.34s", scale: 1.08 },
  { left: "66%", delay: "0.50s", scale: 1 },
  { left: "84%", delay: "0.68s", scale: 0.92 },
];

export default function JumpingMonkeys({ visible }: JumpingMonkeysProps) {
  return (
    <div className="jungle-overlay" data-visible={visible ? "true" : "false"}>
      <svg className="jungle-tree jungle-tree-1" viewBox="0 0 120 220" aria-hidden="true">
        <path d="M 52 220 L 52 120 Q 40 80 54 40 Q 66 22 62 6 L 68 6 Q 72 24 72 42 L 72 120 L 72 220 Z" fill="#081a11"/>
        <circle cx="62" cy="40" r="28" fill="#0e2617"/>
        <circle cx="44" cy="56" r="22" fill="#0e2617"/>
        <circle cx="80" cy="52" r="24" fill="#0e2617"/>
        <circle cx="62" cy="24" r="22" fill="#143d28"/>
        <g className="jungle-banana-cluster">
          <path d="M 80 60 Q 86 80 82 94 Q 88 88 92 76 Q 88 64 80 60 Z" fill="#ffe14d" stroke="#8b6914" strokeWidth="1"/>
          <path d="M 70 64 Q 76 82 72 96 Q 78 90 82 78 Q 78 66 70 64 Z" fill="#ffe14d" stroke="#8b6914" strokeWidth="1"/>
        </g>
      </svg>

      <svg className="jungle-tree jungle-tree-2" viewBox="0 0 140 260" aria-hidden="true">
        <path d="M 66 260 L 68 140 Q 60 90 72 50 Q 82 30 80 8 L 88 8 Q 92 30 90 54 L 86 140 L 84 260 Z" fill="#0c2a1b"/>
        <circle cx="80" cy="50" r="34" fill="#174a2d"/>
        <circle cx="56" cy="70" r="28" fill="#174a2d"/>
        <circle cx="104" cy="62" r="30" fill="#174a2d"/>
        <circle cx="78" cy="28" r="26" fill="#206d44"/>
        <g className="jungle-banana-cluster jungle-banana-cluster-slow">
          <path d="M 102 72 Q 110 96 104 112 Q 114 104 118 88 Q 114 76 102 72 Z" fill="#ffe14d" stroke="#8b6914" strokeWidth="1"/>
          <path d="M 90 76 Q 98 100 92 116 Q 102 108 106 92 Q 102 80 90 76 Z" fill="#ffe14d" stroke="#8b6914" strokeWidth="1"/>
          <path d="M 110 74 Q 118 94 114 108 Q 122 102 124 90 Q 120 78 110 74 Z" fill="#ffe14d" stroke="#8b6914" strokeWidth="1"/>
        </g>
      </svg>

      <svg className="jungle-tree jungle-tree-3" viewBox="0 0 120 220" aria-hidden="true">
        <path d="M 54 220 L 56 130 Q 48 90 58 50 Q 66 30 64 10 L 70 10 Q 74 30 72 52 L 68 130 L 66 220 Z" fill="#143d28"/>
        <circle cx="62" cy="46" r="30" fill="#206d44"/>
        <circle cx="42" cy="62" r="24" fill="#206d44"/>
        <circle cx="84" cy="58" r="26" fill="#206d44"/>
        <circle cx="62" cy="22" r="22" fill="#2d6a4f"/>
      </svg>

      {MONKEY_OFFSETS.map((m, i) => (
        <div
          key={i}
          className="jungle-monkey"
          style={{
            left: m.left,
            animationDelay: m.delay,
            transform: `scale(${m.scale})`,
          }}
        >
          <div className="jungle-monkey-sprite" style={{ animationDelay: m.delay }} />
          <div className="jungle-monkey-shadow" style={{ animationDelay: m.delay }} />
        </div>
      ))}

      <style>{`
        .jungle-overlay {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 280px;
          pointer-events: none;
          z-index: 11;
          opacity: 0;
          transition: opacity 0.6s ease-out;
          overflow: hidden;
        }
        .jungle-overlay[data-visible="true"] { opacity: 1; }

        .jungle-tree {
          position: absolute;
          bottom: 0;
          height: 280px;
          width: auto;
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45));
        }
        .jungle-tree-1 { left: 2%; height: 240px; opacity: 0.85; }
        .jungle-tree-2 { right: 4%; height: 300px; opacity: 0.95; }
        .jungle-tree-3 { left: 48%; height: 200px; opacity: 0.75; transform: translateX(-50%); }

        .jungle-banana-cluster {
          transform-origin: 80px 60px;
          animation: banana-sway 3.2s ease-in-out infinite;
        }
        .jungle-banana-cluster-slow {
          transform-origin: 100px 72px;
          animation: banana-sway 4.4s ease-in-out infinite;
        }
        @keyframes banana-sway {
          0%, 100% { transform: rotate(-4deg); }
          50%      { transform: rotate(5deg); }
        }

        .jungle-monkey {
          position: absolute;
          bottom: 40px;
          width: 96px;
          height: 96px;
          will-change: transform;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35));
        }
        @media (min-width: 768px) {
          .jungle-monkey { width: 128px; height: 128px; bottom: 56px; }
        }

        .jungle-monkey-sprite {
          position: absolute;
          inset: 0;
          background-image: url('/monkeys.svg');
          background-repeat: no-repeat;
          background-size: 400% 100%;
          background-position: 0% 0%;
          animation: monkey-frames 0.72s steps(4, jump-none) infinite, monkey-bounce 0.72s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
        }
        @keyframes monkey-frames {
          from { background-position: 0% 0%; }
          to   { background-position: -400% 0%; }
        }
        @keyframes monkey-bounce {
          0%   { transform: translateY(0) scaleY(0.95); }
          25%  { transform: translateY(-10px) scaleY(1.02); }
          50%  { transform: translateY(-56px) scaleY(1.06); }
          75%  { transform: translateY(-10px) scaleY(1.02); }
          100% { transform: translateY(0) scaleY(0.95); }
        }

        .jungle-monkey-shadow {
          position: absolute;
          bottom: -12px;
          left: 50%;
          width: 64px;
          height: 10px;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.55), rgba(0,0,0,0));
          transform: translateX(-50%) scale(1);
          animation: monkey-shadow 0.72s ease-in-out infinite;
        }
        @keyframes monkey-shadow {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.7; }
          50%      { transform: translateX(-50%) scale(0.4); opacity: 0.25; }
        }

        @media (prefers-reduced-motion: reduce) {
          .jungle-monkey-sprite,
          .jungle-monkey-shadow,
          .jungle-banana-cluster,
          .jungle-banana-cluster-slow { animation: none; }
        }
      `}</style>
    </div>
  );
}
