interface FloatingBubblesProps {
  visible: boolean;
}

interface BubbleSlot {
  left: string;
  size: number;
  duration: string;
  delay: string;
  swayDuration: string;
  swayDelay: string;
  opacity: number;
}

// DOM-layer rising bubbles to complement the canvas-physics bubbles.
// Adds an extra parallax depth pass over the entire underwater column.
const BUBBLES: BubbleSlot[] = [
  { left: "8%",  size: 14, duration: "16s", delay: "-2s",  swayDuration: "3.4s", swayDelay: "0s",   opacity: 0.65 },
  { left: "22%", size: 8,  duration: "22s", delay: "-12s", swayDuration: "4.2s", swayDelay: "-1s",  opacity: 0.5  },
  { left: "38%", size: 18, duration: "14s", delay: "-6s",  swayDuration: "3.0s", swayDelay: "-2s",  opacity: 0.7  },
  { left: "52%", size: 10, duration: "20s", delay: "-15s", swayDuration: "3.8s", swayDelay: "-0.4s", opacity: 0.55 },
  { left: "68%", size: 12, duration: "18s", delay: "-9s",  swayDuration: "3.2s", swayDelay: "-1.6s", opacity: 0.6  },
  { left: "82%", size: 16, duration: "15s", delay: "-3s",  swayDuration: "3.6s", swayDelay: "-2.4s", opacity: 0.7  },
  { left: "92%", size: 7,  duration: "24s", delay: "-18s", swayDuration: "4.6s", swayDelay: "-0.8s", opacity: 0.45 },
];

export default function FloatingBubbles({ visible }: FloatingBubblesProps) {
  return (
    <div className="floating-bubbles-overlay" data-visible={visible ? "true" : "false"}>
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className="floating-bubble"
          style={{
            left: b.left,
            width: `${b.size}px`,
            height: `${b.size}px`,
            opacity: b.opacity,
            animationDuration: b.duration,
            animationDelay: b.delay,
          }}
        >
          <div
            className="floating-bubble-sway"
            style={{
              animationDuration: b.swayDuration,
              animationDelay: b.swayDelay,
            }}
          >
            <span className="bubble-shell" />
            <span className="bubble-shine" />
          </div>
        </div>
      ))}

      <style>{`
        .floating-bubbles-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 4;
          opacity: 0;
          transition: opacity 0.8s ease-out;
          overflow: hidden;
        }
        .floating-bubbles-overlay[data-visible="true"] { opacity: 1; }

        .floating-bubble {
          position: absolute;
          bottom: 0;
          animation-name: bubble-rise;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .floating-bubble-sway {
          width: 100%;
          height: 100%;
          position: relative;
          animation-name: bubble-sway;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }
        .bubble-shell {
          position: absolute; inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(168,230,207,0.25), rgba(108,217,255,0.12) 60%, rgba(108,217,255,0));
          border: 1px solid rgba(168,230,207,0.5);
          box-shadow: 0 0 8px rgba(168,230,207,0.35), inset 0 0 4px rgba(255,255,255,0.2);
        }
        .bubble-shine {
          position: absolute;
          top: 18%; left: 22%;
          width: 28%; height: 28%;
          border-radius: 50%;
          background: rgba(255,255,255,0.65);
          filter: blur(0.5px);
        }

        @keyframes bubble-rise {
          from { transform: translateY(20vh); }
          to   { transform: translateY(-110vh); }
        }
        @keyframes bubble-sway {
          from { margin-left: -8px; }
          to   { margin-left: 8px; }
        }

        @media (max-width: 480px) {
          .floating-bubble:nth-child(2),
          .floating-bubble:nth-child(5),
          .floating-bubble:nth-child(7) { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .floating-bubble, .floating-bubble-sway { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
