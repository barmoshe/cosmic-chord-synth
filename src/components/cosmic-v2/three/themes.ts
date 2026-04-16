import type { ThemeId } from "@/stores/v2Stores";

export interface ThemeDef {
  id: ThemeId;
  background: [number, number, number];
  starTint: [number, number, number];
  fog: number;
  bloomStrength: number;
  label: string;
}

export const THEMES: Record<ThemeId, ThemeDef> = {
  aurora: {
    id: "aurora",
    background: [0.04, 0.07, 0.14],
    starTint: [0.85, 0.95, 1.0],
    fog: 0.0008,
    bloomStrength: 0.7,
    label: "Aurora",
  },
  ember: {
    id: "ember",
    background: [0.1, 0.04, 0.04],
    starTint: [1.0, 0.86, 0.7],
    fog: 0.001,
    bloomStrength: 0.8,
    label: "Ember",
  },
  void: {
    id: "void",
    background: [0.02, 0.02, 0.05],
    starTint: [0.75, 0.75, 0.9],
    fog: 0.0005,
    bloomStrength: 0.3,
    label: "Void",
  },
  tidal: {
    id: "tidal",
    background: [0.02, 0.08, 0.14],
    starTint: [0.6, 0.85, 1.0],
    fog: 0.0012,
    bloomStrength: 0.6,
    label: "Tidal",
  },
};
