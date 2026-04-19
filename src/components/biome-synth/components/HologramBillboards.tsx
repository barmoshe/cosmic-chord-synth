interface HologramBillboardsProps {
  visible: boolean;
}

// Three floating holographic billboards with scanline flicker — CSS-only,
// SVG content for the neon glyphs. Purely decorative (pointer-events: none).

const BILLBOARDS = [
  {
    cls: "cyber-holo-one",
    accent: "#ff2bd6",
    glyph: "NEON",
    sub: "// 新 宿 //",
  },
  {
    cls: "cyber-holo-two",
    accent: "#21e7ff",
    glyph: "2084",
    sub: "SECTOR-7",
  },
  {
    cls: "cyber-holo-three",
    accent: "#9d00ff",
    glyph: "楽",
    sub: "GRID.ACTIVE",
  },
];

export default function HologramBillboards({ visible }: HologramBillboardsProps) {
  return (
    <div className="cyber-holo-overlay" data-visible={visible ? "true" : "false"}>
      {BILLBOARDS.map((b) => (
        <div key={b.cls} className={`cyber-holo ${b.cls}`} style={{ ["--accent" as string]: b.accent }}>
          <div className="cyber-holo-frame">
            <div className="cyber-holo-glyph">{b.glyph}</div>
            <div className="cyber-holo-sub">{b.sub}</div>
            <div className="cyber-holo-scan" aria-hidden="true" />
          </div>
        </div>
      ))}

      <style>{`
        .cyber-holo-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          isolation: isolate;
          z-index: 3;
          opacity: 0;
          transition: opacity 0.8s ease-out;
          overflow: hidden;
        }
        .cyber-holo-overlay[data-visible="true"] { opacity: 1; }

        .cyber-holo {
          position: absolute;
          --accent: #ff2bd6;
          filter: drop-shadow(0 0 12px var(--accent));
        }
        .cyber-holo-one {
          left: 8%;
          top: 16%;
          width: 128px;
          animation: cyber-holo-drift 9s ease-in-out infinite;
        }
        .cyber-holo-two {
          right: 9%;
          top: 10%;
          width: 140px;
          animation: cyber-holo-drift 11s ease-in-out infinite -3s;
        }
        .cyber-holo-three {
          left: 44%;
          top: 24%;
          width: 110px;
          animation: cyber-holo-drift 7.5s ease-in-out infinite -1.5s;
        }

        .cyber-holo-frame {
          position: relative;
          padding: 10px 14px;
          background: linear-gradient(135deg, rgba(10, 4, 26, 0.55), rgba(22, 0, 40, 0.35));
          border: 1px solid color-mix(in srgb, var(--accent) 70%, transparent);
          border-radius: 2px;
          text-align: center;
          overflow: hidden;
          backdrop-filter: blur(2px);
          animation: cyber-holo-flicker 4s steps(8, end) infinite;
        }
        .cyber-holo-glyph {
          font-family: 'Orbitron', 'Noto Sans JP', monospace;
          font-weight: 900;
          font-size: clamp(18px, 3.2vw, 30px);
          letter-spacing: 0.18em;
          color: var(--accent);
          text-shadow: 0 0 8px var(--accent), 0 0 18px color-mix(in srgb, var(--accent) 60%, transparent);
        }
        .cyber-holo-sub {
          font-family: 'Raleway', monospace;
          font-size: 9px;
          letter-spacing: 0.3em;
          color: color-mix(in srgb, var(--accent) 80%, #ffffff 20%);
          margin-top: 4px;
          opacity: 0.85;
        }
        .cyber-holo-scan {
          position: absolute;
          left: -10%;
          right: -10%;
          height: 20%;
          top: -20%;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            color-mix(in srgb, var(--accent) 40%, transparent) 50%,
            transparent 100%
          );
          animation: cyber-holo-scan 3.4s linear infinite;
        }

        @keyframes cyber-holo-drift {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes cyber-holo-flicker {
          0%, 94%, 100% { opacity: 1; }
          95%           { opacity: 0.55; }
          97%           { opacity: 0.85; }
        }
        @keyframes cyber-holo-scan {
          0%   { top: -20%; }
          100% { top: 120%; }
        }

        @media (max-width: 480px) {
          .cyber-holo-one   { width: 92px;  top: 12%; left: 5%; }
          .cyber-holo-two   { width: 100px; top: 8%;  right: 5%; }
          .cyber-holo-three { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cyber-holo,
          .cyber-holo-frame,
          .cyber-holo-scan { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
