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

        .cosmic-btn-auto, .cosmic-btn-seq {
          flex-direction: column; gap: 3px;
          width: 56px; height: 56px; border-radius: 50%;
          font-family: 'Orbitron', monospace;
          color: #B4C9E0;
        }
        .cosmic-btn-seq {
          background: rgba(232,121,249,0.1);
          border-color: rgba(232,121,249,0.3);
        }
        .cosmic-btn-seq:hover {
          background: rgba(232,121,249,0.18);
          border-color: rgba(232,121,249,0.45);
          color: #F5B0FB;
        }
        .cosmic-btn-seq .cosmic-btn-icon {
          font-size: 18px; line-height: 1;
        }
        .cosmic-btn-seq .cosmic-btn-label {
          font-size: 8px; letter-spacing: 0.15em; font-weight: 500;
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

        .cosmic-dj-corner {
          position: fixed; bottom: 24px; left: 20px; z-index: 10;
          display: flex; flex-direction: column; align-items: flex-start; gap: 12px;
        }

        /* ── Cosmic DJ Panel — Glacial Aurora accents ── */
        .cdj-panel {
          display: flex; flex-direction: column; gap: 9px;
          padding: 11px 13px;
          width: 218px;
          background: linear-gradient(135deg, rgba(22,37,64,0.72) 0%, rgba(15,27,45,0.82) 100%);
          border: 1px solid rgba(129,140,248,0.22);
          box-shadow: 0 10px 34px rgba(0,0,0,0.5), inset 0 1px 0 rgba(229,244,251,0.06), 0 0 24px rgba(34,211,238,0.08);
          border-radius: 14px;
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          font-family: 'Orbitron', monospace;
          color: #B4C9E0;
          user-select: none; -webkit-user-select: none;
        }
        .cdj-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .cdj-row-phase { padding-top: 2px; }

        .cdj-toggle {
          all: unset;
          display: flex; align-items: center; gap: 8px;
          padding: 6px 11px 6px 9px;
          border-radius: 10px;
          background: rgba(229,244,251,0.04);
          border: 1px solid rgba(129,140,248,0.22);
          cursor: pointer; touch-action: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cdj-toggle:hover { background: rgba(129,140,248,0.1); border-color: rgba(129,140,248,0.4); }
        .cdj-toggle:active { transform: scale(0.96); }
        .cdj-toggle.active {
          background: rgba(34,211,238,0.12);
          border-color: rgba(34,211,238,0.5);
          box-shadow: 0 0 22px rgba(34,211,238,0.25), inset 0 0 10px rgba(34,211,238,0.1);
          color: #22D3EE;
        }
        .cdj-toggle-icon { font-size: 11px; line-height: 1; }
        .cdj-toggle-label { font-size: 10px; letter-spacing: 0.2em; font-weight: 500; }
        .cdj-beat-dot {
          width: 9px; height: 9px; border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #FCD34D, #F59E0B 70%);
          box-shadow: 0 0 10px rgba(252,211,77,0.7);
          opacity: 0.4;
          transition: opacity 0.04s linear;
        }

        .cdj-bpm { display: flex; align-items: baseline; gap: 5px; padding-right: 4px; }
        .cdj-bpm-val {
          font-size: 16px; font-weight: 700;
          background: linear-gradient(90deg, #22D3EE, #818CF8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          letter-spacing: 0.05em;
        }
        .cdj-bpm-lbl { font-size: 8px; letter-spacing: 0.2em; color: #7C95B5; }

        .cdj-phase {
          font-size: 11px; font-weight: 700; letter-spacing: 0.22em;
          color: #22D3EE;
          text-shadow: 0 0 10px rgba(34,211,238,0.35);
        }
        .cdj-phase-drift    { color: #5FEED0; text-shadow: 0 0 10px rgba(95,238,208,0.45); }
        .cdj-phase-pulse    { color: #818CF8; text-shadow: 0 0 10px rgba(129,140,248,0.45); }
        .cdj-phase-bloom    { color: #22D3EE; text-shadow: 0 0 10px rgba(34,211,238,0.5); }
        .cdj-phase-surge    { color: #FCD34D; text-shadow: 0 0 14px rgba(252,211,77,0.55); }
        .cdj-phase-dissolve { color: #14B8A6; text-shadow: 0 0 10px rgba(20,184,166,0.4); }
        .cdj-phase-next {
          font-size: 9px; letter-spacing: 0.2em;
          color: #7C95B5;
        }

        .cdj-progress {
          height: 3px;
          background: rgba(229,244,251,0.08);
          border-radius: 2px; overflow: hidden;
        }
        .cdj-progress-fill {
          height: 100%; width: 100%;
          transform: scaleX(0); transform-origin: left;
          background: linear-gradient(90deg, #14B8A6, #22D3EE 50%, #818CF8);
          box-shadow: 0 0 8px rgba(34,211,238,0.4);
        }

        .cdj-meters { display: flex; flex-direction: column; gap: 4px; }
        .cdj-meter { display: flex; align-items: center; gap: 8px; }
        .cdj-meter-lbl {
          font-family: 'Raleway', sans-serif;
          font-size: 9px; font-weight: 600;
          color: #7C95B5;
          width: 10px;
        }
        .cdj-meter-bar {
          flex: 1; height: 4px;
          background: rgba(229,244,251,0.06);
          border-radius: 2px; overflow: hidden;
        }
        .cdj-meter-fill {
          height: 100%; width: 100%;
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.03s linear;
        }
        .cdj-meter-fill.kick { background: linear-gradient(90deg, #FCD34D, #F59E0B); box-shadow: 0 0 6px rgba(252,211,77,0.55); }
        .cdj-meter-fill.clap { background: linear-gradient(90deg, #818CF8, #A5B4FC); box-shadow: 0 0 6px rgba(129,140,248,0.5); }
        .cdj-meter-fill.hat  { background: linear-gradient(90deg, #22D3EE, #67E8F9); box-shadow: 0 0 6px rgba(34,211,238,0.5); }

        .cdj-grid { display: flex; justify-content: center; gap: 9px; padding-top: 3px; }
        .cdj-grid-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: rgba(229,244,251,0.12);
          border: 1px solid rgba(129,140,248,0.2);
          transition: all 0.08s ease-out;
        }
        .cdj-grid-dot.active {
          background: radial-gradient(circle at 30% 30%, #22D3EE, #818CF8 80%);
          border-color: rgba(34,211,238,0.6);
          box-shadow: 0 0 10px rgba(34,211,238,0.6);
          transform: scale(1.25);
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
