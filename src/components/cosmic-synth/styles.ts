export const COSMIC_STYLES = `
        /* ── z-layer map ──
           canvas 1 · jungle decor 3 (isolate, inner: back 1 · mid 2 · front 3) ·
           axis 8 · energy-bar 9 · HUD (header/hint/scale) 10 · glow overlays 12 ·
           DJ panel 14 · flash/error 15 · theme pill 30 · audio badge 50 ·
           splash/warp 100. Jungle decor is decorative (pointer-events:none) and
           must stay behind every interactive/textual chrome. 'isolation: isolate'
           on .jungle-overlay pins its inner stacking context so back/mid/front
           scene layers order monkeys between background vines and foreground
           trees without leaking out. A clip-path on the overlay keeps decor from
           painting above the top viewport band (header, audio badge, theme pill). */

        /* ── Cosmic Design System v4 — "Glacial Aurora 2026" lifted-navy theme ── */
        @keyframes cosmicGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes cosmicPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes cosmicFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes cosmicRing {
          0% { transform: scale(0.8); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.2; }
          100% { transform: scale(0.8); opacity: 0.6; }
        }
        @keyframes cosmicFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cosmicShimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes cosmicWarpPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .cosmic-splash {
          position: fixed; inset: 0; z-index: 100;
          display: flex; align-items: center; justify-content: center;
          background: radial-gradient(ellipse at center, rgba(22,37,64,0.85) 0%, rgba(15,27,45,0.95) 100%);
          backdrop-filter: blur(8px);
          cursor: pointer; touch-action: none;
        }
        .cosmic-splash-inner {
          display: flex; flex-direction: column; align-items: center; gap: 28px;
          animation: cosmicFadeIn 1.2s ease-out;
        }
        .cosmic-logo {
          font-family: 'Orbitron', monospace;
          font-size: clamp(28px, 7vw, 58px);
          font-weight: 900;
          letter-spacing: 0.22em;
          background: linear-gradient(135deg, #14B8A6 0%, #22D3EE 35%, #818CF8 70%, #FCD34D 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 300% 100%;
          animation: cosmicGradient 6s ease infinite;
          text-align: center;
          filter: drop-shadow(0 0 30px rgba(34,211,238,0.4));
        }
        .cosmic-subtitle-group {
          display: flex; align-items: center; gap: 16px;
        }
        .cosmic-line {
          width: clamp(30px, 8vw, 80px); height: 1px;
          background: linear-gradient(90deg, transparent, rgba(229,244,251,0.35), transparent);
        }
        .cosmic-subtitle {
          font-family: 'Raleway', sans-serif;
          font-size: clamp(10px, 1.8vw, 14px);
          font-weight: 300;
          letter-spacing: 0.35em;
          color: #B4C9E0;
        }
        .cosmic-cta {
          position: relative;
          display: flex; align-items: center; justify-content: center;
          margin-top: 20px;
          animation: cosmicFloat 3s ease-in-out infinite;
        }
        .cosmic-cta span {
          font-family: 'Orbitron', monospace;
          font-size: clamp(11px, 2.2vw, 15px);
          font-weight: 400;
          letter-spacing: 0.3em;
          color: #22D3EE;
          animation: cosmicPulse 2.5s ease-in-out infinite;
        }
        .cosmic-cta-ring {
          position: absolute;
          width: 100px; height: 100px;
          border: 1px solid rgba(34,211,238,0.3);
          border-radius: 50%;
          animation: cosmicRing 3s ease-in-out infinite;
        }

        .cosmic-warp {
          position: fixed; inset: 0; z-index: 100;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px;
          background: radial-gradient(ellipse at center, rgba(22,37,64,0.7) 0%, rgba(15,27,45,0.9) 100%);
          backdrop-filter: blur(4px);
        }
        .cosmic-warp-text {
          font-family: 'Orbitron', monospace;
          font-size: clamp(11px, 2.2vw, 15px);
          font-weight: 400;
          letter-spacing: 0.4em;
          color: #22D3EE;
          animation: cosmicWarpPulse 1s ease-in-out infinite;
        }
        .cosmic-warp-bar {
          width: clamp(180px, 50vw, 350px); height: 3px;
          background: rgba(229,244,251,0.1);
          border-radius: 2px; overflow: hidden;
        }
        .cosmic-warp-fill {
          height: 100%;
          background: linear-gradient(90deg, #22D3EE, #818CF8);
          border-radius: 2px;
          transition: width 0.1s linear;
          box-shadow: 0 0 12px rgba(34,211,238,0.5);
        }

        .cosmic-header {
          position: fixed; top: 24px; left: 0; right: 0; z-index: 10;
          display: flex; flex-direction: column; align-items: center;
          pointer-events: none;
          transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cosmic-header-title {
          font-family: 'Orbitron', monospace;
          font-size: clamp(11px, 2vw, 15px);
          font-weight: 500;
          letter-spacing: 0.35em;
          background: linear-gradient(90deg, #22D3EE, #818CF8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
        }
        .cosmic-header-sub {
          font-family: 'Raleway', sans-serif;
          font-size: 11px; font-weight: 300;
          letter-spacing: 0.2em;
          color: #7C95B5;
        }

        .cosmic-hint {
          position: fixed; bottom: 180px; left: 0; right: 0; z-index: 10;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          text-align: center;
          font-family: 'Raleway', sans-serif;
          font-size: clamp(11px, 1.8vw, 14px);
          font-weight: 300;
          letter-spacing: 0.25em;
          color: #7C95B5;
          pointer-events: none;
          animation: cosmicPulse 3.5s ease-in-out infinite;
        }
        .cosmic-hint-detail {
          font-size: clamp(9px, 1.4vw, 11px);
          letter-spacing: 0.15em;
          color: #5A7295;
        }

        .cosmic-btn {
          all: unset;
          display: flex; align-items: center; justify-content: center;
          background: rgba(229,244,251,0.05);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(229,244,251,0.12);
          box-shadow: 0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(229,244,251,0.06);
          cursor: pointer; touch-action: none;
          user-select: none; -webkit-user-select: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cosmic-btn:hover {
          background: rgba(229,244,251,0.09);
          border-color: rgba(229,244,251,0.2);
        }
        .cosmic-btn:active {
          transform: scale(0.95);
        }

        .cosmic-btn-auto {
          flex-direction: column; gap: 3px;
          width: 56px; height: 56px; border-radius: 50%;
          font-family: 'Orbitron', monospace;
          color: #B4C9E0;
        }
        .cosmic-btn-auto .cosmic-btn-icon {
          font-size: 16px; line-height: 1;
        }
        .cosmic-btn-auto .cosmic-btn-label {
          font-size: 8px; letter-spacing: 0.15em; font-weight: 500;
        }
        .cosmic-btn-auto.active {
          color: #22D3EE;
          background: rgba(34,211,238,0.12);
          border-color: rgba(34,211,238,0.4);
          box-shadow: 0 0 30px rgba(34,211,238,0.25), inset 0 0 15px rgba(34,211,238,0.08);
          animation: cosmicPulse 2s ease-in-out infinite;
        }

        .cosmic-btn-arrow {
          width: 38px; height: 38px; border-radius: 50%;
          font-family: 'Raleway', sans-serif;
          font-size: 18px; font-weight: 300;
          color: #7C95B5;
        }

        /* ── Cosmic Conductor — bottom-docked DJ console ──
           Wrapper is pointer-events:none so galaxy taps pass through padding;
           interactive children re-enable events. Z-index sits above HUD (10) but
           below transition overlays (15). */
        .conductor-root {
          position: fixed;
          left: 50%;
          bottom: 16px;
          transform: translateX(-50%);
          z-index: 14;
          display: flex; flex-direction: column; align-items: stretch;
          gap: 10px;
          width: min(420px, calc(100vw - 24px));
          pointer-events: none;
          font-family: 'Orbitron', monospace;
          color: #B4C9E0;
          user-select: none; -webkit-user-select: none;
        }

        .conductor-transport,
        .conductor-drawer {
          pointer-events: auto;
          background: linear-gradient(135deg, rgba(22,37,64,0.78) 0%, rgba(15,27,45,0.86) 100%);
          border: 1px solid rgba(129,140,248,0.25);
          box-shadow: 0 12px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(229,244,251,0.06), 0 0 28px rgba(34,211,238,0.08);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border-radius: 14px;
        }

        .conductor-transport {
          display: grid;
          grid-template-columns: 44px 1fr 26px 32px;
          align-items: center;
          gap: 12px;
          padding: 9px 12px;
        }

        /* Play / pause toggle with pulsing aurora ring */
        .conductor-toggle {
          all: unset;
          position: relative;
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          background: rgba(229,244,251,0.04);
          border: 1px solid rgba(129,140,248,0.25);
          cursor: pointer; touch-action: manipulation;
          transition: background 0.25s, border-color 0.25s, box-shadow 0.25s;
          color: #B4C9E0;
        }
        .conductor-toggle:hover { background: rgba(129,140,248,0.12); border-color: rgba(129,140,248,0.45); }
        .conductor-toggle:active { transform: scale(0.96); }
        .conductor-toggle.is-active {
          background: rgba(34,211,238,0.14);
          border-color: rgba(34,211,238,0.55);
          box-shadow: 0 0 22px rgba(34,211,238,0.3), inset 0 0 10px rgba(34,211,238,0.12);
          color: #22D3EE;
        }
        .conductor-toggle-icon { font-size: 14px; line-height: 1; pointer-events: none; }
        .conductor-toggle-ring {
          position: absolute; inset: -4px;
          border-radius: 50%;
          border: 1.5px solid rgba(34,211,238,0.55);
          opacity: 0; pointer-events: none;
          transform: scale(1); transform-origin: center;
          box-shadow: 0 0 14px rgba(34,211,238,0.5);
        }

        .conductor-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .conductor-phase {
          font-size: 12px; font-weight: 700; letter-spacing: 0.24em;
          color: #B4C9E0;
          text-shadow: 0 0 10px rgba(34,211,238,0.25);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .conductor-phase-idle     { color: #7C95B5; text-shadow: none; }
        .conductor-phase-drift    { color: #5FEED0; text-shadow: 0 0 10px rgba(95,238,208,0.5); }
        .conductor-phase-pulse    { color: #818CF8; text-shadow: 0 0 10px rgba(129,140,248,0.5); }
        .conductor-phase-bloom    { color: #22D3EE; text-shadow: 0 0 10px rgba(34,211,238,0.55); }
        .conductor-phase-surge    { color: #FCD34D; text-shadow: 0 0 14px rgba(252,211,77,0.6); }
        .conductor-phase-dissolve { color: #14B8A6; text-shadow: 0 0 10px rgba(20,184,166,0.5); }

        .conductor-sub {
          display: flex; align-items: baseline; gap: 10px;
          font-size: 9px; letter-spacing: 0.18em; color: #7C95B5;
        }
        .conductor-bpm {
          font-weight: 700; font-size: 12px; letter-spacing: 0.06em;
          background: linear-gradient(90deg, #22D3EE, #818CF8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .conductor-bpm-unit { font-size: 7px; letter-spacing: 0.2em; color: #7C95B5; margin-left: 3px; -webkit-text-fill-color: #7C95B5; }
        .conductor-next { font-size: 9px; color: #7C95B5; white-space: nowrap; }

        /* Energy dial — SVG radial gauge */
        .conductor-energy { display: block; overflow: visible; }
        .conductor-energy-track {
          fill: none; stroke: rgba(229,244,251,0.08); stroke-width: 2.5;
        }
        .conductor-energy-arc {
          fill: none; stroke: url(#_never); stroke: #22D3EE; stroke-width: 2.5;
          stroke-linecap: round;
          transform: rotate(-90deg); transform-origin: center;
          filter: drop-shadow(0 0 4px rgba(34,211,238,0.5));
          transition: stroke-dashoffset 0.15s linear;
        }

        /* Expand chevron */
        .conductor-expand {
          all: unset;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          background: rgba(229,244,251,0.04);
          border: 1px solid rgba(129,140,248,0.22);
          color: #B4C9E0;
          cursor: pointer; touch-action: manipulation;
          font-size: 14px; line-height: 1;
          transition: background 0.2s, border-color 0.2s;
        }
        .conductor-expand:hover { background: rgba(129,140,248,0.12); border-color: rgba(129,140,248,0.4); }
        .conductor-expand:active { transform: scale(0.94); }

        /* Drawer */
        .conductor-drawer {
          padding: 12px 14px 14px;
          display: flex; flex-direction: column; gap: 12px;
          transform-origin: bottom center;
          animation: conductorDrawerIn 0.24s cubic-bezier(0.2, 0.8, 0.3, 1.2);
        }
        @keyframes conductorDrawerIn {
          from { opacity: 0; transform: translateY(6px) scaleY(0.92); }
          to   { opacity: 1; transform: translateY(0)   scaleY(1); }
        }

        /* Section rail */
        .conductor-rail {
          display: block;
          padding-top: 2px;
        }
        .conductor-rail-track {
          position: relative;
          display: flex;
          height: 22px;
          border-radius: 6px;
          overflow: hidden;
          background: rgba(229,244,251,0.05);
          border: 1px solid rgba(129,140,248,0.16);
        }
        .conductor-rail-seg {
          position: relative;
          display: flex; align-items: center; justify-content: center;
          min-width: 0;
          border-right: 1px solid rgba(22,37,64,0.5);
          background: linear-gradient(180deg, rgba(229,244,251,0.04), rgba(229,244,251,0.0));
          opacity: 0.5;
          transition: opacity 0.3s, box-shadow 0.3s;
        }
        .conductor-rail-seg:last-child { border-right: none; }
        .conductor-rail-seg.is-next { opacity: 0.75; }
        .conductor-rail-seg.is-current { opacity: 1; }
        .conductor-rail-drift.is-current    { background: linear-gradient(180deg, rgba(95,238,208,0.28), rgba(95,238,208,0.08)); box-shadow: inset 0 0 12px rgba(95,238,208,0.3); }
        .conductor-rail-pulse.is-current    { background: linear-gradient(180deg, rgba(129,140,248,0.28), rgba(129,140,248,0.08)); box-shadow: inset 0 0 12px rgba(129,140,248,0.3); }
        .conductor-rail-bloom.is-current    { background: linear-gradient(180deg, rgba(34,211,238,0.28), rgba(34,211,238,0.08));  box-shadow: inset 0 0 12px rgba(34,211,238,0.32); }
        .conductor-rail-surge.is-current    { background: linear-gradient(180deg, rgba(252,211,77,0.3),  rgba(252,211,77,0.08));  box-shadow: inset 0 0 14px rgba(252,211,77,0.36); }
        .conductor-rail-dissolve.is-current { background: linear-gradient(180deg, rgba(20,184,166,0.28), rgba(20,184,166,0.08));  box-shadow: inset 0 0 12px rgba(20,184,166,0.3); }
        .conductor-rail-label {
          font-size: 8px; letter-spacing: 0.22em; font-weight: 600;
          color: rgba(180,201,224,0.85);
          text-shadow: 0 0 6px rgba(0,0,0,0.5);
          padding: 0 4px;
          white-space: nowrap; overflow: hidden; text-overflow: clip;
        }
        .conductor-rail-playhead {
          position: absolute;
          top: -2px; bottom: -2px;
          width: 2px;
          left: 0;
          background: linear-gradient(180deg, #FCD34D, #FFFFFF 50%, #FCD34D);
          box-shadow: 0 0 8px rgba(252,211,77,0.9), 0 0 16px rgba(252,211,77,0.5);
          border-radius: 2px;
          transform: translateX(-1px);
          opacity: 0;
          transition: left 0.12s linear, opacity 0.2s;
          pointer-events: none;
        }

        /* Beat grid */
        .conductor-grid {
          display: flex; flex-direction: column;
          gap: 4px;
        }
        .conductor-row {
          display: grid;
          grid-template-columns: 32px 1fr;
          align-items: center;
          gap: 8px;
        }
        .conductor-row-head {
          display: flex; align-items: center; gap: 5px;
          font-size: 9px; letter-spacing: 0.18em; font-weight: 600;
          color: #7C95B5;
        }
        .conductor-row-dot {
          display: inline-block;
          width: 7px; height: 7px; border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #FCD34D, #F59E0B 70%);
          box-shadow: 0 0 8px rgba(252,211,77,0.7);
          opacity: 0.35;
          will-change: transform, opacity;
        }
        .conductor-row-kick  .conductor-row-dot { background: radial-gradient(circle at 30% 30%, #FCD34D, #F59E0B 70%); box-shadow: 0 0 8px rgba(252,211,77,0.75); }
        .conductor-row-clap  .conductor-row-dot { background: radial-gradient(circle at 30% 30%, #FCA5A5, #F87171 70%); box-shadow: 0 0 8px rgba(248,113,113,0.7); }
        .conductor-row-hat   .conductor-row-dot { background: radial-gradient(circle at 30% 30%, #FED7AA, #FB923C 70%); box-shadow: 0 0 8px rgba(251,146,60,0.7); }
        .conductor-row-snare .conductor-row-dot { background: radial-gradient(circle at 30% 30%, #FBCFE8, #F472B6 70%); box-shadow: 0 0 8px rgba(244,114,182,0.7); }
        .conductor-row-label { min-width: 10px; }

        .conductor-cells {
          display: grid;
          grid-template-columns: repeat(16, 1fr);
          gap: 2px;
        }
        .conductor-cell {
          /* Rendered as a <button> — reset native chrome */
          appearance: none; -webkit-appearance: none;
          font: inherit; color: inherit; margin: 0; padding: 0;
          display: block;
          position: relative;
          height: 14px;
          border-radius: 3px;
          background: rgba(229,244,251,0.08);
          border: 1px solid rgba(129,140,248,0.14);
          transition: transform 0.08s linear, box-shadow 0.08s linear, border-color 0.15s;
          opacity: 0.1;
          will-change: opacity, transform;
          cursor: pointer;
          touch-action: manipulation;
          overflow: hidden;
        }
        .conductor-cell:focus-visible { outline: 2px solid rgba(34,211,238,0.8); outline-offset: 2px; }
        .conductor-cell:active { transform: scale(0.92); }
        .conductor-cell.is-downbeat { border-left: 1px solid rgba(129,140,248,0.35); }
        .conductor-row-kick  .conductor-cell { background: linear-gradient(180deg, rgba(252,211,77,0.9),  rgba(252,211,77,0.4));  border-color: rgba(252,211,77,0.35); }
        .conductor-row-clap  .conductor-cell { background: linear-gradient(180deg, rgba(248,113,113,0.9), rgba(248,113,113,0.4)); border-color: rgba(248,113,113,0.35); }
        .conductor-row-hat   .conductor-cell { background: linear-gradient(180deg, rgba(251,146,60,0.9),  rgba(251,146,60,0.4));  border-color: rgba(251,146,60,0.35); }
        .conductor-row-snare .conductor-cell { background: linear-gradient(180deg, rgba(244,114,182,0.9), rgba(244,114,182,0.4)); border-color: rgba(244,114,182,0.35); }
        .conductor-cell[data-active="1"] {
          outline: 1.5px solid rgba(252,211,77,0.95);
          outline-offset: 1px;
          transform: scaleY(1.18);
          box-shadow: 0 0 10px rgba(252,211,77,0.75);
        }
        /* User-edit markers — dashed ring on user-toggled cells. */
        .conductor-cell[data-user="on"] {
          border-color: rgba(34,211,238,0.85) !important;
          box-shadow: inset 0 0 0 1px rgba(34,211,238,0.45);
        }
        .conductor-cell[data-user="off"] {
          background: rgba(229,244,251,0.05) !important;
          border: 1px dashed rgba(229,244,251,0.35) !important;
        }

        /* ── Jungle fruit sprite overlay (rendered inside each cell on jungle theme) ── */
        .conductor-cell-fruit {
          position: absolute;
          inset: -2px;
          background-image: url('/fruits.svg');
          background-repeat: no-repeat;
          background-size: 400% 400%;
          background-position: 0% 0%;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        /* One row per lane; frame 0 (col 0) is the resting fruit. */
        .conductor-row-kick  .conductor-cell-fruit { background-position: 0% 0%;       }
        .conductor-row-snare .conductor-cell-fruit { background-position: 0% 33.3333%; }
        .conductor-row-hat   .conductor-cell-fruit { background-position: 0% 66.6666%; }
        .conductor-row-clap  .conductor-cell-fruit { background-position: 0% 100%;     }

        @media (max-width: 480px) {
          .conductor-root {
            bottom: 12px;
            width: calc(100vw - 20px);
            gap: 8px;
          }
          .conductor-transport {
            grid-template-columns: 40px 1fr 24px 28px;
            padding: 8px 10px;
          }
          .conductor-toggle { width: 40px; height: 40px; }
          .conductor-drawer { padding: 10px 10px 12px; gap: 10px; }
          .conductor-row { grid-template-columns: 24px 1fr; gap: 6px; }
          .conductor-cell { height: 10px; }
          .conductor-rail-track { height: 18px; }
          .conductor-rail-label { font-size: 7px; letter-spacing: 0.15em; }
        }

        @media (prefers-reduced-motion: reduce) {
          .conductor-toggle-ring { display: none; }
          .conductor-drawer { animation: none; }
          .conductor-cell { transition: none; }
          .conductor-rail-playhead { transition: opacity 0.2s; }
        }

        .cosmic-scale-group {
          position: fixed; top: 18px; right: 18px; z-index: 10;
          display: flex; align-items: center; gap: 10px;
        }
        .cosmic-scale-label {
          font-family: 'Orbitron', monospace;
          font-size: clamp(11px, 2vw, 14px);
          font-weight: 500;
          letter-spacing: 0.22em;
          color: #B4C9E0;
          min-width: 65px; text-align: center;
        }

        .cosmic-flash {
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 15;
          font-family: 'Orbitron', monospace;
          font-size: clamp(28px, 6vw, 52px);
          font-weight: 900;
          letter-spacing: 0.3em;
          background: linear-gradient(135deg, #14B8A6, #22D3EE, #818CF8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 20px rgba(34,211,238,0.5));
          pointer-events: none;
          animation: cosmicPulse 1.5s ease-out forwards;
        }


        .cosmic-error {
          position: fixed; top: 65px; left: 50%;
          transform: translateX(-50%);
          z-index: 15;
          font-family: 'Raleway', sans-serif;
          font-size: 11px;
          color: #FB7185;
          letter-spacing: 0.1em;
        }

        .cosmic-axis-label {
          position: fixed; z-index: 8;
          font-family: 'Raleway', sans-serif;
          font-size: 9px;
          font-weight: 300;
          letter-spacing: 0.2em;
          color: #4A5F7A;
          pointer-events: none;
          text-transform: uppercase;
        }
        .cosmic-axis-top {
          top: 60px; left: 50%;
          transform: translateX(-50%);
        }
        .cosmic-axis-bottom {
          bottom: 128px; left: 50%;
          transform: translateX(-50%);
        }

        /* ── Audio status badge — bottom-right on desktop, repositioned on mobile ── */
        .cosmic-audio-status {
          position: fixed;
          bottom: 8px; right: 8px;
          z-index: 50;
          padding: 6px 10px;
          border-radius: 8px;
          color: #fff;
          font-size: 11px;
          font-family: monospace;
          letter-spacing: 0.04em;
          pointer-events: auto;
          user-select: none; -webkit-user-select: none;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.3s ease, transform 0.2s ease;
          box-shadow: 0 4px 14px rgba(0,0,0,0.4);
        }
        .cosmic-audio-status.is-ok  { background: rgba(30,180,120,0.85); }
        .cosmic-audio-status.is-err { background: rgba(220,60,60,0.9); animation: cosmicPulse 2s ease-in-out infinite; }
        .cosmic-audio-status:active { transform: scale(0.96); }
        .cosmic-audio-status-short { display: none; }

        .cosmic-energy-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 9;
          height: 2px;
          pointer-events: none;
        }
        .cosmic-energy-fill {
          height: 100%;
          background: linear-gradient(90deg, #14B8A6, #22D3EE, #FCD34D);
          transition: width 0.3s ease-out;
          box-shadow: 0 0 8px rgba(34,211,238,0.5), 0 0 16px rgba(129,140,248,0.25);
        }

        /* ── Theme chooser (segmented pill, top-left corner) ── */
        .theme-chooser {
          position: fixed;
          left: 12px;
          top: 12px;
          z-index: 30;
          display: flex;
          padding: 3px;
          gap: 2px;
          background: rgba(15, 27, 45, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
          pointer-events: auto;
        }
        .theme-chooser-option {
          appearance: none;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          font-family: 'Orbitron', monospace;
          font-size: 10px;
          letter-spacing: 0.16em;
          font-weight: 700;
          padding: 7px 12px;
          border-radius: 999px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease;
          touch-action: manipulation;
        }
        .theme-chooser-option:hover { color: #fff; }
        .theme-chooser-option.is-active {
          background: linear-gradient(135deg, rgba(34,211,238,0.25), rgba(129,140,248,0.25));
          color: #fff;
          box-shadow: inset 0 0 0 1px rgba(34,211,238,0.4);
        }
        .theme-chooser-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22D3EE;
          box-shadow: 0 0 8px #22D3EE;
        }
        .theme-chooser-option:nth-child(2) .theme-chooser-dot {
          background: #a3e635; box-shadow: 0 0 8px #a3e635;
        }

        /* ── Mobile layout overrides — keep chrome clear of the bottom-docked DJ panel ── */
        @media (max-width: 480px) {
          /* Theme chooser → top-left corner on mobile so the bottom band belongs
             to the DJ panel + drum flowers only. */
          .theme-chooser {
            bottom: auto;
            top: 10px;
            left: 10px;
            padding: 2px;
          }
          .theme-chooser-option {
            padding: 6px 9px;
            font-size: 9px;
            letter-spacing: 0.12em;
            gap: 5px;
          }
          .theme-chooser-dot { width: 6px; height: 6px; }

          /* Header → sits below the theme chooser, slimmed down so it doesn't collide */
          .cosmic-header { top: 48px; }
          .cosmic-header-title { font-size: 10px; letter-spacing: 0.28em; }
          .cosmic-header-sub   { font-size: 9px;  letter-spacing: 0.16em; }

          /* Scale group → stays top-right but tighter so it clears the header */
          .cosmic-scale-group {
            top: 10px;
            right: 10px;
            gap: 6px;
          }
          .cosmic-scale-label { font-size: 10px; min-width: 48px; letter-spacing: 0.16em; }
          .cosmic-btn-arrow   { width: 28px; height: 28px; font-size: 14px; }

          /* Axis labels → hide the bottom one (DJ panel eats the space); shrink side ones */
          .cosmic-axis-bottom { display: none; }
          .cosmic-axis-top    { top: 92px; font-size: 8px; }

          /* Hint → lift above the drum flowers and DJ panel */
          .cosmic-hint       { bottom: 170px; font-size: 10px; letter-spacing: 0.18em; }
          .cosmic-hint-detail { font-size: 9px; letter-spacing: 0.12em; }

          /* Audio status badge → compact chip, pinned bottom-left above the DJ handle */
          .cosmic-audio-status {
            bottom: 86px;
            left: 10px;
            right: auto;
            padding: 5px 9px;
            font-size: 10px;
            border-radius: 999px;
          }
          .cosmic-audio-status.is-ok .cosmic-audio-status-full,
          .cosmic-audio-status.is-err .cosmic-audio-status-full { display: none; }
          .cosmic-audio-status-short { display: inline; }
          /* When audio is healthy the badge is uninteresting chrome — fade it out */
          .cosmic-audio-status.is-ok { opacity: 0.55; }
        }

        /* ── Jungle theme overrides (applied when .theme-jungle on root wrapper) ── */
        .theme-jungle .cosmic-splash {
          background: radial-gradient(ellipse at center, rgba(20,61,40,0.85) 0%, rgba(10,31,20,0.95) 100%);
        }
        .theme-jungle .cosmic-logo {
          background: linear-gradient(135deg, #52b788 0%, #a3e635 40%, #ffe14d 70%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 300% 100%;
          filter: drop-shadow(0 0 30px rgba(163,230,53,0.45));
        }
        .theme-jungle .cosmic-warp {
          background: radial-gradient(ellipse at center, rgba(20,61,40,0.9) 0%, rgba(10,31,20,0.98) 100%);
        }
        .theme-jungle .cosmic-warp-text {
          background: linear-gradient(90deg, #a3e635, #ffe14d, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .theme-jungle .cosmic-warp-fill {
          background: linear-gradient(90deg, #a3e635, #ffe14d, #f59e0b);
          box-shadow: 0 0 12px rgba(163,230,53,0.6);
        }
        .theme-jungle .cosmic-header-title {
          background: linear-gradient(90deg, #a3e635, #ffe14d, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .theme-jungle .cosmic-energy-fill {
          background: linear-gradient(90deg, #52b788, #a3e635, #ffe14d, #f59e0b);
          box-shadow: 0 0 8px rgba(163,230,53,0.5), 0 0 16px rgba(255,225,77,0.25);
        }
        .theme-jungle .cosmic-cta-ring {
          border-color: rgba(163,230,53,0.6);
        }
        .theme-jungle .theme-chooser-option.is-active {
          background: linear-gradient(135deg, rgba(163,230,53,0.28), rgba(255,225,77,0.25));
          box-shadow: inset 0 0 0 1px rgba(163,230,53,0.5);
        }

        /* Scale label + arrow buttons — lime outline + banana glow */
        .theme-jungle .cosmic-scale-label {
          color: #ffe14d;
          text-shadow: 0 0 10px rgba(255,225,77,0.55), 0 0 24px rgba(163,230,53,0.35);
        }
        .theme-jungle .cosmic-btn-arrow {
          color: #a3e635;
          background: rgba(10,31,20,0.45);
          border: 1px solid rgba(163,230,53,0.45);
          box-shadow: 0 0 14px rgba(163,230,53,0.18), inset 0 0 8px rgba(255,225,77,0.08);
        }
        .theme-jungle .cosmic-btn-arrow:hover {
          background: rgba(163,230,53,0.14);
          border-color: rgba(255,225,77,0.55);
          box-shadow: 0 0 22px rgba(255,225,77,0.35), inset 0 0 10px rgba(163,230,53,0.18);
        }
        .theme-jungle .cosmic-btn-auto {
          color: #a3e635;
          background: rgba(10,31,20,0.5);
          border: 1px solid rgba(163,230,53,0.4);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }
        .theme-jungle .cosmic-btn-auto.active {
          color: #ffe14d;
          background: rgba(163,230,53,0.18);
          border-color: rgba(255,225,77,0.65);
          box-shadow: 0 0 30px rgba(255,225,77,0.35), inset 0 0 15px rgba(163,230,53,0.18);
        }

        /* Axis labels — moss with lime shadow */
        .theme-jungle .cosmic-axis-label {
          color: rgba(82,183,136,0.85);
          text-shadow: 0 0 8px rgba(163,230,53,0.45);
        }

        /* Hint — frosted leaf glass */
        .theme-jungle .cosmic-hint {
          color: #a3e635;
          text-shadow: 0 0 8px rgba(163,230,53,0.35);
        }
        .theme-jungle .cosmic-hint-detail {
          color: rgba(82,183,136,0.85);
        }

        /* DJ panel — frosted canopy glass */
        .theme-jungle .conductor-transport,
        .theme-jungle .conductor-drawer {
          background: rgba(10,31,20,0.55);
          border: 1px solid rgba(163,230,53,0.22);
          box-shadow: 0 12px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(163,230,53,0.08), 0 0 28px rgba(163,230,53,0.12);
          backdrop-filter: blur(12px) saturate(140%);
          -webkit-backdrop-filter: blur(12px) saturate(140%);
        }
        .theme-jungle .conductor-toggle {
          color: #a3e635;
          border-color: rgba(163,230,53,0.35);
        }
        .theme-jungle .conductor-toggle.is-active {
          color: #ffe14d;
          background: rgba(255,225,77,0.14);
          border-color: rgba(255,225,77,0.6);
          box-shadow: 0 0 22px rgba(255,225,77,0.35), inset 0 0 10px rgba(163,230,53,0.15);
        }
        .theme-jungle .conductor-bpm {
          background: linear-gradient(90deg, #a3e635, #ffe14d);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .theme-jungle .conductor-phase { color: #ffe14d; text-shadow: 0 0 10px rgba(255,225,77,0.4); }

        /* ── Jungle drum cells — become canvases for the fruit sprite overlay ──
           The coloured gradient backgrounds are muted so the fruit carries the
           visual weight. Cells grow taller to let the sprites read clearly. */
        .theme-jungle .conductor-cell { height: 18px; border-radius: 4px; background: rgba(10,31,20,0.55) !important; border-color: rgba(163,230,53,0.22) !important; }
        .theme-jungle .conductor-cell.is-downbeat { border-left: 1px solid rgba(255,225,77,0.45) !important; }
        .theme-jungle .conductor-cell-fruit { opacity: 0.7; }
        .theme-jungle .conductor-cell[data-active="1"] {
          outline: 1.5px solid rgba(255,225,77,0.95);
          box-shadow: 0 0 14px rgba(255,225,77,0.7);
        }
        .theme-jungle .conductor-cell[data-active="1"] .conductor-cell-fruit {
          opacity: 1;
          animation: fruitFrames 0.36s steps(4, jump-none) 1;
        }
        /* Non-active lit cells still show the fruit at reduced intensity. */
        .theme-jungle .conductor-row-kick  .conductor-cell-fruit,
        .theme-jungle .conductor-row-snare .conductor-cell-fruit,
        .theme-jungle .conductor-row-hat   .conductor-cell-fruit,
        .theme-jungle .conductor-row-clap  .conductor-cell-fruit {
          /* inherit per-row background-position from base rule above */
        }
        /* User-forced on → amber accent; user-forced off → mute the fruit. */
        .theme-jungle .conductor-cell[data-user="on"] {
          border-color: rgba(255,225,77,0.85) !important;
          box-shadow: inset 0 0 0 1px rgba(255,225,77,0.55), 0 0 10px rgba(255,225,77,0.35);
        }
        .theme-jungle .conductor-cell[data-user="off"] .conductor-cell-fruit { opacity: 0.15; }

        /* Sprite frame animation — advances across the 4 columns of fruits.svg.
           "to" value is 3/4 × 100% = 75% because steps(4, jump-none) visits 0..3
           (4 frames) at 0%, 33.33%, 66.66%, 100%, so the keyframe end value is the
           last frame column. The row (Y) is selected by the per-lane rule above. */
        @keyframes fruitFrames {
          from { background-position-x: 0%;   }
          to   { background-position-x: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .theme-jungle .conductor-cell[data-active="1"] .conductor-cell-fruit { animation: none; }
        }

        /* Flash — amber */
        .theme-jungle .cosmic-flash {
          color: #ffe14d;
          text-shadow: 0 0 14px rgba(255,225,77,0.6), 0 0 30px rgba(245,158,11,0.4);
        }

        /* Header sub — moss tint */
        .theme-jungle .cosmic-header-sub {
          color: rgba(82,183,136,0.75);
        }
`;
