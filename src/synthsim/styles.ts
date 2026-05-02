export const SYNTHSIM_KEYFRAMES = `
@keyframes synthsim-draw-arc {
  from { stroke-dashoffset: var(--arc-length); }
  to { stroke-dashoffset: 0; }
}

@keyframes synthsim-draw-arc-reverse {
  from { stroke-dashoffset: calc(var(--arc-length) * -1); }
  to { stroke-dashoffset: 0; }
}

@keyframes synthsim-letter-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes synthsim-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes synthsim-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes synthsim-rise-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

export const SYNTHSIM_PALETTE = {
  bg: "#0a0a0f",
  fg: "#e8e8ee",
  muted: "rgba(232, 232, 238, 0.55)",
  line: "rgba(232, 232, 238, 0.18)",
  accent: "rgba(232, 232, 238, 0.85)",
} as const;
