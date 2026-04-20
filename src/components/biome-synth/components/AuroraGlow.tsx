interface AuroraGlowProps {
  visible: boolean;
}

// Soft DOM aurora halo layered over the canvas ribbons for compositional
// depth. Two overlapping radial bands pulse out of phase so the sky breathes.
export default function AuroraGlow({ visible }: AuroraGlowProps) {
  return (
    <div className="aurora-glow-overlay" data-visible={visible ? "true" : "false"} aria-hidden="true">
      <div className="aurora-glow-band aurora-glow-band-1" />
      <div className="aurora-glow-band aurora-glow-band-2" />
      <div className="aurora-glow-band aurora-glow-band-3" />

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
        .aurora-glow-overlay[data-visible="true"] { opacity: 0.75; }

        .aurora-glow-band {
          position: absolute;
          left: -10%; right: -10%;
          height: 40vh;
          filter: blur(40px);
          animation: aurora-sway 14s ease-in-out infinite alternate;
          will-change: transform, opacity;
        }
        .aurora-glow-band-1 {
          top: 8%;
          background: radial-gradient(ellipse at 30% 50%, rgba(140,243,228,0.35) 0%, rgba(140,243,228,0) 60%);
          animation-duration: 12s;
        }
        .aurora-glow-band-2 {
          top: 22%;
          background: radial-gradient(ellipse at 60% 50%, rgba(107,217,255,0.28) 0%, rgba(107,217,255,0) 60%);
          animation-duration: 18s;
          animation-delay: -4s;
        }
        .aurora-glow-band-3 {
          top: 34%;
          background: radial-gradient(ellipse at 50% 50%, rgba(181,140,255,0.22) 0%, rgba(181,140,255,0) 62%);
          animation-duration: 22s;
          animation-delay: -8s;
        }

        @keyframes aurora-sway {
          0%   { transform: translateX(-8%) scaleY(1); opacity: 0.55; }
          50%  { transform: translateX(6%)  scaleY(1.12); opacity: 0.95; }
          100% { transform: translateX(-4%) scaleY(0.95); opacity: 0.7; }
        }

        @media (prefers-reduced-motion: reduce) {
          .aurora-glow-band { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
