export const COSMIC_STYLES = `
        /* ── Cosmic Design System v2 — Improved Readability ── */
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
          background: radial-gradient(ellipse at center, rgba(2,0,16,0.85) 0%, rgba(0,0,0,0.95) 100%);
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
          background: linear-gradient(135deg, #00f0ff 0%, #a855f7 30%, #ff00e6 60%, #ffee00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 300% 100%;
          animation: cosmicGradient 6s ease infinite;
          text-align: center;
          filter: drop-shadow(0 0 30px rgba(0,240,255,0.3));
        }
        .cosmic-subtitle-group {
          display: flex; align-items: center; gap: 16px;
        }
        .cosmic-line {
          width: clamp(30px, 8vw, 80px); height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        }
        .cosmic-subtitle {
          font-family: 'Raleway', sans-serif;
          font-size: clamp(10px, 1.8vw, 14px);
          font-weight: 300;
          letter-spacing: 0.35em;
          color: rgba(255,255,255,0.55);
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
          color: rgba(0,240,255,0.8);
          animation: cosmicPulse 2.5s ease-in-out infinite;
        }
        .cosmic-cta-ring {
          position: absolute;
          width: 100px; height: 100px;
          border: 1px solid rgba(0,240,255,0.2);
          border-radius: 50%;
          animation: cosmicRing 3s ease-in-out infinite;
        }

        .cosmic-warp {
          position: fixed; inset: 0; z-index: 100;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px;
          background: radial-gradient(ellipse at center, rgba(2,0,16,0.7) 0%, rgba(0,0,0,0.9) 100%);
          backdrop-filter: blur(4px);
        }
        .cosmic-warp-text {
          font-family: 'Orbitron', monospace;
          font-size: clamp(11px, 2.2vw, 15px);
          font-weight: 400;
          letter-spacing: 0.4em;
          color: rgba(0,240,255,0.7);
          animation: cosmicWarpPulse 1s ease-in-out infinite;
        }
        .cosmic-warp-bar {
          width: clamp(180px, 50vw, 350px); height: 3px;
          background: rgba(255,255,255,0.08);
          border-radius: 2px; overflow: hidden;
        }
        .cosmic-warp-fill {
          height: 100%;
          background: linear-gradient(90deg, #00f0ff, #ff00e6);
          border-radius: 2px;
          transition: width 0.1s linear;
          box-shadow: 0 0 12px rgba(0,240,255,0.4);
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
          background: linear-gradient(90deg, rgba(0,240,255,0.9), rgba(168,85,247,0.8));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
        }
        .cosmic-header-sub {
          font-family: 'Raleway', sans-serif;
          font-size: 11px; font-weight: 300;
          letter-spacing: 0.2em;
          color: rgba(255,255,255,0.4);
        }

        .cosmic-hint {
          position: fixed; bottom: 16%; left: 0; right: 0; z-index: 10;
          text-align: center;
          font-family: 'Raleway', sans-serif;
          font-size: clamp(11px, 1.8vw, 14px);
          font-weight: 300;
          letter-spacing: 0.25em;
          color: rgba(255,255,255,0.35);
          pointer-events: none;
          animation: cosmicPulse 3.5s ease-in-out infinite;
        }

        .cosmic-btn {
          all: unset;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06);
          cursor: pointer; touch-action: none;
          user-select: none; -webkit-user-select: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cosmic-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.16);
        }
        .cosmic-btn:active {
          transform: scale(0.95);
        }

        .cosmic-btn-auto, .cosmic-btn-seq {
          flex-direction: column; gap: 3px;
          width: 56px; height: 56px; border-radius: 50%;
          font-family: 'Orbitron', monospace;
          color: rgba(255,255,255,0.6);
        }
        .cosmic-btn-seq {
          background: rgba(168,85,247,0.08);
          border-color: rgba(168,85,247,0.2);
        }
        .cosmic-btn-seq:hover {
          background: rgba(168,85,247,0.14);
          border-color: rgba(168,85,247,0.35);
          color: rgba(168,85,247,0.9);
        }
        .cosmic-btn-auto .cosmic-btn-icon {
          font-size: 16px; line-height: 1;
        }
        .cosmic-btn-auto .cosmic-btn-label {
          font-size: 8px; letter-spacing: 0.15em; font-weight: 500;
        }
        .cosmic-btn-auto.active {
          color: #00f0ff;
          background: rgba(0,240,255,0.1);
          border-color: rgba(0,240,255,0.35);
          box-shadow: 0 0 30px rgba(0,240,255,0.15), inset 0 0 15px rgba(0,240,255,0.05);
        }

        .cosmic-btn-arrow {
          width: 38px; height: 38px; border-radius: 50%;
          font-family: 'Raleway', sans-serif;
          font-size: 18px; font-weight: 300;
          color: rgba(255,255,255,0.5);
        }

        .cosmic-auto-group {
          position: fixed; bottom: 28px; left: 24px; z-index: 10;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .cosmic-section-tag {
          font-family: 'Orbitron', monospace;
          font-size: 9px; letter-spacing: 0.18em;
          color: rgba(0,240,255,0.7);
          padding: 4px 12px;
          background: rgba(0,240,255,0.06);
          border: 1px solid rgba(0,240,255,0.15);
          border-radius: 10px;
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
          color: rgba(255,255,255,0.7);
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
          background: linear-gradient(135deg, #00f0ff, #a855f7, #ff00e6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 20px rgba(0,240,255,0.4));
          pointer-events: none;
          animation: cosmicPulse 1.5s ease-out forwards;
        }

        .cosmic-gyro-prompt {
          position: fixed !important;
          bottom: 80px !important; left: 50% !important;
          transform: translateX(-50%) !important;
          z-index: 20 !important;
          padding: 16px 30px !important;
          border-radius: 24px !important;
          font-family: 'Raleway', sans-serif !important;
          font-size: 13px !important;
          color: rgba(0,240,255,0.8) !important;
          letter-spacing: 0.08em !important;
        }

        .cosmic-error {
          position: fixed; top: 65px; left: 50%;
          transform: translateX(-50%);
          z-index: 15;
          font-family: 'Raleway', sans-serif;
          font-size: 11px;
          color: rgba(255,120,120,0.7);
          letter-spacing: 0.1em;
        }
`;
