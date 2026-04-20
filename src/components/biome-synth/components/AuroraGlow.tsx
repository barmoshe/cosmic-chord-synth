interface AuroraGlowProps {
  visible: boolean;
}

// Faint daylight sky wash — a breath of pale mint/periwinkle drifting across
// the overcast arctic sky. Very subtle on purpose; the scene is icy and white,
// not auroral. Bands pulse slowly so the sky feels alive without dominating.
export default function AuroraGlow({ visible }: AuroraGlowProps) {
  return (
    <div className="aurora-glow-overlay" data-visible={visible ? "true" : "false"} aria-hidden="true">
      <div className="aurora-glow-band aurora-glow-band-1" />
      <div className="aurora-glow-band aurora-glow-band-2" />

      <style>{`
        .aurora-glow-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          opacity: 0;
          transition: opacity 0.9s ease-out;
          overflow: hidden;
          mix-blend-mode: screen;
        }
        .aurora-glow-overlay[data-visible="true"] { opacity: 0.42; }

        .aurora-glow-band {
          position: absolute;
          left: -12%; right: -12%;
          height: 38vh;
          filter: blur(60px);
          animation: aurora-sway 24s ease-in-out infinite alternate;
          will-change: transform, opacity;
        }
        .aurora-glow-band-1 {
          top: 6%;
          background: radial-gradient(ellipse at 35% 50%, rgba(226,252,255,0.5) 0%, rgba(226,252,255,0) 65%);
          animation-duration: 22s;
        }
        .aurora-glow-band-2 {
          top: 24%;
          background: radial-gradient(ellipse at 65% 50%, rgba(212,239,242,0.4) 0%, rgba(212,239,242,0) 65%);
          animation-duration: 30s;
          animation-delay: -7s;
        }

        @keyframes aurora-sway {
          0%   { transform: translateX(-4%) scaleY(1);    opacity: 0.55; }
          50%  { transform: translateX(4%)  scaleY(1.06); opacity: 0.85; }
          100% { transform: translateX(-2%) scaleY(0.98); opacity: 0.7; }
        }

        @media (prefers-reduced-motion: reduce) {
          .aurora-glow-band { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
