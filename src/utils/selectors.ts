import { LetterItem } from "../types";

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function weightedLetterPick(
  letters: LetterItem[],
  mistakeCounts: Record<string, number>,
  excludeId?: string
): LetterItem {
  const pool =
    letters.length > 1 && excludeId ? letters.filter((letter) => letter.id !== excludeId) : letters;

  const weighted = pool.map((letter) => {
    const mistakes = Math.min(mistakeCounts[letter.id] ?? 0, 2);
    return { letter, weight: 1 + mistakes };
  });

  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;

  for (const item of weighted) {
    random -= item.weight;
    if (random <= 0) {
      return item.letter;
    }
  }
  return pool[0];
}

export function randomOptions(targetId: string, ids: string[], count: number): string[] {
  const pool = ids.filter((id) => id !== targetId);
  const picked = shuffle(pool).slice(0, Math.max(0, count - 1));
  return shuffle([targetId, ...picked]);
}
