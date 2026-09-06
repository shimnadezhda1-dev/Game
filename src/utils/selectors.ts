import {
  LetterItem,
  LetterStats,
  OptionCount,
  PictureExampleEntry,
  ProgressState
} from "../types";
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
  const pool = letters.filter((letter) => letter.contentReady && letter.group <= maxGroup);
  if (pool.length) {
    return pool;
  }
  return letters.filter((letter) => letter.contentReady).slice(0, 3);
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
  const result = buildRoundOptions(targetId, ids, count);
  if (!result.ok) {
    throw new Error(
      `Not enough unique options: requested ${result.requested}, available ${result.available}`
    );
  }
  return result.options;
}

export type RoundOptionsResult =
  | { ok: true; options: string[] }
  | { ok: false; requested: number; available: number };

export function buildRoundOptions(
  targetId: string,
  candidateIds: readonly string[],
  count: number
): RoundOptionsResult {
  const uniqueIds = Array.from(new Set(candidateIds));
  const distractors = uniqueIds.filter((id) => id !== targetId);
  const available = distractors.length + 1;

  if (available < count) {
    return { ok: false, requested: count, available };
  }

  const picked = shuffle(distractors).slice(0, Math.max(0, count - 1));
  return { ok: true, options: shuffle([targetId, ...picked]) };
}

export function glyphOptionPool(
  letters: readonly LetterItem[],
  optionCount: OptionCount
): LetterItem[] {
  return optionCount === 7
    ? [...letters]
    : letters.filter((letter) => letter.contentReady);
}

export function pictureContentBank(letters: readonly LetterItem[]): PictureExampleEntry[] {
  return letters.flatMap((letter) =>
    (letter.pictureExamples ?? [])
      .filter(
        (example) =>
          example.pictureEligible &&
          Boolean(example.word.trim()) &&
          Boolean(example.image.trim()) &&
          (example.allowedAsTarget || example.allowedAsDistractor)
      )
      .map((example) => ({
        ...example,
        letterId: letter.id,
        letterUpper: letter.upper,
        letterContentReady: letter.contentReady
      }))
  );
}

function normalizedInitial(word: string): string {
  return [...word.trim().toLocaleUpperCase("ru-RU")][0] ?? "";
}

function uniquePictureExamples(
  examples: readonly PictureExampleEntry[]
): PictureExampleEntry[] {
  const ids = new Set<string>();
  const images = new Set<string>();
  return examples.filter((example) => {
    if (ids.has(example.id) || images.has(example.image)) {
      return false;
    }
    ids.add(example.id);
    images.add(example.image);
    return true;
  });
}

export type PictureRoundOptionsResult =
  | {
      ok: true;
      options: string[];
      correctOptionId: string;
      targetExample: PictureExampleEntry;
    }
  | { ok: false; requested: number; available: number };

export function buildPictureRoundOptions(
  targetLetterId: string,
  targetUpper: string,
  examples: readonly PictureExampleEntry[],
  count: OptionCount,
  previousTargetExampleId?: string
): PictureRoundOptionsResult {
  const validExamples = uniquePictureExamples(examples);
  const targetExamples = validExamples.filter(
    (example) =>
      example.letterId === targetLetterId &&
      example.pictureEligible &&
      example.allowedAsTarget &&
      normalizedInitial(example.word) === targetUpper
  );
  const preferredTargets =
    targetExamples.length > 1 && previousTargetExampleId
      ? targetExamples.filter((example) => example.id !== previousTargetExampleId)
      : targetExamples;
  const targetExample = shuffle(preferredTargets)[0];

  if (!targetExample) {
    return { ok: false, requested: count, available: 0 };
  }

  const distractors = validExamples.filter(
    (example) =>
      example.id !== targetExample.id &&
      example.image !== targetExample.image &&
      example.pictureEligible &&
      example.allowedAsDistractor &&
      normalizedInitial(example.word) !== targetUpper
  );
  const available = distractors.length + 1;
  if (available < count) {
    return { ok: false, requested: count, available };
  }

  const picked = shuffle(distractors).slice(0, count - 1);
  return {
    ok: true,
    options: shuffle([targetExample.id, ...picked.map((example) => example.id)]),
    correctOptionId: targetExample.id,
    targetExample
  };
}

export function pictureOptionCountAvailable(
  letters: readonly LetterItem[],
  count: OptionCount
): boolean {
  const bank = pictureContentBank(letters);
  const targetLetters = letters.filter(
    (letter) =>
      letter.contentReady &&
      letter.eligibleActivities?.includes("picture") &&
      bank.some(
        (example) =>
          example.letterId === letter.id &&
          example.allowedAsTarget &&
          normalizedInitial(example.word) === letter.upper
      )
  );
  return (
    targetLetters.length > 0 &&
    targetLetters.every(
      (letter) =>
        buildPictureRoundOptions(letter.id, letter.upper, bank, count).ok
    )
  );
}

export function availableOptionCounts(letters: readonly LetterItem[]): OptionCount[] {
  return ([3, 5, 7] as const).filter((count) =>
    pictureOptionCountAvailable(letters, count)
  );
}
