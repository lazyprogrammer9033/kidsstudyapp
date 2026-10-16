export type Stars = 1 | 2 | 3;

/** Finishing always earns at least one star; accuracy on the first try earns more. */
export function starsFor(firstTryCorrect: number, total: number): Stars {
  if (total <= 0) return 1;
  const ratio = firstTryCorrect / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

/** Fisher–Yates shuffle that returns a new array. `random` is injectable for tests. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Answers typed by kids: ignore case, surrounding spaces, repeated spaces and a trailing period. */
export function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\.$/, '');
}
