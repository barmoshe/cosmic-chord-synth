export const COSMIC_STYLES = `
        /* ── Cosmic Design System v3 — "Solar Flare" warm-ember theme ── */
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
          background: radial-gradient(ellipse at center, rgba(45,18,12,0.85) 0%, rgba(20,8,6,0.95) 100%);
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
          background: linear-gradient(135deg, #FFB347 0%, #FF5E5B 35%, #7A1F6B 70%, #FFD166 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 300% 100%;
          animation: cosmicGradient 6s ease infinite;
          text-align: center;
          filter: drop-shadow(0 0 30px rgba(255,179,71,0.35));
        }
        .cosmic-subtitle-group {
          display: flex; align-items: center; gap: 16px;
        }
        .cosmic-line {
          width: clamp(30px, 8vw, 80px); height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,241,214,0.35), transparent);
        }
        .cosmic-subtitle {
          font-family: 'Raleway', sans-serif;
          font-size: clamp(10px, 1.8vw, 14px);
          font-weight: 300;
          letter-spacing: 0.35em;
          color: #F5C99A;
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
          color: #FFB347;
          animation: cosmicPulse 2.5s ease-in-out infinite;
        }
        .cosmic-cta-ring {
          position: absolute;
          width: 100px; height: 100px;
          border: 1px solid rgba(255,179,71,0.25);
          border-radius: 50%;
          animation: cosmicRing 3s ease-in-out infinite;
        }

        .cosmic-warp {
          position: fixed; inset: 0; z-index: 100;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px;
          background: radial-gradient(ellipse at center, rgba(45,18,12,0.7) 0%, rgba(20,8,6,0.9) 100%);
          backdrop-filter: blur(4px);
        }
        .cosmic-warp-text {
          font-family: 'Orbitron', monospace;
          font-size: clamp(11px, 2.2vw, 15px);
          font-weight: 400;
          letter-spacing: 0.4em;
          color: #FFB347;
          animation: cosmicWarpPulse 1s ease-in-out infinite;
        }
        .cosmic-warp-bar {
          width: clamp(180px, 50vw, 350px); height: 3px;
          background: rgba(255,241,214,0.1);
          border-radius: 2px; overflow: hidden;
        }
        .cosmic-warp-fill {
          height: 100%;
          background: linear-gradient(90deg, #FFB347, #FF5E5B);
          border-radius: 2px;
          transition: width 0.1s linear;
          box-shadow: 0 0 12px rgba(255,179,71,0.45);
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
          background: linear-gradient(90deg, #FFB347, #FF5E5B);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
        }
        .cosmic-header-sub {
          font-family: 'Raleway', sans-serif;
          font-size: 11px; font-weight: 300;
          letter-spacing: 0.2em;
          color: #D4A574;
        }

        .cosmic-hint {
          position: fixed; bottom: 16%; left: 0; right: 0; z-index: 10;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          text-align: center;
          font-family: 'Raleway', sans-serif;
          font-size: clamp(11px, 1.8vw, 14px);
          font-weight: 300;
          letter-spacing: 0.25em;
          color: #D4A574;
          pointer-events: none;
          animation: cosmicPulse 3.5s ease-in-out infinite;
        }
        .cosmic-hint-detail {
          font-size: clamp(9px, 1.4vw, 11px);
          letter-spacing: 0.15em;
          color: #A8825F;
        }

        .cosmic-btn {
          all: unset;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,241,214,0.05);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,241,214,0.12);
          box-shadow: 0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,241,214,0.06);
          cursor: pointer; touch-action: none;
          user-select: none; -webkit-user-select: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cosmic-btn:hover {
          background: rgba(255,241,214,0.09);
          border-color: rgba(255,241,214,0.2);
        }
        .cosmic-btn:active {
          transform: scale(0.95);
        }

        .cosmic-btn-auto, .cosmic-btn-seq {
          flex-direction: column; gap: 3px;
          width: 56px; height: 56px; border-radius: 50%;
          font-family: 'Orbitron', monospace;
          color: #F5C99A;
        }
        .cosmic-btn-seq {
          background: rgba(255,94,91,0.1);
          border-color: rgba(255,94,91,0.28);
        }
        .cosmic-btn-seq:hover {
          background: rgba(255,94,91,0.18);
          border-color: rgba(255,94,91,0.45);
          color: #FF8A85;
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
          color: #FFB347;
          background: rgba(255,179,71,0.12);
          border-color: rgba(255,179,71,0.4);
          box-shadow: 0 0 30px rgba(255,179,71,0.22), inset 0 0 15px rgba(255,179,71,0.08);
          animation: cosmicPulse 2s ease-in-out infinite;
        }

        .cosmic-btn-arrow {
          width: 38px; height: 38px; border-radius: 50%;
          font-family: 'Raleway', sans-serif;
          font-size: 18px; font-weight: 300;
          color: #D4A574;
        }

        .cosmic-auto-group {
          position: fixed; bottom: 28px; left: 24px; z-index: 10;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .cosmic-section-tag {
          font-family: 'Orbitron', monospace;
          font-size: 9px; letter-spacing: 0.18em;
          color: #FFB347;
          padding: 4px 12px;
          background: rgba(255,179,71,0.08);
          border: 1px solid rgba(255,179,71,0.22);
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
          color: #F5C99A;
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
          background: linear-gradient(135deg, #FFB347, #FF5E5B, #7A1F6B);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 20px rgba(255,179,71,0.45));
          pointer-events: none;
          animation: cosmicPulse 1.5s ease-out forwards;
        }


        .cosmic-error {
          position: fixed; top: 65px; left: 50%;
          transform: translateX(-50%);
          z-index: 15;
          font-family: 'Raleway', sans-serif;
          font-size: 11px;
          color: #FF8A75;
          letter-spacing: 0.1em;
        }

        .cosmic-axis-label {
          position: fixed; z-index: 8;
          font-family: 'Raleway', sans-serif;
          font-size: 9px;
          font-weight: 300;
          letter-spacing: 0.2em;
          color: #8A6550;
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
          background: linear-gradient(90deg, #FFB347, #FF5E5B, #FFD166);
          transition: width 0.3s ease-out;
          box-shadow: 0 0 8px rgba(255,179,71,0.5), 0 0 16px rgba(255,94,91,0.25);
        }
`;
