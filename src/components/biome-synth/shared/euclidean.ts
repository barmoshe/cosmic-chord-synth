/* Björklund's Euclidean rhythm algorithm.
   Distributes `pulses` onsets as evenly as possible across `steps`
   positions. Produces canonical world-music rhythms (e.g. 3-in-8 =
   Cuban tresillo, 5-in-8 = Cuban cinquillo, 7-in-16 = Bossa nova).
   A rotation offset lets us phase-shift a row so hats sit on off-beats,
   claps on the back-beat, etc. */

export function bjorklund(pulses: number, steps: number): number[] {
  if (pulses <= 0 || steps <= 0) return new Array(Math.max(0, steps)).fill(0);
  if (pulses >= steps) return new Array(steps).fill(1);

  let groups: number[][] = [];
  for (let i = 0; i < pulses; i++) groups.push([1]);
  for (let i = 0; i < steps - pulses; i++) groups.push([0]);

  while (true) {
    const last = groups[groups.length - 1];
    let matches = 0;
    while (matches < groups.length - 1 && arraysEqual(groups[matches], last)) matches++;
    if (matches < 2) break;
    const toMerge = Math.min(matches, groups.length - matches);
    const newGroups: number[][] = [];
    for (let i = 0; i < toMerge; i++) {
      newGroups.push([...groups[i], ...groups[groups.length - toMerge + i]]);
    }
    for (let i = toMerge; i < groups.length - toMerge; i++) {
      newGroups.push(groups[i]);
    }
    groups = newGroups;
  }

  const flat: number[] = [];
  for (const g of groups) flat.push(...g);
  while (flat.length < steps) flat.push(0);
  return flat.slice(0, steps);
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function rotate<T>(arr: T[], n: number): T[] {
  const len = arr.length;
  if (len === 0) return arr;
  const r = ((n % len) + len) % len;
  return [...arr.slice(r), ...arr.slice(0, r)];
}

export interface EuclidSpec {
  hits: number;
  steps: number;
  rotation?: number;
  velocity?: number;
}

/* Build a velocity row from an Euclid spec. */
export function euclidRow(spec: EuclidSpec): number[] {
  const pattern = bjorklund(spec.hits, spec.steps);
  const rotated = rotate(pattern, spec.rotation || 0);
  const v = spec.velocity ?? 1;
  return rotated.map(x => x * v);
}

/* Merge Euclidean hits into an existing velocity row without
   clobbering stronger hand-authored values. Used as a "sprinkle"
   to liven up authored drum patterns with polyrhythmic ghost hits. */
export function mergeEuclidRow(base: number[], spec: EuclidSpec, ghost = 0.35): number[] {
  const row = euclidRow({ ...spec, velocity: 1 });
  const out = [...base];
  for (let i = 0; i < Math.min(out.length, row.length); i++) {
    if (row[i] > 0 && out[i] === 0) out[i] = ghost * (0.8 + Math.random() * 0.4);
  }
  return out;
}
