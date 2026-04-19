import { useEffect, useCallback } from "react";

export function useSetupEffects(
  hideTimerRef: React.MutableRefObject<any>,
  setShowUI: (v: boolean) => void,
  hintDismissed: boolean,
  setHintDismissed: (v: boolean) => void,
) {
  // Load fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Raleway:wght@200;300;400;500&display=swap";
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  // Disable context menu
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", prevent, { passive: false } as any);
    const style = document.createElement("style");
    style.textContent = `*{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important;-webkit-tap-highlight-color:transparent!important;}`;
    document.head.appendChild(style);
    return () => {
      document.removeEventListener("contextmenu", prevent);
      try { document.head.removeChild(style); } catch {}
    };
  }, []);

  const resetUIHide = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    setShowUI(true);
    hideTimerRef.current = setTimeout(() => setShowUI(false), 4000);
    if (!hintDismissed) setHintDismissed(true);
  }, [hintDismissed, hideTimerRef, setShowUI, setHintDismissed]);

  return { resetUIHide };
}
