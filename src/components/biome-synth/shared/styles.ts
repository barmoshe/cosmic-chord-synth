export const BIOME_STYLES = `
        /* ── z-layer map ──
           canvas 1 · jungle decor 3 (isolate, inner: back 1 · mid 2 · front 3) ·
           energy-bar 9 · glow overlays 12 · DJ panel 14 · flash/error 15 ·
           HUD text (header/hint/scale/axis) 20 · theme pill 30 · audio badge 50 ·
           splash/warp 100. HUD text sits above every decorative + overlay
           layer so it stays readable regardless of touch glow or DJ panel
           position. Jungle decor is decorative (pointer-events:none) and
           must stay behind every interactive/textual chrome. 'isolation: isolate'
           on .jungle-overlay pins its inner stacking context so back/mid/front
           scene layers order monkeys between background vines and foreground
           ferns without leaking out. A clip-path on the overlay keeps decor from
           painting above the top viewport band (header, audio badge, theme pill). */

        /* ── Cosmic Design System v4 — "Glacial Aurora 2026" lifted-navy theme ── */
        @keyframes biomeGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes biomePulse {
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

        .biome-splash {
          position: fixed; inset: 0; z-index: 100;
          display: flex; align-items: center; justify-content: center;
          background: radial-gradient(ellipse at center, rgba(22,37,64,0.85) 0%, rgba(15,27,45,0.95) 100%);
          backdrop-filter: blur(8px);
          cursor: pointer; touch-action: none;
        }
        .biome-splash-inner {
          display: flex; flex-direction: column; align-items: center; gap: 28px;
          animation: cosmicFadeIn 1.2s ease-out;
        }
        .biome-logo {
          font-family: 'Orbitron', monospace;
          font-size: clamp(28px, 7vw, 58px);
          font-weight: 900;
          letter-spacing: 0.22em;
          background: linear-gradient(135deg, #14B8A6 0%, #22D3EE 35%, #818CF8 70%, #FCD34D 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 300% 100%;
          animation: biomeGradient 6s ease infinite;
          text-align: center;
          filter: drop-shadow(0 0 30px rgba(34,211,238,0.4));
        }
        .biome-subtitle-group {
          display: flex; align-items: center; gap: 16px;
        }
        .biome-line {
          width: clamp(30px, 8vw, 80px); height: 1px;
          background: linear-gradient(90deg, transparent, rgba(229,244,251,0.35), transparent);
        }
        .biome-subtitle {
          font-family: 'Raleway', sans-serif;
          font-size: clamp(10px, 1.8vw, 14px);
          font-weight: 300;
          letter-spacing: 0.35em;
          color: #B4C9E0;
        }
        .biome-cta {
          position: relative;
          display: flex; align-items: center; justify-content: center;
          margin-top: 20px;
          animation: cosmicFloat 3s ease-in-out infinite;
        }
        .biome-cta span {
          font-family: 'Orbitron', monospace;
          font-size: clamp(11px, 2.2vw, 15px);
          font-weight: 400;
          letter-spacing: 0.3em;
          color: #22D3EE;
          animation: biomePulse 2.5s ease-in-out infinite;
        }
        .biome-cta-ring {
          position: absolute;
          width: 100px; height: 100px;
          border: 1px solid rgba(34,211,238,0.3);
          border-radius: 50%;
          animation: cosmicRing 3s ease-in-out infinite;
        }

        .biome-warp {
          position: fixed; inset: 0; z-index: 100;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px;
          background: radial-gradient(ellipse at center, rgba(22,37,64,0.7) 0%, rgba(15,27,45,0.9) 100%);
          backdrop-filter: blur(4px);
        }
        .biome-warp-text {
          font-family: 'Orbitron', monospace;
          font-size: clamp(11px, 2.2vw, 15px);
          font-weight: 400;
          letter-spacing: 0.4em;
          color: #22D3EE;
          animation: cosmicWarpPulse 1s ease-in-out infinite;
        }
        .biome-warp-bar {
          width: clamp(180px, 50vw, 350px); height: 3px;
          background: rgba(229,244,251,0.1);
          border-radius: 2px; overflow: hidden;
        }
        .biome-warp-fill {
          height: 100%;
          background: linear-gradient(90deg, #22D3EE, #818CF8);
          border-radius: 2px;
          transition: width 0.1s linear;
          box-shadow: 0 0 12px rgba(34,211,238,0.5);
        }

        .biome-header {
          position: fixed; top: 24px; left: 0; right: 0; z-index: 20;
          display: flex; flex-direction: column; align-items: center;
          pointer-events: none;
          transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
          /* Drop-shadow keeps the title/subtitle legible when floating
             decor (bananas, monkeys) drifts behind them. */
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 6px rgba(0, 0, 0, 0.55));
        }
        .biome-header-title {
          font-family: 'Orbitron', monospace;
          font-size: clamp(11px, 2vw, 15px);
          font-weight: 500;
          letter-spacing: 0.35em;
          background: linear-gradient(90deg, #22D3EE, #818CF8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
        }
        .biome-header-sub {
          font-family: 'Raleway', sans-serif;
          font-size: 11px; font-weight: 300;
          letter-spacing: 0.2em;
          color: #7C95B5;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
        }

        .biome-hint {
          position: fixed; bottom: 180px; left: 0; right: 0; z-index: 20;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          text-align: center;
          font-family: 'Raleway', sans-serif;
          font-size: clamp(11px, 1.8vw, 14px);
          font-weight: 300;
          letter-spacing: 0.25em;
          color: #7C95B5;
          pointer-events: none;
          animation: biomePulse 3.5s ease-in-out infinite;
        }
        .biome-hint-detail {
          font-size: clamp(9px, 1.4vw, 11px);
          letter-spacing: 0.15em;
          color: #5A7295;
        }

        .biome-btn {
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
        .biome-btn:hover {
          background: rgba(229,244,251,0.09);
          border-color: rgba(229,244,251,0.2);
        }
        .biome-btn:active {
          transform: scale(0.95);
        }

        .biome-btn-auto {
          flex-direction: column; gap: 3px;
          width: 56px; height: 56px; border-radius: 50%;
          font-family: 'Orbitron', monospace;
          color: #B4C9E0;
        }
        .biome-btn-auto .biome-btn-icon {
          font-size: 16px; line-height: 1;
        }
        .biome-btn-auto .biome-btn-label {
          font-size: 8px; letter-spacing: 0.15em; font-weight: 500;
        }
        .biome-btn-auto.active {
          color: #22D3EE;
          background: rgba(34,211,238,0.12);
          border-color: rgba(34,211,238,0.4);
          box-shadow: 0 0 30px rgba(34,211,238,0.25), inset 0 0 15px rgba(34,211,238,0.08);
          animation: biomePulse 2s ease-in-out infinite;
        }

        .biome-btn-arrow {
          width: 38px; height: 38px; border-radius: 50%;
          font-family: 'Raleway', sans-serif;
          font-size: 18px; font-weight: 300;
          color: #7C95B5;
        }

        /* ── Cosmic Conductor — left-docked DJ console ──
           Anchored to the left edge so the centerpiece artwork stays visible.
           Defaults to collapsed (a small pill); press the L key (or click the
           chevron) to expand the drum-grid drawer. Wrapper is
           pointer-events:none so galaxy taps pass through padding; interactive
           children re-enable events. Z-index sits above HUD (10) but below
           transition overlays (15). */
        .conductor-root {
          position: fixed;
          left: 12px;
          top: 68px;
          z-index: 14;
          display: flex; flex-direction: column; align-items: stretch;
          gap: 10px;
          pointer-events: none;
          font-family: 'Orbitron', monospace;
          color: #B4C9E0;
          user-select: none; -webkit-user-select: none;
          transition: width 0.28s cubic-bezier(0.2, 0.8, 0.3, 1.2), gap 0.22s ease;
          /* Phase accent — set inline per-render from the active phase so the
             collapsed pill's progress strip + phase dot stay in sync. */
          --phase-color: #22D3EE;
        }
        .conductor-root.is-expanded {
          width: min(420px, calc(100vw - 24px));
        }
        .conductor-root.is-collapsed {
          width: auto;
          gap: 0;
        }

        .conductor-transport,
        .conductor-drawer {
          pointer-events: auto;
          background: linear-gradient(135deg, rgba(22,37,64,0.92) 0%, rgba(15,27,45,0.96) 100%);
          border: 1px solid rgba(129,140,248,0.35);
          box-shadow: 0 12px 36px rgba(0,0,0,0.6), inset 0 1px 0 rgba(229,244,251,0.08), 0 0 28px rgba(34,211,238,0.1);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border-radius: 14px;
        }

        .conductor-transport {
          display: grid;
          grid-template-columns: 52px 1fr 26px 36px;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          position: relative;
          transition: border-radius 0.28s cubic-bezier(0.2, 0.8, 0.3, 1.2),
                      padding 0.22s ease,
                      box-shadow 0.28s ease;
        }
        .conductor-root.is-collapsed .conductor-transport {
          border-radius: 999px;
          padding: 7px 10px 7px 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(229,244,251,0.08), 0 0 22px rgba(34,211,238,0.12);
        }

        /* Play / pause toggle with pulsing aurora ring */
        .conductor-toggle {
          all: unset;
          box-sizing: border-box;
          position: relative;
          width: 52px; height: 52px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 25%, rgba(129,140,248,0.22), rgba(129,140,248,0.08) 70%);
          border: 1.5px solid rgba(129,140,248,0.55);
          cursor: pointer; touch-action: manipulation;
          transition: background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.08s ease;
          color: #E5F4FB;
        }
        .conductor-toggle:hover { background: radial-gradient(circle at 30% 25%, rgba(129,140,248,0.22), rgba(129,140,248,0.04) 70%); border-color: rgba(129,140,248,0.55); }
        .conductor-toggle:active { transform: scale(0.94); }
        .conductor-toggle.is-active {
          background: radial-gradient(circle at 30% 25%, #5FF2FF 0%, #22D3EE 45%, #4F46E5 100%);
          border: 1.5px solid rgba(34,211,238,0.9);
          box-shadow:
            0 0 26px rgba(34,211,238,0.55),
            0 0 10px rgba(129,140,248,0.35),
            inset 0 1px 2px rgba(255,255,255,0.35),
            inset 0 -2px 6px rgba(79,70,229,0.35);
          color: #0B1322;
        }
        /* Always-on ring on the active button — independent of the beat pulse so
           the "DJ is on" affordance never disappears between beats. */
        .conductor-toggle.is-active::before {
          content: "";
          position: absolute; inset: -5px;
          border-radius: 50%;
          border: 1px solid rgba(34,211,238,0.45);
          box-shadow: 0 0 14px rgba(34,211,238,0.35);
          pointer-events: none;
        }
        .conductor-toggle-icon {
          font-size: 16px; line-height: 1; font-weight: 700;
          pointer-events: none;
          display: inline-block;
        }
        /* The ▶ glyph's visual weight sits left of its geometric center —
           nudge right by 1.5px so it reads as centered in the circle. */
        .conductor-toggle-icon[data-icon="play"] { transform: translateX(1.5px); }
        .conductor-toggle.is-active .conductor-toggle-icon[data-icon="stop"] {
          /* slight shrink so the square doesn't dominate the filled button */
          font-size: 13px;
        }
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
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.18em;
          color: #B4C9E0;
          text-shadow: 0 0 10px rgba(34,211,238,0.25);
          white-space: nowrap; overflow: hidden;
        }
        .conductor-phase-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
        /* Small phase indicator dot next to the label — driven by --phase-color
           set inline on .conductor-root. Gives the collapsed pill a glanceable
           status chip. */
        .conductor-phase-dot {
          width: 7px; height: 7px; flex: 0 0 7px;
          border-radius: 50%;
          background: var(--phase-color);
          box-shadow: 0 0 8px color-mix(in srgb, var(--phase-color) 70%, transparent);
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }
        .conductor-phase-idle .conductor-phase-dot { box-shadow: none; opacity: 0.5; }
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
          color: #E5F4FB;
          cursor: pointer; touch-action: manipulation;
          font-size: 14px; line-height: 1;
          transition: background 0.2s, border-color 0.2s, transform 0.08s ease;
        }
        .conductor-root.is-collapsed .conductor-expand { border-radius: 50%; }
        .conductor-expand:hover { background: rgba(129,140,248,0.12); border-color: rgba(129,140,248,0.4); }
        .conductor-expand:active { transform: scale(0.94); }
        .conductor-chevron {
          display: inline-block;
          transform: rotate(0deg);
          transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.3, 1.2);
        }
        .conductor-chevron.is-open { transform: rotate(180deg); }

        /* Mini progress strip — only mounted on the collapsed pill while DJ is on.
           Absolute-positioned arc just inside the bottom edge of the pill. */
        .conductor-mini-progress {
          position: absolute;
          left: 18px; right: 18px; bottom: 3px;
          height: 2px;
          border-radius: 2px;
          background: rgba(229,244,251,0.08);
          pointer-events: none;
          overflow: hidden;
        }
        .conductor-mini-progress-fill {
          width: 100%; height: 100%;
          transform-origin: left center;
          transform: scaleX(0);
          background: linear-gradient(90deg, color-mix(in srgb, var(--phase-color) 55%, transparent), var(--phase-color));
          box-shadow: 0 0 8px color-mix(in srgb, var(--phase-color) 60%, transparent);
          border-radius: 2px;
          will-change: transform;
        }

        /* Drawer — always mounted; collapse animates via max-height + opacity
           + transform so there is no pop on close. */
        .conductor-drawer {
          padding: 12px 14px 14px;
          display: flex; flex-direction: column; gap: 12px;
          transform-origin: top center;
          overflow: hidden;
          max-height: 420px;
          opacity: 1;
          transform: translateY(0) scaleY(1);
          transition: max-height 0.28s cubic-bezier(0.2, 0.8, 0.3, 1.2),
                      opacity 0.22s ease,
                      transform 0.28s cubic-bezier(0.2, 0.8, 0.3, 1.2),
                      padding 0.22s ease,
                      margin-top 0.22s ease;
        }
        .conductor-drawer.is-closed {
          max-height: 0;
          opacity: 0;
          transform: translateY(-6px) scaleY(0.94);
          padding-top: 0;
          padding-bottom: 0;
          pointer-events: none;
          border-top-width: 0;
          border-bottom-width: 0;
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
          transition: transform 0.08s linear, box-shadow 0.08s linear, border-color 0.15s, opacity 0.12s;
          opacity: 0.22;
          will-change: opacity, transform;
          cursor: pointer;
          touch-action: manipulation;
          overflow: hidden;
        }
        .conductor-cell:focus-visible { outline: 2px solid rgba(34,211,238,0.8); outline-offset: 2px; }
        .conductor-cell:active { transform: scale(0.92); }
        .conductor-cell.is-downbeat { border-left: 2px solid rgba(129,140,248,0.6); }
        .conductor-row-kick  .conductor-cell[data-hit="1"] { background: linear-gradient(180deg, rgba(252,211,77,0.95), rgba(252,211,77,0.5));  border-color: rgba(252,211,77,0.7); box-shadow: 0 0 6px rgba(252,211,77,0.55); }
        .conductor-row-clap  .conductor-cell[data-hit="1"] { background: linear-gradient(180deg, rgba(248,113,113,0.95), rgba(248,113,113,0.5)); border-color: rgba(248,113,113,0.7); box-shadow: 0 0 6px rgba(248,113,113,0.55); }
        .conductor-row-hat   .conductor-cell[data-hit="1"] { background: linear-gradient(180deg, rgba(251,146,60,0.95), rgba(251,146,60,0.5));  border-color: rgba(251,146,60,0.7); box-shadow: 0 0 6px rgba(251,146,60,0.55); }
        .conductor-row-snare .conductor-cell[data-hit="1"] { background: linear-gradient(180deg, rgba(244,114,182,0.95), rgba(244,114,182,0.5)); border-color: rgba(244,114,182,0.7); box-shadow: 0 0 6px rgba(244,114,182,0.55); }
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
            top: auto;
            bottom: 12px;
            left: 12px;
            right: auto;
            gap: 8px;
          }
          .conductor-root.is-expanded {
            width: min(420px, calc(100vw - 20px));
          }
          .conductor-transport {
            grid-template-columns: 48px 1fr 24px 32px;
            padding: 9px 10px;
          }
          .conductor-toggle { width: 48px; height: 48px; }
          .conductor-drawer { padding: 10px 10px 12px; gap: 10px; }
          .conductor-row { grid-template-columns: 26px 1fr; gap: 6px; }
          .conductor-cell { height: 14px; }
          .conductor-rail-track { height: 18px; }
          .conductor-rail-label { font-size: 7px; letter-spacing: 0.15em; }
        }

        @media (prefers-reduced-motion: reduce) {
          .conductor-toggle-ring { display: none; }
          .conductor-drawer { transition: opacity 0.2s; transform: none; }
          .conductor-drawer.is-closed { transform: none; }
          .conductor-chevron { transition: none; }
          .conductor-root { transition: none; }
          .conductor-transport { transition: none; }
          .conductor-cell { transition: none; }
          .conductor-rail-playhead { transition: opacity 0.2s; }
        }

        .biome-scale-group {
          position: fixed; top: 18px; right: 18px; z-index: 20;
          display: flex; align-items: center; gap: 10px;
        }
        .biome-scale-meta {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          min-width: 72px;
        }
        .biome-scale-label {
          font-family: 'Orbitron', monospace;
          font-size: clamp(11px, 2vw, 14px);
          font-weight: 500;
          letter-spacing: 0.22em;
          color: #B4C9E0;
          text-align: center;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.75);
        }
        .biome-scale-index {
          font-family: 'Raleway', sans-serif;
          font-size: 9px;
          font-weight: 400;
          letter-spacing: 0.22em;
          color: #7C95B5;
          opacity: 0.85;
        }

        .biome-flash {
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
          animation: biomePulse 1.5s ease-out forwards;
        }


        .biome-error {
          position: fixed; top: 65px; left: 50%;
          transform: translateX(-50%);
          z-index: 15;
          font-family: 'Raleway', sans-serif;
          font-size: 11px;
          color: #FB7185;
          letter-spacing: 0.1em;
        }

        .biome-axis-label {
          position: fixed; z-index: 20;
          font-family: 'Raleway', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.24em;
          color: #8FA6C4;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.75), 0 0 10px rgba(34, 211, 238, 0.15);
          pointer-events: none;
          text-transform: uppercase;
          opacity: 0.75;
        }
        .biome-axis-top {
          top: 60px; left: 50%;
          transform: translateX(-50%);
        }
        .biome-axis-left {
          top: 50%; left: 14px;
          writing-mode: vertical-rl;
          transform: translateY(-50%) rotate(180deg);
        }
        .biome-axis-right {
          top: 50%; right: 14px;
          writing-mode: vertical-rl;
          transform: translateY(-50%);
        }

        /* ── Audio status badge — bottom-right on desktop, repositioned on mobile ── */
        .biome-audio-status {
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
        .biome-audio-status.is-ok  {
          background: rgba(20, 140, 95, 0.6);
          opacity: 0.55;
        }
        .biome-audio-status.is-ok:hover { opacity: 0.9; }
        .biome-audio-status.is-err { background: rgba(220,60,60,0.9); animation: biomePulse 2s ease-in-out infinite; }
        .biome-audio-status:active { transform: scale(0.96); }
        .biome-audio-status-short { display: none; }

        .biome-energy-bar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 9;
          height: 2px;
          pointer-events: none;
        }
        .biome-energy-fill {
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
          .biome-header { top: 48px; }

          /* Conductor → clears the stacked header/theme chooser on narrow screens */
          .conductor-root { top: 94px; }
          .biome-header-title { font-size: 10px; letter-spacing: 0.28em; }
          .biome-header-sub   { font-size: 9px;  letter-spacing: 0.16em; }

          /* Scale group → stays top-right but tighter so it clears the header */
          .biome-scale-group {
            top: 10px;
            right: 10px;
            gap: 6px;
          }
          .biome-scale-label { font-size: 10px; min-width: 48px; letter-spacing: 0.16em; }
          .biome-btn-arrow   { width: 28px; height: 28px; font-size: 14px; }

          /* Axis labels → shrink, lift top guide above DJ panel + headers */
          .biome-axis-top    { top: 92px; font-size: 9px; letter-spacing: 0.18em; }
          .biome-axis-left   { left: 8px; font-size: 9px; letter-spacing: 0.18em; }
          .biome-axis-right  { right: 8px; font-size: 9px; letter-spacing: 0.18em; }

          /* Hint → lift above the drum flowers and DJ panel */
          .biome-hint       { bottom: 170px; font-size: 10px; letter-spacing: 0.18em; }
          .biome-hint-detail { font-size: 9px; letter-spacing: 0.12em; }

          /* Audio status badge → compact chip, pinned bottom-left above the DJ handle */
          .biome-audio-status {
            bottom: 86px;
            left: 10px;
            right: auto;
            padding: 5px 9px;
            font-size: 10px;
            border-radius: 999px;
          }
          .biome-audio-status.is-ok .biome-audio-status-full,
          .biome-audio-status.is-err .biome-audio-status-full { display: none; }
          .biome-audio-status-short { display: inline; }
          /* When audio is healthy the badge is uninteresting chrome — fade it out */
          .biome-audio-status.is-ok { opacity: 0.55; }
        }

        /* ── Jungle theme overrides (applied when .theme-jungle on root wrapper) ── */
        .theme-jungle .biome-splash {
          background: radial-gradient(ellipse at center, rgba(20,61,40,0.85) 0%, rgba(10,31,20,0.95) 100%);
        }
        .theme-jungle .biome-logo {
          background: linear-gradient(135deg, #52b788 0%, #a3e635 40%, #ffe14d 70%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 300% 100%;
          filter: drop-shadow(0 0 30px rgba(163,230,53,0.45));
        }
        .theme-jungle .biome-warp {
          background: radial-gradient(ellipse at center, rgba(20,61,40,0.9) 0%, rgba(10,31,20,0.98) 100%);
        }
        .theme-jungle .biome-warp-text {
          background: linear-gradient(90deg, #a3e635, #ffe14d, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .theme-jungle .biome-warp-fill {
          background: linear-gradient(90deg, #a3e635, #ffe14d, #f59e0b);
          box-shadow: 0 0 12px rgba(163,230,53,0.6);
        }
        .theme-jungle .biome-header-title {
          background: linear-gradient(90deg, #a3e635, #ffe14d, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .theme-jungle .biome-energy-fill {
          background: linear-gradient(90deg, #52b788, #a3e635, #ffe14d, #f59e0b);
          box-shadow: 0 0 8px rgba(163,230,53,0.5), 0 0 16px rgba(255,225,77,0.25);
        }
        .theme-jungle .biome-cta-ring {
          border-color: rgba(163,230,53,0.6);
        }
        .theme-jungle .theme-chooser-option.is-active {
          background: linear-gradient(135deg, rgba(163,230,53,0.28), rgba(255,225,77,0.25));
          box-shadow: inset 0 0 0 1px rgba(163,230,53,0.5);
        }

        /* Scale label + arrow buttons — lime outline + amber glow */
        .theme-jungle .biome-scale-label {
          color: #ffe14d;
          text-shadow: 0 0 10px rgba(255,225,77,0.55), 0 0 24px rgba(163,230,53,0.35);
        }
        .theme-jungle .biome-btn-arrow {
          color: #a3e635;
          background: rgba(10,31,20,0.45);
          border: 1px solid rgba(163,230,53,0.45);
          box-shadow: 0 0 14px rgba(163,230,53,0.18), inset 0 0 8px rgba(255,225,77,0.08);
        }
        .theme-jungle .biome-btn-arrow:hover {
          background: rgba(163,230,53,0.14);
          border-color: rgba(255,225,77,0.55);
          box-shadow: 0 0 22px rgba(255,225,77,0.35), inset 0 0 10px rgba(163,230,53,0.18);
        }
        .theme-jungle .biome-btn-auto {
          color: #a3e635;
          background: rgba(10,31,20,0.5);
          border: 1px solid rgba(163,230,53,0.4);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }
        .theme-jungle .biome-btn-auto.active {
          color: #ffe14d;
          background: rgba(163,230,53,0.18);
          border-color: rgba(255,225,77,0.65);
          box-shadow: 0 0 30px rgba(255,225,77,0.35), inset 0 0 15px rgba(163,230,53,0.18);
        }

        /* Axis labels — moss with lime shadow */
        .theme-jungle .biome-axis-label {
          color: rgba(82,183,136,0.85);
          text-shadow: 0 0 8px rgba(163,230,53,0.45);
        }

        /* Hint — frosted leaf glass */
        .theme-jungle .biome-hint {
          color: #a3e635;
          text-shadow: 0 0 8px rgba(163,230,53,0.35);
        }
        .theme-jungle .biome-hint-detail {
          color: rgba(82,183,136,0.85);
        }

        /* DJ panel — frosted canopy glass */
        .theme-jungle .conductor-transport,
        .theme-jungle .conductor-drawer {
          background: rgba(10,31,20,0.88);
          border: 1px solid rgba(163,230,53,0.32);
          box-shadow: 0 12px 36px rgba(0,0,0,0.6), inset 0 1px 0 rgba(163,230,53,0.1), 0 0 28px rgba(163,230,53,0.15);
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
        }
        .theme-jungle .conductor-toggle {
          color: #d9f99d;
          border-color: rgba(163,230,53,0.45);
          background: radial-gradient(circle at 30% 25%, rgba(163,230,53,0.12), rgba(10,31,20,0.4) 70%);
        }
        .theme-jungle .conductor-toggle.is-active {
          color: #1a2e0a;
          background: radial-gradient(circle at 30% 25%, #ffe14d 0%, #a3e635 55%, #4d7c0f 100%);
          border: 1.5px solid rgba(255,225,77,0.95);
          box-shadow:
            0 0 26px rgba(255,225,77,0.55),
            0 0 10px rgba(163,230,53,0.45),
            inset 0 1px 2px rgba(255,255,255,0.35),
            inset 0 -2px 6px rgba(77,124,15,0.35);
        }
        .theme-jungle .conductor-toggle.is-active::before {
          border-color: rgba(255,225,77,0.45);
          box-shadow: 0 0 14px rgba(255,225,77,0.4);
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
        .theme-jungle .conductor-cell[data-hit="1"] {
          border-color: rgba(255,225,77,0.7) !important;
          box-shadow: 0 0 6px rgba(255,225,77,0.45);
        }
        .theme-jungle .conductor-cell.is-downbeat { border-left: 2px solid rgba(255,225,77,0.6) !important; }
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
        .theme-jungle .biome-flash {
          color: #ffe14d;
          text-shadow: 0 0 14px rgba(255,225,77,0.6), 0 0 30px rgba(245,158,11,0.4);
        }

        /* Header sub — moss tint */
        .theme-jungle .biome-header-sub {
          color: rgba(82,183,136,0.75);
        }

        /* ── Sea theme overrides (applied when .theme-sea on root wrapper) ── */
        .theme-sea .biome-splash {
          background: radial-gradient(ellipse at center, rgba(6,58,82,0.85) 0%, rgba(4,26,46,0.96) 100%);
        }
        .theme-sea .biome-logo {
          background: linear-gradient(135deg, #6cd9ff 0%, #7ae582 40%, #a8e6cf 70%, #ff6b9d 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 300% 100%;
          filter: drop-shadow(0 0 30px rgba(108,217,255,0.45));
        }
        .theme-sea .biome-warp {
          background: radial-gradient(ellipse at center, rgba(6,58,82,0.9) 0%, rgba(4,26,46,0.98) 100%);
        }
        .theme-sea .biome-warp-text {
          background: linear-gradient(90deg, #6cd9ff, #a8e6cf, #ff6b9d);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .theme-sea .biome-warp-fill {
          background: linear-gradient(90deg, #6cd9ff, #a8e6cf, #ff6b9d);
          box-shadow: 0 0 12px rgba(108,217,255,0.6);
        }
        .theme-sea .biome-header-title {
          background: linear-gradient(90deg, #6cd9ff, #a8e6cf, #7ae582);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .theme-sea .biome-energy-fill {
          background: linear-gradient(90deg, #0a3a5e, #6cd9ff, #a8e6cf, #7ae582);
          box-shadow: 0 0 8px rgba(108,217,255,0.5), 0 0 16px rgba(168,230,207,0.25);
        }
        .theme-sea .biome-cta-ring {
          border-color: rgba(108,217,255,0.6);
        }
        .theme-sea .theme-chooser-option.is-active {
          background: linear-gradient(135deg, rgba(108,217,255,0.28), rgba(255,107,157,0.25));
          box-shadow: inset 0 0 0 1px rgba(108,217,255,0.5);
        }

        /* Scale label + arrow buttons — cyan outline + seafoam glow */
        .theme-sea .biome-scale-label {
          color: #a8e6cf;
          text-shadow: 0 0 10px rgba(168,230,207,0.55), 0 0 24px rgba(108,217,255,0.35);
        }
        .theme-sea .biome-btn-arrow {
          color: #6cd9ff;
          background: rgba(4,26,46,0.45);
          border: 1px solid rgba(108,217,255,0.45);
          box-shadow: 0 0 14px rgba(108,217,255,0.18), inset 0 0 8px rgba(168,230,207,0.08);
        }
        .theme-sea .biome-btn-arrow:hover {
          background: rgba(108,217,255,0.14);
          border-color: rgba(168,230,207,0.55);
          box-shadow: 0 0 22px rgba(168,230,207,0.35), inset 0 0 10px rgba(108,217,255,0.18);
        }
        .theme-sea .biome-btn-auto {
          color: #6cd9ff;
          background: rgba(4,26,46,0.5);
          border: 1px solid rgba(108,217,255,0.4);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }
        .theme-sea .biome-btn-auto.active {
          color: #ff6b9d;
          background: rgba(108,217,255,0.18);
          border-color: rgba(255,107,157,0.65);
          box-shadow: 0 0 30px rgba(255,107,157,0.35), inset 0 0 15px rgba(108,217,255,0.18);
        }

        /* Axis labels — muted teal with cyan shadow */
        .theme-sea .biome-axis-label {
          color: rgba(122,229,130,0.85);
          text-shadow: 0 0 8px rgba(108,217,255,0.45);
        }

        /* Hint */
        .theme-sea .biome-hint {
          color: #6cd9ff;
          text-shadow: 0 0 8px rgba(108,217,255,0.35);
        }
        .theme-sea .biome-hint-detail {
          color: rgba(122,229,130,0.85);
        }

        /* DJ panel — frosted ocean glass */
        .theme-sea .conductor-transport,
        .theme-sea .conductor-drawer {
          background: rgba(4,26,46,0.88);
          border: 1px solid rgba(108,217,255,0.32);
          box-shadow: 0 12px 36px rgba(0,0,0,0.6), inset 0 1px 0 rgba(108,217,255,0.1), 0 0 28px rgba(108,217,255,0.15);
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
        }
        .theme-sea .conductor-toggle {
          color: #cbe9f7;
          border-color: rgba(108,217,255,0.45);
          background: radial-gradient(circle at 30% 25%, rgba(108,217,255,0.12), rgba(4,26,46,0.4) 70%);
        }
        .theme-sea .conductor-toggle.is-active {
          color: #22142a;
          background: radial-gradient(circle at 30% 25%, #ffc8dc 0%, #ff6b9d 55%, #6cd9ff 100%);
          border: 1.5px solid rgba(255,107,157,0.95);
          box-shadow:
            0 0 26px rgba(255,107,157,0.55),
            0 0 10px rgba(108,217,255,0.45),
            inset 0 1px 2px rgba(255,255,255,0.35),
            inset 0 -2px 6px rgba(108,217,255,0.35);
        }
        .theme-sea .conductor-toggle.is-active::before {
          border-color: rgba(255,107,157,0.45);
          box-shadow: 0 0 14px rgba(255,107,157,0.4);
        }
        .theme-sea .conductor-bpm {
          background: linear-gradient(90deg, #6cd9ff, #a8e6cf);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .theme-sea .conductor-phase { color: #ff6b9d; text-shadow: 0 0 10px rgba(255,107,157,0.4); }

        /* Sea drum cells — coral active highlight on cyan-tinted cells */
        .theme-sea .conductor-cell { background: rgba(0,53,84,0.55) !important; border-color: rgba(108,217,255,0.22) !important; }
        .theme-sea .conductor-cell[data-hit="1"] {
          background: linear-gradient(180deg, rgba(255,107,157,0.85), rgba(108,217,255,0.5)) !important;
          border-color: rgba(255,107,157,0.75) !important;
          box-shadow: 0 0 6px rgba(255,107,157,0.55);
        }
        .theme-sea .conductor-cell.is-downbeat { border-left: 2px solid rgba(255,107,157,0.6) !important; }
        .theme-sea .conductor-cell[data-active="1"] {
          outline: 1.5px solid rgba(255,107,157,0.95);
          box-shadow: 0 0 14px rgba(255,107,157,0.7);
        }
        .theme-sea .conductor-cell[data-user="on"] {
          border-color: rgba(255,107,157,0.85) !important;
          box-shadow: inset 0 0 0 1px rgba(255,107,157,0.55), 0 0 10px rgba(255,107,157,0.35);
        }

        /* Flash — seafoam */
        .theme-sea .biome-flash {
          color: #a8e6cf;
          text-shadow: 0 0 14px rgba(168,230,207,0.6), 0 0 30px rgba(108,217,255,0.4);
        }

        /* Header sub — teal tint */
        .theme-sea .biome-header-sub {
          color: rgba(122,229,130,0.75);
        }

        /* ── Splash onboarding — three mini cards that preview controls ── */
        .biome-onboard {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          width: min(420px, calc(100vw - 48px));
          margin-top: 6px;
        }
        .biome-onboard-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 8px 10px;
          border-radius: 12px;
          background: rgba(229,244,251,0.04);
          border: 1px solid rgba(129,140,248,0.22);
          box-shadow: inset 0 1px 0 rgba(229,244,251,0.05);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .biome-onboard-icon {
          font-family: 'Orbitron', monospace;
          font-size: 18px;
          color: #22D3EE;
          text-shadow: 0 0 12px rgba(34,211,238,0.55);
          line-height: 1;
        }
        .biome-onboard-label {
          font-family: 'Orbitron', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: #E5F4FB;
          text-transform: uppercase;
          text-align: center;
        }
        .biome-onboard-hint {
          font-family: 'Raleway', sans-serif;
          font-size: 10px;
          font-weight: 300;
          letter-spacing: 0.1em;
          color: #7C95B5;
          text-align: center;
        }
        .theme-jungle .biome-onboard-card {
          border-color: rgba(163,230,53,0.28);
        }
        .theme-jungle .biome-onboard-icon {
          color: #a3e635;
          text-shadow: 0 0 12px rgba(163,230,53,0.55);
        }
        .theme-sea .biome-onboard-card {
          border-color: rgba(108,217,255,0.28);
        }
        .theme-sea .biome-onboard-icon {
          color: #6cd9ff;
          text-shadow: 0 0 12px rgba(108,217,255,0.55);
        }

        /* ── Persistent help trigger (? button, bottom-left on desktop) ── */
        .biome-help-trigger {
          all: unset;
          position: fixed;
          left: 12px; bottom: 12px;
          z-index: 50;
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(15, 27, 45, 0.55);
          border: 1px solid rgba(34,211,238,0.35);
          color: #22D3EE;
          font-family: 'Orbitron', monospace;
          font-size: 15px; font-weight: 700;
          cursor: pointer;
          touch-action: manipulation;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.4), 0 0 14px rgba(34,211,238,0.15);
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .biome-help-trigger:hover {
          background: rgba(34,211,238,0.18);
          box-shadow: 0 4px 14px rgba(0,0,0,0.4), 0 0 22px rgba(34,211,238,0.35);
        }
        .biome-help-trigger:active { transform: scale(0.94); }
        .biome-help-trigger:focus-visible {
          outline: 2px solid rgba(34,211,238,0.9);
          outline-offset: 2px;
        }
        .theme-jungle .biome-help-trigger {
          color: #a3e635; border-color: rgba(163,230,53,0.4);
          box-shadow: 0 4px 14px rgba(0,0,0,0.4), 0 0 14px rgba(163,230,53,0.18);
        }
        .theme-sea .biome-help-trigger {
          color: #6cd9ff; border-color: rgba(108,217,255,0.4);
          box-shadow: 0 4px 14px rgba(0,0,0,0.4), 0 0 14px rgba(108,217,255,0.18);
        }

        /* ── Help overlay (modal-style controls reference) ── */
        .biome-help-backdrop {
          position: fixed; inset: 0;
          z-index: 110;
          display: flex; align-items: center; justify-content: center;
          background: rgba(6, 12, 22, 0.65);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          padding: 24px 16px;
          animation: cosmicFadeIn 0.25s ease-out;
          overscroll-behavior: contain;
        }
        .biome-help-card {
          position: relative;
          width: min(460px, 100%);
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          padding: 24px 22px 18px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(22,37,64,0.95) 0%, rgba(15,27,45,0.98) 100%);
          border: 1px solid rgba(129,140,248,0.3);
          box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(34,211,238,0.15);
          color: #E5F4FB;
          -webkit-overflow-scrolling: touch;
        }
        .biome-help-close {
          all: unset;
          position: absolute;
          top: 10px; right: 12px;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          color: #B4C9E0;
          font-size: 22px; line-height: 1;
          cursor: pointer;
          touch-action: manipulation;
          transition: background 0.2s, color 0.2s;
        }
        .biome-help-close:hover { background: rgba(229,244,251,0.08); color: #fff; }
        .biome-help-close:focus-visible {
          outline: 2px solid rgba(34,211,238,0.9);
          outline-offset: 2px;
        }
        .biome-help-title {
          font-family: 'Orbitron', monospace;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.22em;
          background: linear-gradient(90deg, #22D3EE, #818CF8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 4px;
        }
        .biome-help-subtitle {
          font-family: 'Raleway', sans-serif;
          font-size: 12px;
          font-weight: 300;
          letter-spacing: 0.14em;
          color: #7C95B5;
          margin-bottom: 16px;
        }
        .biome-help-section {
          margin-bottom: 14px;
        }
        .biome-help-section:last-of-type { margin-bottom: 10px; }
        .biome-help-section-title {
          font-family: 'Orbitron', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.28em;
          color: #22D3EE;
          text-transform: uppercase;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(129,140,248,0.15);
        }
        .biome-help-list {
          list-style: none;
          padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 8px;
          font-family: 'Raleway', sans-serif;
          font-size: 13px;
          font-weight: 300;
          letter-spacing: 0.02em;
          color: #B4C9E0;
        }
        .biome-help-list li {
          display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
          line-height: 1.35;
        }
        .biome-help-list strong {
          font-weight: 600;
          color: #E5F4FB;
          letter-spacing: 0.04em;
        }
        .biome-help-key,
        .biome-help-kbd {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 2px 8px;
          min-width: 28px;
          border-radius: 6px;
          font-family: 'Orbitron', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          background: rgba(34,211,238,0.12);
          border: 1px solid rgba(34,211,238,0.35);
          color: #22D3EE;
          text-transform: uppercase;
          text-shadow: 0 0 6px rgba(34,211,238,0.3);
          white-space: nowrap;
        }
        .biome-help-kbd {
          background: rgba(229,244,251,0.06);
          border-color: rgba(229,244,251,0.2);
          color: #E5F4FB;
          text-shadow: none;
          box-shadow: inset 0 -1px 0 rgba(0,0,0,0.35);
        }
        .biome-help-footer {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid rgba(129,140,248,0.15);
          font-family: 'Raleway', sans-serif;
          font-size: 10px;
          font-weight: 300;
          letter-spacing: 0.18em;
          color: #5A7295;
          text-align: center;
          text-transform: uppercase;
        }
        .theme-jungle .biome-help-card {
          background: linear-gradient(135deg, rgba(20,61,40,0.95) 0%, rgba(10,31,20,0.98) 100%);
          border-color: rgba(163,230,53,0.3);
          box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(163,230,53,0.15);
        }
        .theme-jungle .biome-help-title {
          background: linear-gradient(90deg, #a3e635, #ffe14d);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .theme-jungle .biome-help-section-title { color: #a3e635; border-bottom-color: rgba(163,230,53,0.2); }
        .theme-jungle .biome-help-key {
          background: rgba(163,230,53,0.14);
          border-color: rgba(163,230,53,0.45);
          color: #a3e635;
          text-shadow: 0 0 6px rgba(163,230,53,0.35);
        }
        .theme-sea .biome-help-card {
          background: linear-gradient(135deg, rgba(6,58,82,0.95) 0%, rgba(4,26,46,0.98) 100%);
          border-color: rgba(108,217,255,0.3);
          box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(108,217,255,0.15);
        }
        .theme-sea .biome-help-title {
          background: linear-gradient(90deg, #6cd9ff, #a8e6cf);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .theme-sea .biome-help-section-title { color: #6cd9ff; border-bottom-color: rgba(108,217,255,0.2); }
        .theme-sea .biome-help-key {
          background: rgba(108,217,255,0.14);
          border-color: rgba(108,217,255,0.45);
          color: #6cd9ff;
          text-shadow: 0 0 6px rgba(108,217,255,0.35);
        }

        /* ── Cyberpunk theme overrides (applied when .theme-cyberpunk on root wrapper) ── */
        .theme-cyberpunk .biome-splash {
          background: radial-gradient(ellipse at center, rgba(22,4,40,0.9) 0%, rgba(7,2,26,0.97) 100%);
        }
        .theme-cyberpunk .biome-logo {
          background: linear-gradient(135deg, #ff2bd6 0%, #9d00ff 40%, #21e7ff 80%, #ffffff 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 30px rgba(255,43,214,0.55));
        }
        .theme-cyberpunk .biome-warp {
          background: radial-gradient(ellipse at center, rgba(34,0,60,0.85) 0%, rgba(7,2,26,0.95) 100%);
        }
        .theme-cyberpunk .biome-warp-text {
          color: #ff2bd6;
          text-shadow: 0 0 14px rgba(255,43,214,0.7), 0 0 30px rgba(33,231,255,0.4);
          letter-spacing: 0.3em;
        }
        .theme-cyberpunk .biome-warp-fill {
          background: linear-gradient(90deg, #9d00ff, #ff2bd6, #21e7ff);
          box-shadow: 0 0 14px rgba(255,43,214,0.75);
        }
        .theme-cyberpunk .biome-header-title {
          background: linear-gradient(90deg, #ff2bd6, #21e7ff);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .theme-cyberpunk .biome-energy-fill {
          background: linear-gradient(90deg, #9d00ff, #ff2bd6, #21e7ff);
        }
        .theme-cyberpunk .biome-cta-ring {
          border-color: rgba(255,43,214,0.55);
          box-shadow: 0 0 22px rgba(255,43,214,0.5), inset 0 0 12px rgba(33,231,255,0.3);
        }
        .theme-cyberpunk .theme-chooser-option.is-active {
          background: rgba(255,43,214,0.18);
          border-color: rgba(255,43,214,0.65);
          box-shadow: 0 0 12px rgba(255,43,214,0.4);
        }
        .theme-cyberpunk .biome-scale-label {
          color: #ff2bd6;
          text-shadow: 0 0 10px rgba(255,43,214,0.6);
        }
        .theme-cyberpunk .biome-btn-arrow {
          color: #21e7ff;
          border-color: rgba(33,231,255,0.45);
          background: rgba(10,4,26,0.55);
          text-shadow: 0 0 8px rgba(33,231,255,0.5);
        }
        .theme-cyberpunk .biome-btn-arrow:hover {
          background: rgba(33,231,255,0.12);
          border-color: rgba(33,231,255,0.75);
        }
        .theme-cyberpunk .biome-btn-auto {
          background: rgba(10,4,26,0.6);
          border-color: rgba(157,0,255,0.45);
          color: #9d00ff;
        }
        .theme-cyberpunk .biome-btn-auto.active {
          background: rgba(255,43,214,0.22);
          border-color: rgba(255,43,214,0.9);
          color: #ff2bd6;
          box-shadow: 0 0 20px rgba(255,43,214,0.55);
        }
        .theme-cyberpunk .biome-axis-label {
          color: rgba(33,231,255,0.85);
          text-shadow: 0 0 6px rgba(33,231,255,0.5);
        }
        .theme-cyberpunk .biome-hint { color: rgba(255,122,226,0.95); }
        .theme-cyberpunk .biome-hint-detail { color: rgba(33,231,255,0.75); }
        .theme-cyberpunk .conductor-transport,
        .theme-cyberpunk .conductor-drawer {
          background: rgba(10,4,26,0.92);
          border-color: rgba(255,43,214,0.4);
          box-shadow: 0 0 22px rgba(255,43,214,0.28);
        }
        .theme-cyberpunk .conductor-toggle {
          background: rgba(157,0,255,0.15);
          border-color: rgba(157,0,255,0.55);
          color: #ff2bd6;
        }
        .theme-cyberpunk .conductor-toggle.is-active {
          background: rgba(255,43,214,0.28);
          border-color: #ff2bd6;
          color: #ffffff;
          box-shadow: 0 0 18px rgba(255,43,214,0.6);
        }
        .theme-cyberpunk .conductor-toggle.is-active::before {
          box-shadow: 0 0 14px rgba(33,231,255,0.65);
        }
        .theme-cyberpunk .conductor-bpm {
          color: #21e7ff;
          text-shadow: 0 0 6px rgba(33,231,255,0.4);
        }
        .theme-cyberpunk .conductor-phase { color: #ff2bd6; text-shadow: 0 0 10px rgba(255,43,214,0.5); }
        .theme-cyberpunk .conductor-cell {
          background: rgba(16,6,38,0.65) !important;
          border-color: rgba(157,0,255,0.28) !important;
        }
        .theme-cyberpunk .conductor-cell[data-hit="1"] {
          background: linear-gradient(180deg, rgba(255,43,214,0.9), rgba(255,43,214,0.45)) !important;
          border-color: rgba(255,43,214,0.85) !important;
          box-shadow: 0 0 8px rgba(255,43,214,0.65);
        }
        .theme-cyberpunk .conductor-cell.is-downbeat { border-left: 2px solid rgba(255,43,214,0.7) !important; }
        .theme-cyberpunk .conductor-cell[data-active="1"] {
          outline: 1.5px solid rgba(33,231,255,0.95);
          outline-offset: 1px;
          box-shadow: 0 0 12px rgba(33,231,255,0.8);
        }
        .theme-cyberpunk .conductor-cell[data-user="on"] {
          outline: 1px solid rgba(33,231,255,0.8);
          outline-offset: -1px;
        }
        .theme-cyberpunk .conductor-cell-grid {
          display: block;
          position: absolute;
          inset: 2px;
          opacity: 0.18;
          background:
            linear-gradient(to right, transparent 48%, rgba(33,231,255,0.7) 50%, transparent 52%),
            linear-gradient(to bottom, transparent 48%, rgba(33,231,255,0.7) 50%, transparent 52%);
          pointer-events: none;
        }
        .theme-cyberpunk .conductor-cell[data-hit="1"] .conductor-cell-grid { opacity: 0; }
        .theme-cyberpunk .conductor-cell[data-active="1"] .conductor-cell-grid { opacity: 0.8; background-color: rgba(255,255,255,0.1); }
        .theme-cyberpunk .biome-flash {
          color: #ff2bd6;
          text-shadow: 0 0 14px rgba(255,43,214,0.7);
        }
        .theme-cyberpunk .biome-header-sub { color: rgba(33,231,255,0.8); }
        .theme-cyberpunk .biome-onboard-card {
          background: rgba(16,6,38,0.6);
          border-color: rgba(255,43,214,0.35);
        }
        .theme-cyberpunk .biome-onboard-icon {
          color: #ff2bd6;
          text-shadow: 0 0 8px rgba(255,43,214,0.55);
        }
        .theme-cyberpunk .biome-help-trigger {
          background: rgba(255,43,214,0.2);
          border-color: rgba(255,43,214,0.65);
          color: #ffffff;
          box-shadow: 0 0 12px rgba(255,43,214,0.45);
        }
        .theme-cyberpunk .biome-help-card {
          background: linear-gradient(135deg, rgba(20,6,46,0.96), rgba(7,2,26,0.96));
          border-color: rgba(255,43,214,0.35);
        }
        .theme-cyberpunk .biome-help-title {
          background: linear-gradient(90deg, #ff2bd6, #21e7ff);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .theme-cyberpunk .biome-help-section-title { color: #ff2bd6; border-bottom-color: rgba(255,43,214,0.25); }
        .theme-cyberpunk .biome-help-key {
          background: rgba(255,43,214,0.14);
          border-color: rgba(255,43,214,0.55);
          color: #ff2bd6;
          text-shadow: 0 0 6px rgba(255,43,214,0.4);
        }

        /* Focus-visible rings across all interactive chrome */
        .theme-chooser-option:focus-visible,
        .conductor-toggle:focus-visible,
        .conductor-expand:focus-visible,
        .biome-btn-arrow:focus-visible,
        .biome-audio-status:focus-visible {
          outline: 2px solid rgba(34,211,238,0.85);
          outline-offset: 2px;
        }

        /* Mobile tweaks for the new chrome */
        @media (max-width: 480px) {
          .biome-onboard {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
            width: calc(100vw - 32px);
          }
          .biome-onboard-card { padding: 8px 4px 7px; gap: 2px; border-radius: 10px; }
          .biome-onboard-icon { font-size: 14px; }
          .biome-onboard-label { font-size: 8px; letter-spacing: 0.14em; }
          .biome-onboard-hint  { font-size: 8px; letter-spacing: 0.08em; }

          /* Help trigger → keep bottom-left but above audio badge */
          .biome-help-trigger {
            left: 10px; bottom: 130px;
            width: 32px; height: 32px;
            font-size: 14px;
          }

          /* Help card full-bleed feel on phones */
          .biome-help-card { padding: 20px 18px 14px; border-radius: 14px; }
          .biome-help-title { font-size: 16px; letter-spacing: 0.18em; }
          .biome-help-list { font-size: 12px; }
          .biome-help-key, .biome-help-kbd { font-size: 9px; padding: 2px 6px; }

          /* Scale meta — keep index visible under the label */
          .biome-scale-meta { min-width: 56px; }
          .biome-scale-index { font-size: 8px; letter-spacing: 0.18em; }
        }

        @media (prefers-reduced-motion: reduce) {
          .biome-help-backdrop { animation: none; }
        }

        /* ── Tundra theme overrides — icy / white polar daylight ──
           All text sits on a bright pale sky, so we invert the pattern used by
           the other biomes: dark ink for readability, soft frosted surfaces
           instead of deep navy glass. */
        .theme-tundra .biome-splash {
          background: radial-gradient(ellipse at center, rgba(226,252,255,0.92) 0%, rgba(180,219,246,0.96) 100%);
        }
        .theme-tundra .biome-logo {
          background: linear-gradient(135deg, #0c2a4b 0%, #1c6fb2 35%, #62b3e8 65%, #0c2a4b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 300% 100%;
          filter: drop-shadow(0 0 22px rgba(255,255,255,0.85)) drop-shadow(0 2px 8px rgba(20,60,100,0.25));
        }
        .theme-tundra .biome-splash .biome-subtitle {
          color: #1c3d5e;
        }
        .theme-tundra .biome-splash .biome-line {
          background: linear-gradient(90deg, transparent, rgba(40,80,120,0.55), transparent);
        }
        .theme-tundra .biome-warp {
          background: radial-gradient(ellipse at center, rgba(226,252,255,0.95) 0%, rgba(180,219,246,0.98) 100%);
        }
        .theme-tundra .biome-warp-text {
          background: linear-gradient(90deg, #0c2a4b, #1c6fb2, #0c2a4b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .theme-tundra .biome-warp-fill {
          background: linear-gradient(90deg, #aedbf0, #1c6fb2, #0c2a4b);
          box-shadow: 0 0 12px rgba(28,111,178,0.45);
        }
        .theme-tundra .biome-header-title {
          background: linear-gradient(90deg, #0c2a4b, #1c6fb2, #0c2a4b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .theme-tundra .biome-energy-fill {
          background: linear-gradient(90deg, #aedbf0, #62b3e8, #1c6fb2, #ff9a33);
          box-shadow: 0 0 8px rgba(28,111,178,0.45), 0 0 16px rgba(255,154,51,0.2);
        }
        .theme-tundra .biome-cta-ring {
          border-color: rgba(28,111,178,0.65);
        }
        .theme-tundra .biome-cta {
          color: #0c2a4b;
        }
        .theme-tundra .theme-chooser-option {
          color: #1c3d5e;
          background: rgba(255,255,255,0.6);
          border-color: rgba(100,150,190,0.35);
        }
        .theme-tundra .theme-chooser-option.is-active {
          background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(174,219,240,0.9));
          box-shadow: inset 0 0 0 1px rgba(28,111,178,0.55), 0 2px 10px rgba(28,111,178,0.2);
          color: #0c2a4b;
        }

        /* Scale label + arrow buttons — dark ink on frosted white */
        .theme-tundra .biome-scale-label {
          color: #0c2a4b;
          text-shadow: 0 0 8px rgba(255,255,255,0.9);
        }
        .theme-tundra .biome-scale-index {
          color: rgba(28,61,94,0.7);
        }
        .theme-tundra .biome-btn-arrow {
          color: #0c2a4b;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(28,111,178,0.45);
          box-shadow: 0 2px 10px rgba(28,111,178,0.12), inset 0 1px 0 rgba(255,255,255,0.8);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .theme-tundra .biome-btn-arrow:hover {
          background: rgba(255,255,255,0.9);
          border-color: rgba(255,154,51,0.65);
          box-shadow: 0 2px 16px rgba(255,154,51,0.3), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .theme-tundra .biome-btn-auto {
          color: #0c2a4b;
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(28,111,178,0.4);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }
        .theme-tundra .biome-btn-auto.active {
          color: #ffffff;
          background: linear-gradient(135deg, #ff9a33, #ffb366);
          border-color: rgba(255,154,51,0.9);
          box-shadow: 0 0 30px rgba(255,154,51,0.45), inset 0 0 15px rgba(255,255,255,0.25);
        }

        .theme-tundra .biome-axis-label {
          color: rgba(28,61,94,0.85);
          text-shadow: 0 0 6px rgba(255,255,255,0.9);
        }

        .theme-tundra .biome-hint {
          color: #0c2a4b;
          background: rgba(255,255,255,0.75);
          border-color: rgba(28,111,178,0.3);
          text-shadow: 0 0 4px rgba(255,255,255,0.9);
        }
        .theme-tundra .biome-hint-detail {
          color: rgba(28,61,94,0.75);
        }

        /* DJ panel — frosted white-ice glass */
        .theme-tundra .conductor-transport,
        .theme-tundra .conductor-drawer {
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(100,150,190,0.4);
          box-shadow: 0 12px 36px rgba(30,80,130,0.2), inset 0 1px 0 rgba(255,255,255,0.9), 0 0 24px rgba(226,252,255,0.5);
          backdrop-filter: blur(16px) saturate(140%);
          -webkit-backdrop-filter: blur(16px) saturate(140%);
          color: #0c2a4b;
        }
        .theme-tundra .conductor-toggle {
          color: #0c2a4b;
          border-color: rgba(28,111,178,0.55);
          background: radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95), rgba(226,252,255,0.75) 70%);
        }
        .theme-tundra .conductor-toggle.is-active {
          color: #ffffff;
          background: radial-gradient(circle at 30% 25%, #ffb366 0%, #ff9a33 60%, #c66b14 100%);
          border: 1.5px solid rgba(255,154,51,0.95);
          box-shadow:
            0 0 26px rgba(255,154,51,0.5),
            0 0 10px rgba(255,200,120,0.45),
            inset 0 1px 2px rgba(255,255,255,0.5),
            inset 0 -2px 6px rgba(200,100,20,0.2);
        }
        .theme-tundra .conductor-toggle.is-active::before {
          border-color: rgba(255,154,51,0.55);
          box-shadow: 0 0 14px rgba(255,154,51,0.45);
        }
        .theme-tundra .conductor-bpm {
          background: linear-gradient(90deg, #0c2a4b, #1c6fb2);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .theme-tundra .conductor-phase { color: #c66b14; text-shadow: 0 0 8px rgba(255,154,51,0.35); }

        .theme-tundra .conductor-cell { background: rgba(226,252,255,0.6) !important; border-color: rgba(100,150,190,0.35) !important; }
        .theme-tundra .conductor-cell[data-hit="1"] {
          background: linear-gradient(180deg, #ffb366, #ff9a33) !important;
          border-color: rgba(198,107,20,0.75) !important;
          box-shadow: 0 0 6px rgba(255,154,51,0.45);
        }
        .theme-tundra .conductor-cell.is-downbeat { border-left: 2px solid rgba(198,107,20,0.8) !important; }
        .theme-tundra .conductor-cell[data-active="1"] {
          outline: 1.5px solid rgba(12,42,75,0.9);
          box-shadow: 0 0 14px rgba(28,111,178,0.5);
        }
        .theme-tundra .conductor-cell[data-user="on"] {
          border-color: rgba(198,107,20,0.85) !important;
          box-shadow: inset 0 0 0 1px rgba(255,154,51,0.6), 0 0 10px rgba(255,154,51,0.35);
        }

        /* Flash — pure white pop */
        .theme-tundra .biome-flash {
          color: #0c2a4b;
          text-shadow: 0 0 14px rgba(255,255,255,0.9), 0 0 30px rgba(226,252,255,0.7);
        }

        .theme-tundra .biome-header-sub {
          color: rgba(28,61,94,0.75);
        }
        .theme-tundra .biome-onboard-card {
          background: rgba(255,255,255,0.58);
          border-color: rgba(100,150,190,0.35);
          color: #0c2a4b;
        }
        .theme-tundra .biome-onboard-icon {
          color: #1c6fb2;
          text-shadow: 0 0 10px rgba(255,255,255,0.8);
        }
        .theme-tundra .biome-onboard-label { color: #0c2a4b; }
        .theme-tundra .biome-onboard-hint  { color: rgba(28,61,94,0.75); }
        .theme-tundra .biome-help-trigger {
          color: #0c2a4b;
          border-color: rgba(28,111,178,0.45);
          background: rgba(255,255,255,0.72);
        }
        .theme-tundra .biome-help-card {
          background: rgba(255,255,255,0.95);
          border-color: rgba(100,150,190,0.4);
          color: #0c2a4b;
        }
        .theme-tundra .biome-help-title {
          background: linear-gradient(90deg, #0c2a4b, #1c6fb2);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .theme-tundra .biome-help-section-title { color: #1c6fb2; border-bottom-color: rgba(100,150,190,0.35); }
        .theme-tundra .biome-help-key {
          background: rgba(226,252,255,0.85);
          border-color: rgba(28,111,178,0.5);
          color: #0c2a4b;
          text-shadow: 0 0 4px rgba(255,255,255,0.9);
        }

        /* Audio status badge — keep it legible on the bright sky */
        .theme-tundra .biome-audio-status {
          background: rgba(255,255,255,0.8);
          color: #0c2a4b;
          border-color: rgba(28,111,178,0.45);
        }
        .theme-tundra .biome-audio-status.is-ok {
          background: rgba(226,252,255,0.9);
          border-color: rgba(28,111,178,0.55);
        }
        .theme-tundra .biome-error {
          background: rgba(255,255,255,0.85);
          color: #992b1a;
          border-color: rgba(255,154,51,0.55);
        }
`;
