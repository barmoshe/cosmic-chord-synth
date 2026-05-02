export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;
export const R2D = 180 / Math.PI;

export interface Point {
  x: number;
  y: number;
}

export const polar = (cx: number, cy: number, r: number, deg: number): Point => {
  const a = (deg - 90) * D2R;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

export const arcPath = (
  cx: number,
  cy: number,
  r: number,
  fromDeg: number,
  toDeg: number,
): string => {
  const a = polar(cx, cy, r, fromDeg);
  const b = polar(cx, cy, r, toDeg);
  const sweep = toDeg >= fromDeg ? 1 : 0;
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return `M ${a.x.toFixed(3)} ${a.y.toFixed(3)} A ${r} ${r} 0 ${large} ${sweep} ${b.x.toFixed(3)} ${b.y.toFixed(3)}`;
};

export const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

export const pad3 = (n: number): string => {
  const r = Math.round(n) % 360;
  const v = r < 0 ? r + 360 : r;
  return v.toString().padStart(3, "0");
};
