import { useEffect } from "react";

interface Shortcuts {
  enabled: boolean;
  onToggleDj: () => void;
  onPrevScale: () => void;
  onNextScale: () => void;
  onToggleHelp: () => void;
  onCloseHelp: () => void;
}

export function useKeyboardShortcuts({
  enabled,
  onToggleDj,
  onPrevScale,
  onNextScale,
  onToggleHelp,
  onCloseHelp,
}: Shortcuts) {
  useEffect(() => {
    if (!enabled) return;
    const handleKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          onToggleDj();
          break;
        case "ArrowLeft":
        case "[":
          e.preventDefault();
          onPrevScale();
          break;
        case "ArrowRight":
        case "]":
          e.preventDefault();
          onNextScale();
          break;
        case "?":
        case "h":
        case "H":
          e.preventDefault();
          onToggleHelp();
          break;
        case "Escape":
          onCloseHelp();
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [enabled, onToggleDj, onPrevScale, onNextScale, onToggleHelp, onCloseHelp]);
}
