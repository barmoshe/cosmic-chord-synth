export const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function rgba(col: number[], a: number) {
  return `rgba(${Math.floor(col[0] * 255)},${Math.floor(col[1] * 255)},${Math.floor(col[2] * 255)},${a})`;
}
