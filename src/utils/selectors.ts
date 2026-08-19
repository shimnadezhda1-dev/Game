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
  mistakeCounts: Record<string, number>
): LetterItem {
  const weighted = letters.map((letter) => {
    const mistakes = mistakeCounts[letter.id] ?? 0;
    const baseDifficulty = Math.max(1, letter.difficulty);
    return { letter, weight: baseDifficulty + mistakes * 3 };
  });

  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;

  for (const item of weighted) {
    random -= item.weight;
    if (random <= 0) {
      return item.letter;
    }
  }
  return letters[0];
}

export function randomOptions(targetId: string, ids: string[], count: number): string[] {
  const pool = ids.filter((id) => id !== targetId);
  const picked = shuffle(pool).slice(0, Math.max(0, count - 1));
  return shuffle([targetId, ...picked]);
}
