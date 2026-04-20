/* Voice-leading helpers.
   Given a previous chord voicing and a new root set of chord tones,
   pick the inversion/octave-offset that minimises total MIDI motion
   from the previous voicing. Makes pad transitions sound composed
   (inner voices move by tone/semitone) instead of jumping by fifths. */

export function invertChord(chord: number[], inversion: number, octaveBase: number): number[] {
  const inv = ((inversion % chord.length) + chord.length) % chord.length;
  const rotated = [...chord.slice(inv), ...chord.slice(0, inv).map(n => n + 12)];
  return rotated.map(n => octaveBase + n);
}

function voicingDistance(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const n = Math.min(a.length, b.length);
  let total = 0;
  for (let i = 0; i < n; i++) total += Math.abs(a[i] - b[i]);
  return total;
}

/* Pick the inversion + octave within ±1 that minimises distance to `prev`.
   If `prev` is empty, returns root-position in `octaveBase`. */
export function nextVoicing(prev: number[], chord: number[], octaveBase: number): number[] {
  if (prev.length === 0) return invertChord(chord, 0, octaveBase);
  let best = invertChord(chord, 0, octaveBase);
  let bestDist = voicingDistance(prev, best);
  const octOffsets = [-12, 0, 12];
  for (let inv = 0; inv < chord.length; inv++) {
    for (const off of octOffsets) {
      const cand = invertChord(chord, inv, octaveBase + off);
      const d = voicingDistance(prev, cand);
      if (d < bestDist) { bestDist = d; best = cand; }
    }
  }
  return best;
}
