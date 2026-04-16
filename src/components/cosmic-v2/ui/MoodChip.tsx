import { cn } from "@/lib/utils";

interface MoodChipProps {
  label: string;
  className?: string;
}

export function MoodChip({ label, className }: MoodChipProps) {
  return (
    <div
      className={cn(
        "fixed top-6 left-1/2 -translate-x-1/2 z-30 rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/70 backdrop-blur-md",
        className,
      )}
      aria-live="polite"
    >
      {label}
    </div>
  );
}
