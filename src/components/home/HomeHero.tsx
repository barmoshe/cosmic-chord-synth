import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const BIOMES: { label: string; color: string; hint: string }[] = [
  { label: "SPACE",     color: "#6CE5FF", hint: "Cosmic galaxy" },
  { label: "JUNGLE",    color: "#3CC38A", hint: "Canopy + monkeys" },
  { label: "SEA",       color: "#2FA6FF", hint: "Reef + fish + waves" },
  { label: "CYBERPUNK", color: "#FF2CA8", hint: "Neon city + rain" },
];

export default function HomeHero() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-xs uppercase tracking-[0.5em] text-white/50">
        Interactive music experience
      </div>

      <h1
        className={cn(
          "font-light text-white",
          "text-[clamp(3rem,10vw,7rem)] leading-none tracking-[0.25em]",
          "bg-gradient-to-b from-white via-white/90 to-white/40 bg-clip-text text-transparent",
          "drop-shadow-[0_0_40px_rgba(108,229,255,0.25)]",
        )}
      >
        BIOME SYNTH
      </h1>

      <p className="mt-6 max-w-xl text-base text-white/70 sm:text-lg">
        A playable world. Touch it to make music across four living biomes —
        or let the AI DJ compose for you.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {BIOMES.map((b) => (
          <div
            key={b.label}
            title={b.hint}
            className={cn(
              "flex items-center gap-2 rounded-full border border-white/15",
              "bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/80",
              "backdrop-blur-sm transition hover:bg-white/10",
            )}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: b.color, boxShadow: `0 0 10px ${b.color}` }}
              aria-hidden="true"
            />
            {b.label}
          </div>
        ))}
      </div>

      <Link
        to="/play"
        className={cn(
          "group mt-14 inline-flex items-center gap-3 rounded-full",
          "border border-white/30 bg-white/10 px-10 py-4",
          "text-sm uppercase tracking-[0.4em] text-white",
          "backdrop-blur-md transition",
          "hover:bg-white/20 hover:shadow-[0_0_40px_rgba(108,229,255,0.35)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        )}
      >
        <span>Enter</span>
        <span
          className="inline-block transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        >
          →
        </span>
      </Link>

      <div className="pointer-events-none absolute bottom-6 left-0 right-0 text-center text-[10px] uppercase tracking-[0.3em] text-white/30">
        Built with Tone.js · Three.js
      </div>
    </div>
  );
}
