import { LetterItem, LetterStats, ProgressState } from "../types";
import { LETTER_GROUPS, LETTERS } from "../data/letters";

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function emptyStats(): LetterStats {
  return { correctCount: 0, wrongCount: 0, lastPracticed: 0 };
}

export function getLetterStats(
  stats: Record<string, LetterStats>,
  letterId: string
): LetterStats {
  return stats[letterId] ?? emptyStats();
}

export function unlockedLetters(progress: ProgressState, letters: LetterItem[] = LETTERS): LetterItem[] {
  const maxGroup = Math.max(0, progress.unlockedGroupIndex);
  const pool = letters.filter((letter) => letter.group <= maxGroup);
  return pool.length ? pool : letters.slice(0, 3);
}

export function isLetterMastered(progress: ProgressState, letterId: string): boolean {
  if (progress.learnedLetterIds.includes(letterId)) {
    return true;
  }
  return getLetterStats(progress.letterStats, letterId).correctCount >= 3;
}

export function masteredCount(progress: ProgressState, letters: LetterItem[] = LETTERS): number {
  return letters.filter((letter) => isLetterMastered(progress, letter.id)).length;
}

export function maybeUnlockNextGroup(progress: ProgressState): number {
  const currentGroup = LETTER_GROUPS[progress.unlockedGroupIndex] ?? [];
  if (!currentGroup.length) {
    return progress.unlockedGroupIndex;
  }
  const allMastered = currentGroup.every((id) => isLetterMastered(progress, id));
  if (!allMastered) {
    return progress.unlockedGroupIndex;
  }
  const next = progress.unlockedGroupIndex + 1;
  return next < LETTER_GROUPS.length ? next : progress.unlockedGroupIndex;
}

export function weightedLetterPick(
  letters: LetterItem[],
  stats: Record<string, LetterStats>,
  excludeId?: string
): LetterItem {
  const pool =
    letters.length > 1 && excludeId ? letters.filter((letter) => letter.id !== excludeId) : letters;
  const now = Date.now();

  const weighted = pool.map((letter) => {
    const item = getLetterStats(stats, letter.id);
    const recencyBoost = item.lastPracticed && now - item.lastPracticed > 60_000 ? 0.4 : 0;
    const weakBoost = item.correctCount === 0 ? 1.2 : Math.max(0, 2 - item.correctCount) * 0.35;
    const weight = 1 + item.wrongCount * 1.8 + weakBoost + recencyBoost;
    return { letter, weight };
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
