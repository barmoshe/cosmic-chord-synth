export const COSMIC_STYLES = `
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
          position: fixed; bottom: 16%; left: 0; right: 0; z-index: 10;
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
          z-index: 12;
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
          height: 12px;
          border-radius: 2px;
          background: rgba(229,244,251,0.08);
          border: 1px solid rgba(129,140,248,0.14);
          transition: transform 0.08s linear, box-shadow 0.08s linear;
          opacity: 0.1;
          will-change: opacity, transform;
        }
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
          position: fixed; bottom: 28px; right: 24px; z-index: 10;
          display: flex; align-items: center; gap: 12px;
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
        .cosmic-axis-left {
          left: 10px; top: 50%;
          transform: translateY(-50%) rotate(-90deg);
          transform-origin: center;
        }
        .cosmic-axis-right {
          right: 10px; top: 50%;
          transform: translateY(-50%) rotate(90deg);
          transform-origin: center;
        }
        .cosmic-axis-top {
          top: 55px; left: 50%;
          transform: translateX(-50%);
        }
        .cosmic-axis-bottom {
          bottom: 80px; left: 50%;
          transform: translateX(-50%);
        }

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
`;
