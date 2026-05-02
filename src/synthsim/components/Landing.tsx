import { SYNTHSIM_PALETTE } from "../styles";

interface LandingProps {
  visible: boolean;
  onPreflight?: () => void;
}

const Landing = ({ visible, onPreflight }: LandingProps) => {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6 text-center"
      style={{
        background: SYNTHSIM_PALETTE.bg,
        color: SYNTHSIM_PALETTE.fg,
        opacity: visible ? 1 : 0,
        transition: "opacity 600ms ease-out",
      }}
    >
      <h1
        className="font-light tracking-[0.18em] text-3xl sm:text-4xl md:text-6xl"
        style={{
          opacity: 0,
          animation: visible
            ? "synthsim-rise-in 700ms ease-out 120ms forwards"
            : "none",
        }}
      >
        synthsim
      </h1>

      <p
        className="mt-4 sm:mt-5 text-xs sm:text-sm md:text-base font-light"
        style={{
          color: SYNTHSIM_PALETTE.muted,
          opacity: 0,
          animation: visible
            ? "synthsim-rise-in 700ms ease-out 320ms forwards"
            : "none",
        }}
      >
        fly a synth
      </p>

      <button
        type="button"
        onClick={onPreflight}
        className="mt-10 sm:mt-12 px-5 sm:px-6 py-2 text-[10px] sm:text-xs uppercase tracking-[0.3em] font-mono border transition-colors duration-300 hover:bg-white/5 active:bg-white/10 touch-manipulation"
        style={{
          borderColor: SYNTHSIM_PALETTE.line,
          color: SYNTHSIM_PALETTE.fg,
          opacity: 0,
          animation: visible
            ? "synthsim-rise-in 700ms ease-out 520ms forwards"
            : "none",
        }}
      >
        Pre-flight →
      </button>

      <style>{`
        @keyframes synthsim-rise-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Landing;
