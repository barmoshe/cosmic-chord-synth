/* Preset storage — snapshot a full playable state (scale, theme, BPM,
   master EQ, reverb/delay wets) to localStorage and restore it later. */

import type { ThemeId } from "./constants";

export interface Preset {
  name: string;
  scale: string;
  theme: ThemeId;
  bpm: number;
  masterVolumeDb: number;
  reverbWet: number;
  delayWet: number;
  eq: { low: number; mid: number; high: number };
  savedAt: number;
}

const STORAGE_KEY = "biome-synth-presets";
const MAX_PRESETS = 12;

function loadAll(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is Preset => !!p && typeof p.name === "string");
  } catch {
    return [];
  }
}

function saveAll(presets: Preset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.slice(0, MAX_PRESETS)));
  } catch {
    /* storage full / unavailable */
  }
}

export function listPresets(): Preset[] {
  return loadAll();
}

export function savePreset(p: Preset): void {
  const all = loadAll().filter(e => e.name !== p.name);
  all.unshift({ ...p, savedAt: Date.now() });
  saveAll(all);
}

export function deletePreset(name: string): void {
  saveAll(loadAll().filter(p => p.name !== name));
}

export function findPreset(name: string): Preset | undefined {
  return loadAll().find(p => p.name === name);
}

/* URL-hash session sharing — encode a preset in base64 so a link
   can restore the full state cross-device. */

export function encodePresetToHash(p: Omit<Preset, "savedAt" | "name">): string {
  try {
    const json = JSON.stringify(p);
    return btoa(encodeURIComponent(json));
  } catch {
    return "";
  }
}

export function decodePresetFromHash(hash: string): Partial<Preset> | null {
  try {
    const clean = hash.replace(/^#/, "");
    if (!clean) return null;
    const json = decodeURIComponent(atob(clean));
    const parsed = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as Partial<Preset>;
  } catch {
    return null;
  }
}
