import { STNYTH2_PALETTE } from "../styles";

interface LandingProps {
  visible: boolean;
}

const Landing = ({ visible }: LandingProps) => {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6 text-center"
      style={{
        background: STNYTH2_PALETTE.bg,
        color: STNYTH2_PALETTE.fg,
        opacity: visible ? 1 : 0,
        transition: "opacity 600ms ease-out",
      }}
    >
      <h1
        className="font-light tracking-[0.18em] text-4xl md:text-6xl"
        style={{
          opacity: 0,
          animation: visible
            ? "stnyth2-rise-in 700ms ease-out 120ms forwards"
            : "none",
        }}
      >
        stnyth2
      </h1>

      <p
        className="mt-5 text-sm md:text-base font-light"
        style={{
          color: STNYTH2_PALETTE.muted,
          opacity: 0,
          animation: visible
            ? "stnyth2-rise-in 700ms ease-out 320ms forwards"
            : "none",
        }}
      >
        a quiet new thing
      </p>

      <button
        type="button"
        className="mt-12 px-6 py-2 text-xs uppercase tracking-[0.3em] font-mono border transition-colors duration-300 hover:bg-white/5"
        style={{
          borderColor: STNYTH2_PALETTE.line,
          color: STNYTH2_PALETTE.fg,
          opacity: 0,
          animation: visible
            ? "stnyth2-rise-in 700ms ease-out 520ms forwards"
            : "none",
        }}
      >
        Enter →
      </button>

      <style>{`
        @keyframes stnyth2-rise-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Landing;
