import { PAL } from "./constants";

export const m2f = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function quantize(midi: number, scaleNotes: number[]) {
  const oct = Math.floor(midi / 12);
  const pc = ((midi % 12) + 12) % 12;
  let best = scaleNotes[0], bestDist = 99;
  for (const s of scaleNotes) {
    const d = Math.min(Math.abs(pc - s), 12 - Math.abs(pc - s));
    if (d < bestDist) { bestDist = d; best = s; }
  }
  return oct * 12 + best;
}

export function noteColor(midi: number): [number, number, number] {
  const t = ((midi % 12) / 12) * PAL.length;
  const i = Math.floor(t) % PAL.length;
  const j = (i + 1) % PAL.length;
  const f = t - Math.floor(t);
  return [
    PAL[i][0] + (PAL[j][0] - PAL[i][0]) * f,
    PAL[i][1] + (PAL[j][1] - PAL[i][1]) * f,
    PAL[i][2] + (PAL[j][2] - PAL[i][2]) * f,
  ];
}

export function noteHex(midi: number) {
  const c = noteColor(midi);
  return "#" + c.map(v => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
}

export function haptic(ms: number | number[]) {
  try { navigator.vibrate?.(Array.isArray(ms) ? ms : [ms]); } catch {}
}

// Motif engine
export function genMotif(scaleNotes: number[], len = 4) {
  const m: number[] = [];
  let d = Math.floor(Math.random() * scaleNotes.length);
  m.push(d);
  for (let i = 1; i < len; i++) {
    d = clamp(d + (Math.random() < 0.7 ? (Math.random() < 0.5 ? 1 : -1) : (Math.random() < 0.5 ? 2 : -2)), 0, scaleNotes.length - 1);
    m.push(d);
  }
  return m;
}

export function devMotif(m: number[], tech: string, n: number): number[] {
  switch (tech) {
    case "transpose": { const s = pick([1, 2, -1, -2]); return m.map(d => clamp(d + s, 0, n - 1)); }
    case "invert": { const a = m[0]; return m.map(d => clamp(a - (d - a), 0, n - 1)); }
    case "retrograde": return [...m].reverse();
    case "fragment": return m.slice(0, Math.ceil(m.length / 2));
    case "ornament": {
      const r: number[] = [];
      m.forEach((d, i) => { r.push(d); if (i < m.length - 1 && Math.random() < 0.4) r.push(clamp(Math.round((d + m[i + 1]) / 2), 0, n - 1)); });
      return r;
    }
    case "sequence": { const s = pick([2, 3, -2]); return m.map(d => clamp(d + s, 0, n - 1)); }
    default: return m;
  }
}

export function buildMatrix(scaleNotes: number[]) {
  const n = scaleNotes.length;
  const m: Record<number, Record<number, number>> = {};
  for (let i = 0; i < n; i++) {
    const w: Record<number, number> = {};
    for (let j = 0; j < n; j++) {
      const iv = Math.abs(i - j);
      w[j] = iv === 0 ? 0.05 : iv === 1 ? 4 : iv === 2 ? 2.2 : iv === 3 ? 1 : 0.35;
    }
    if (i === n - 1) w[0] = 6;
    if (i === n - 2) { w[n - 1] = 3.5; w[0] = 2.5; }
    m[i] = w;
  }
  return m;
}

export function wPick(w: Record<number, number>) {
  const e = Object.entries(w);
  const tot = e.reduce((s, [, v]) => s + (v as number), 0);
  let r = Math.random() * tot;
  for (const [k, v] of e) { r -= v as number; if (r <= 0) return parseInt(k); }
  return parseInt(e[0][0]);
}

export function getArpNote(ch: number[], step: number, mode: string) {
  const n = ch.length;
  if (!n) return 0;
  switch (mode) {
    case "up": return ch[step % n];
    case "down": return ch[(n - 1) - (step % n)];
    case "updown": { const c = n * 2 - 2 || 1; const p = step % c; return p < n ? ch[p] : ch[c - p]; }
    case "skip": return ch[(step * 2) % n];
    default: return ch[Math.floor(Math.random() * n)];
  }
}
