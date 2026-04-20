/* Markov-chain melody generator.
   Builds a second-order transition table seeded from an interval prior
   (`buildMatrix`) plus any observed note history. Falls back to the
   prior when a (prev2, prev1) pair has no training data yet.

   Key advantage over pure random-walk + `wPick`: the chain remembers
   the *direction* of movement — after two ascending steps it becomes
   more likely to continue ascending or resolve, giving melodies a
   recognisable "shape" without deep-learning overhead. */

export type BigramKey = string;
export interface MarkovTable {
  size: number;
  firstOrder: Record<number, Record<number, number>>;
  secondOrder: Record<BigramKey, Record<number, number>>;
}

const key = (a: number, b: number): BigramKey => `${a}|${b}`;

export function createMarkovTable(size: number, prior: Record<number, Record<number, number>>): MarkovTable {
  const firstOrder: Record<number, Record<number, number>> = {};
  for (let i = 0; i < size; i++) {
    firstOrder[i] = { ...prior[i] };
  }
  return { size, firstOrder, secondOrder: {} };
}

export function observe(table: MarkovTable, prev2: number, prev1: number, next: number, weight = 1): void {
  const k = key(prev2, prev1);
  const row = table.secondOrder[k] || (table.secondOrder[k] = {});
  row[next] = (row[next] || 0) + weight;
}

export function trainOnSequence(table: MarkovTable, seq: number[], weight = 1): void {
  for (let i = 2; i < seq.length; i++) {
    observe(table, seq[i - 2], seq[i - 1], seq[i], weight);
  }
}

function sampleRow(row: Record<number, number>): number {
  const entries = Object.entries(row);
  if (entries.length === 0) return -1;
  let total = 0;
  for (const [, v] of entries) total += v;
  if (total <= 0) return -1;
  let r = Math.random() * total;
  for (const [k, v] of entries) {
    r -= v;
    if (r <= 0) return Number(k);
  }
  return Number(entries[0][0]);
}

/* Sample the next degree given prev2 → prev1. Prefers 2nd-order row;
   falls back to 1st-order interval prior when uninformed. */
export function step(table: MarkovTable, prev2: number, prev1: number): number {
  const second = table.secondOrder[key(prev2, prev1)];
  if (second) {
    const pick = sampleRow(second);
    if (pick >= 0) return pick;
  }
  const first = table.firstOrder[prev1];
  if (first) {
    const pick = sampleRow(first);
    if (pick >= 0) return pick;
  }
  return Math.min(table.size - 1, Math.max(0, prev1 + (Math.random() < 0.5 ? 1 : -1)));
}

/* Generate a phrase of `len` notes with a starting bigram. */
export function generatePhrase(table: MarkovTable, seed: number[], len: number): number[] {
  if (seed.length < 2) seed = [0, 1];
  const out = [seed[seed.length - 2], seed[seed.length - 1]];
  for (let i = 0; i < len; i++) {
    const next = step(table, out[out.length - 2], out[out.length - 1]);
    out.push(next);
  }
  return out.slice(2);
}
