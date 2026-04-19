import { useEffect } from "react";

interface HelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function HelpOverlay({ open, onClose }: HelpOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="cosmic-help-backdrop"
      onClick={onClose}
      onTouchStart={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); onClose(); } }}
      role="dialog"
      aria-modal="true"
      aria-label="Controls help"
    >
      <div className="cosmic-help-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="cosmic-help-close"
          onTouchStart={(e) => { e.preventDefault(); onClose(); }}
          onClick={onClose}
          aria-label="Close help"
        >
          ×
        </button>

        <div className="cosmic-help-title">How to Play</div>
        <div className="cosmic-help-subtitle">A 3D galaxy you can touch.</div>

        <section className="cosmic-help-section">
          <div className="cosmic-help-section-title">Gestures</div>
          <ul className="cosmic-help-list">
            <li><span className="cosmic-help-key">Touch</span> anywhere to trigger a note</li>
            <li><span className="cosmic-help-key">Drag</span> to sweep pitch &amp; filter</li>
            <li><span className="cosmic-help-key">Multi&#8209;touch</span> layers chords</li>
            <li><span className="cosmic-help-key">Tap cells</span> in the DJ grid to edit drums</li>
          </ul>
        </section>

        <section className="cosmic-help-section">
          <div className="cosmic-help-section-title">Keyboard</div>
          <ul className="cosmic-help-list">
            <li><span className="cosmic-help-kbd">Space</span> toggle AI DJ</li>
            <li><span className="cosmic-help-kbd">←</span> <span className="cosmic-help-kbd">→</span> change scale</li>
            <li><span className="cosmic-help-kbd">H</span> / <span className="cosmic-help-kbd">?</span> show / hide this help</li>
            <li><span className="cosmic-help-kbd">Esc</span> close this panel</li>
          </ul>
        </section>

        <section className="cosmic-help-section">
          <div className="cosmic-help-section-title">Axes</div>
          <ul className="cosmic-help-list">
            <li><strong>Horizontal</strong> — pitch (low → high)</li>
            <li><strong>Vertical</strong> — filter (closed ↓ · open ↑)</li>
          </ul>
        </section>

        <div className="cosmic-help-footer">Tap outside · press Esc · or the × above</div>
      </div>
    </div>
  );
}
