import { useCallback, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { ThemeId } from "@/components/biome-synth/shared/constants";

export interface HomeBiomeTileProps {
  id: ThemeId;
  label: string;
  color: string;
  meta: string;
  hint: string;
  visible: boolean;
  delayMs: number;
  onPreview: (id: ThemeId) => void;
}

export default function HomeBiomeTile({
  id,
  label,
  color,
  meta,
  hint,
  visible,
  delayMs,
  onPreview,
}: HomeBiomeTileProps) {
  const handleActivate = useCallback(() => {
    onPreview(id);
  }, [id, onPreview]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleActivate();
      }
    },
    [handleActivate],
  );

  return (
    <div
      role="button"
      tabIndex={visible ? 0 : -1}
      aria-label={`${label} biome — preview a note (${hint})`}
      aria-hidden={!visible}
      onPointerEnter={handleActivate}
      onPointerDown={handleActivate}
      onKeyDown={handleKeyDown}
      style={{
        ["--biome-color" as string]: color,
        transitionDelay: visible ? `${delayMs}ms` : "0ms",
      }}
      className={cn(
        "group relative isolate flex h-[82px] w-full cursor-pointer flex-col justify-between sm:h-[88px] sm:w-[152px]",
        "overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-left sm:px-4 sm:py-3",
        "backdrop-blur-md transition duration-700 ease-out",
        "hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.08] active:-translate-y-0.5 active:border-white/30 active:bg-white/[0.08]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        "[box-shadow:inset_0_1px_0_rgba(255,255,255,0.06)]",
        "hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.12),0_0_28px_-6px_var(--biome-color)]",
        "active:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.12),0_0_28px_-6px_var(--biome-color)]",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
        />
        <span className="font-['Orbitron'] truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-white sm:text-[11px] sm:tracking-[0.32em]">
          {label}
        </span>
      </div>
      <div className="font-['Raleway'] truncate text-[9px] font-light uppercase tracking-[0.18em] text-white/50 sm:text-[10px] sm:tracking-[0.22em]">
        {meta}
      </div>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition duration-300",
          "group-hover:opacity-100 group-active:opacity-100",
        )}
        style={{
          background: `radial-gradient(120% 100% at 50% 120%, ${color}26 0%, transparent 60%)`,
        }}
      />
    </div>
  );
}
