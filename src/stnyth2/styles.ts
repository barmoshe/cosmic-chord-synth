export const STNYTH2_KEYFRAMES = `
@keyframes stnyth2-draw-arc {
  from { stroke-dashoffset: var(--arc-length); }
  to { stroke-dashoffset: 0; }
}

@keyframes stnyth2-draw-arc-reverse {
  from { stroke-dashoffset: calc(var(--arc-length) * -1); }
  to { stroke-dashoffset: 0; }
}

@keyframes stnyth2-letter-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes stnyth2-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes stnyth2-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes stnyth2-rise-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

export const STNYTH2_PALETTE = {
  bg: "#0a0a0f",
  fg: "#e8e8ee",
  muted: "rgba(232, 232, 238, 0.55)",
  line: "rgba(232, 232, 238, 0.18)",
  accent: "rgba(232, 232, 238, 0.85)",
} as const;
