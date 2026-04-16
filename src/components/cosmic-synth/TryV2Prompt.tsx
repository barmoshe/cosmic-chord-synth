import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "cosmic-tryv2-dismissed";
const SHOW_DELAY_MS = 6000;

interface TryV2PromptProps {
  visible: boolean;
}

export default function TryV2Prompt({ visible }: TryV2PromptProps) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    if (!visible || dismissed) return;
    const t = setTimeout(() => setShow(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [visible, dismissed]);

  const handleDismiss = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShow(false);
    setDismissed(true);
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch { /* quota exceeded */ }
  };

  if (!show) return null;

  return (
    <Link
      to="/v2"
      aria-label="Try Cosmic v2"
      className={cn(
        "fixed top-3 right-3 z-[40] flex items-center gap-2 rounded-full pl-2.5 pr-3 py-2",
        "border border-white/20 bg-gradient-to-br from-indigo-400/25 to-cyan-400/25",
        "text-white text-[11px] uppercase tracking-[0.15em] backdrop-blur-md",
        "font-[Orbitron,monospace] no-underline pointer-events-auto",
        "animate-in fade-in slide-in-from-top-2 duration-500",
      )}
    >
      <Sparkles size={13} className="text-amber-300" />
      <span>Try v2</span>
      <button
        onClick={handleDismiss}
        onTouchStart={handleDismiss}
        aria-label="Dismiss v2 invitation"
        className="ml-1 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white/10 text-white/70 border-0 p-0 cursor-pointer"
      >
        <X size={11} />
      </button>
    </Link>
  );
}
