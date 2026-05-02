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
      className="biome-help-backdrop"
      onClick={onClose}
      onTouchStart={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); onClose(); } }}
      role="dialog"
      aria-modal="true"
      aria-label="Controls help"
    >
      <div className="biome-help-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="biome-help-close"
          onTouchStart={(e) => { e.preventDefault(); onClose(); }}
          onClick={onClose}
          aria-label="Close help"
        >
          ×
        </button>

        <div className="biome-help-title">How to Play</div>
        <div className="biome-help-subtitle">A playable world you can touch.</div>

        <section className="biome-help-section">
          <div className="biome-help-section-title">Gestures</div>
          <ul className="biome-help-list">
            <li><span className="biome-help-key">Touch</span> anywhere to trigger a note</li>
            <li><span className="biome-help-key">Drag</span> to sweep pitch &amp; filter</li>
            <li><span className="biome-help-key">Multi&#8209;touch</span> layers chords</li>
            <li><span className="biome-help-key">Tap cells</span> in the DJ grid to edit drums</li>
          </ul>
        </section>

        <section className="biome-help-section">
          <div className="biome-help-section-title">Keyboard</div>
          <ul className="biome-help-list">
            <li><span className="biome-help-kbd">Space</span> toggle AI DJ</li>
            <li><span className="biome-help-kbd">←</span> <span className="biome-help-kbd">→</span> change scale</li>
            <li><span className="biome-help-kbd">L</span> expand / collapse DJ console</li>
            <li><span className="biome-help-kbd">H</span> / <span className="biome-help-kbd">?</span> show / hide this help</li>
            <li><span className="biome-help-kbd">Esc</span> close this panel</li>
          </ul>
        </section>

        <section className="biome-help-section">
          <div className="biome-help-section-title">Axes</div>
          <ul className="biome-help-list">
            <li><strong>Horizontal</strong> — pitch (low → high)</li>
            <li><strong>Vertical</strong> — filter (closed ↓ · open ↑)</li>
          </ul>
        </section>

        <div className="biome-help-footer">Tap outside · press Esc · or the × above</div>
      </div>
    </div>
  );
}
