import { useCallback, useEffect, useMemo, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  SCALES,
  THEME_PRESETS,
  type ThemeId,
} from "@/components/biome-synth/shared/constants";
import HomeBiomeTile from "./HomeBiomeTile";
import { HOME_TEASER_BEATS, useHomeState } from "./HomeStateContext";

interface BiomeDetail {
  id: ThemeId;
  label: string;
  color: string;
  hint: string;
}

const BIOME_DETAILS: BiomeDetail[] = [
  { id: "space",     label: "SPACE",     color: "#6CE5FF", hint: "Cosmic galaxy" },
  { id: "jungle",    label: "JUNGLE",    color: "#3CC38A", hint: "Canopy + monkeys" },
  { id: "sea",       label: "SEA",       color: "#2FA6FF", hint: "Reef + waves" },
  { id: "cyberpunk", label: "CYBERPUNK", color: "#FF2CA8", hint: "Neon city + rain" },
];

function biomeMeta(id: ThemeId): string {
  const preset = THEME_PRESETS[id];
  const scaleLabel = SCALES[preset.scale]?.label ?? preset.scale.toUpperCase();
  return `${scaleLabel} · ${preset.bpm} BPM`;
}

export default function HomeHero() {
  const { stage, beat, begin, skip, previewBiome } = useHomeState();

  const biomes = useMemo(
    () => BIOME_DETAILS.map((b) => ({ ...b, meta: biomeMeta(b.id) })),
    [],
  );

  const handleBegin = useCallback(() => {
    if (stage === "idle") void begin();
  }, [stage, begin]);

  const handleGateKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (stage !== "idle") return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        void begin();
      }
    },
    [stage, begin],
  );

  // Allow keyboard activation from anywhere on the page while idle.
  useEffect(() => {
    if (stage !== "idle") return;
    const handleWindowKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      event.preventDefault();
      void begin();
    };
    window.addEventListener("keydown", handleWindowKey);
    return () => window.removeEventListener("keydown", handleWindowKey);
  }, [stage, begin]);

  const handlePreview = useCallback(
    (id: ThemeId) => {
      previewBiome(id);
    },
    [previewBiome],
  );

  const handleStopPointer = useCallback((event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
  }, []);

  const handleSkipClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      skip();
    },
    [skip],
  );

  const handleCtaClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  }, []);

  const tilesVisible = stage !== "idle";
  const ctaProminent = stage === "ready";

  return (
    <section
      onPointerDown={handleBegin}
      onKeyDown={handleGateKeyDown}
      tabIndex={stage === "idle" ? 0 : -1}
      aria-label={stage === "idle" ? "Tap anywhere to play the teaser" : "Biome Synth landing"}
      className={cn(
        "relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center",
        stage === "idle" ? "cursor-pointer" : "cursor-default",
        "focus-visible:outline-none",
      )}
    >
      <div className="font-['Raleway'] mb-5 text-[11px] font-light uppercase tracking-[0.55em] text-white/45">
        Interactive music experience
      </div>

      <h1
        className={cn(
          "font-['Orbitron'] font-semibold text-white",
          "text-[clamp(3rem,10vw,7.25rem)] leading-none tracking-[0.22em]",
          "bg-gradient-to-b from-white via-white/95 to-white/40 bg-clip-text text-transparent",
          "drop-shadow-[0_0_42px_rgba(108,229,255,0.28)]",
        )}
      >
        BIOME&nbsp;SYNTH
      </h1>

      <p className="font-['Raleway'] mt-7 max-w-xl text-base font-light text-white/70 sm:text-lg">
        A playable world. Touch it to make music across four living biomes —
        or let the AI DJ compose for you.
      </p>

      <div className="mt-10 flex h-9 items-center justify-center" aria-live="polite">
        {stage === "idle" && (
          <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/[0.04] px-5 py-2 backdrop-blur-md">
            <span aria-hidden="true" className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-200" />
            </span>
            <span className="font-['Orbitron'] text-[11px] uppercase tracking-[0.4em] text-white/85">
              Tap anywhere to listen
            </span>
          </div>
        )}

        {stage === "listening" && (
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-1.5"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={HOME_TEASER_BEATS}
              aria-valuenow={beat}
              aria-label="Teaser progress"
            >
              {Array.from({ length: HOME_TEASER_BEATS }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-[3px] w-6 rounded-full transition-all duration-500",
                    i < beat
                      ? "bg-cyan-300/95 shadow-[0_0_10px_rgba(108,229,255,0.7)]"
                      : "bg-white/15",
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onPointerDown={handleStopPointer}
              onClick={handleSkipClick}
              className="font-['Orbitron'] text-[10px] uppercase tracking-[0.4em] text-white/55 transition hover:text-white"
            >
              Skip
            </button>
          </div>
        )}

        {stage === "ready" && (
          <div className="font-['Orbitron'] text-[11px] uppercase tracking-[0.5em] text-white/55">
            Hover a biome · then enter
          </div>
        )}
      </div>

      <div
        className={cn(
          "mt-10 flex flex-wrap items-stretch justify-center gap-3 transition-opacity duration-700",
          tilesVisible ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {biomes.map((b, idx) => (
          <HomeBiomeTile
            key={b.id}
            id={b.id}
            label={b.label}
            color={b.color}
            meta={b.meta}
            hint={b.hint}
            visible={tilesVisible}
            delayMs={120 * idx}
            onPreview={handlePreview}
          />
        ))}
      </div>

      <Link
        to="/play"
        onPointerDown={handleStopPointer}
        onClick={handleCtaClick}
        className={cn(
          "group mt-12 inline-flex items-center gap-3 rounded-full border px-10 py-4",
          "font-['Orbitron'] text-sm uppercase tracking-[0.4em] text-white",
          "backdrop-blur-md transition duration-500",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
          ctaProminent
            ? "border-white/45 bg-white/15 shadow-[0_0_42px_-6px_rgba(108,229,255,0.55)] hover:bg-white/25 hover:shadow-[0_0_60px_-2px_rgba(108,229,255,0.7)]"
            : "border-white/25 bg-white/[0.06] hover:border-white/40 hover:bg-white/10",
        )}
      >
        <span>Enter the world</span>
        <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
          →
        </span>
      </Link>

      <div className="font-['Raleway'] pointer-events-none absolute bottom-6 left-0 right-0 text-center text-[10px] font-light uppercase tracking-[0.35em] text-white/35">
        Built with Tone.js · Three.js
      </div>
    </section>
  );
}
