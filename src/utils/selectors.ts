import {
  LetterItem,
  LetterStats,
  OptionCount,
  PictureExampleEntry,
  ProgressState
} from "../types";
import { PICTURE_SKIP_LETTER_IDS } from "../audio/letterFolders";
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

export function unlockedLetters(_progress: ProgressState, letters: LetterItem[] = LETTERS): LetterItem[] {
  const pool = letters.filter((letter) => letter.contentReady);
  if (pool.length) {
    return pool;
  }
  return letters.slice(0, 3);
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

function specialExamplesAsPictureEntries(
  letter: Pick<LetterItem, "id" | "upper" | "specialExamples" | "contentReady">
): PictureExampleEntry[] {
  return (letter.specialExamples ?? [])
    .filter((example) => Boolean(example.word.trim()) && Boolean(example.image.trim()))
    .map((example) => ({
      id: example.id,
      word: example.word,
      image: example.image,
      pictureEligible: true,
      allowedAsTarget: true,
      allowedAsDistractor: false,
      letterId: letter.id,
      letterUpper: letter.upper,
      letterContentReady: letter.contentReady
    }));
}

function normalizeRuWord(word: string): string {
  return word.trim().toLocaleLowerCase("ru-RU");
}

export function wordContainsHardSign(word: string): boolean {
  return normalizeRuWord(word).includes("ъ");
}

export function wordContainsYery(word: string): boolean {
  return normalizeRuWord(word).includes("ы");
}

export function wordContainsSoftSign(word: string): boolean {
  return normalizeRuWord(word).includes("ь");
}

export function wordContainsListenSpecialMark(word: string, letterId: string): boolean {
  if (letterId === "Hard") {
    return wordContainsHardSign(word);
  }
  if (letterId === "Yery") {
    return wordContainsYery(word);
  }
  if (letterId === "Soft") {
    return wordContainsSoftSign(word);
  }
  return false;
}

function warnListenSpecial(message: string, extra?: unknown): void {
  if (import.meta.env.DEV) {
    console.warn(`[listen-special] ${message}`, extra ?? "");
  }
}

function buildSpecialListenRoundOptions(
  targetId: string,
  bank: PictureExampleEntry[],
  count: OptionCount,
  previousTargetExampleId?: string
): PictureRoundOptionsResult {
  const matches = (word: string) => wordContainsListenSpecialMark(word, targetId);
  const targetCandidates = bank.filter(
    (example) => example.letterId === targetId && example.pictureEligible && matches(example.word)
  );
  const preferredTargets =
    targetCandidates.length > 1 && previousTargetExampleId
      ? targetCandidates.filter((example) => example.id !== previousTargetExampleId)
      : targetCandidates;
  const targetExample = shuffle(preferredTargets.length ? preferredTargets : targetCandidates)[0];

  if (!targetExample || !matches(targetExample.word)) {
    warnListenSpecial(`${targetId}: no correct target word containing the special mark`);
    return { ok: false, requested: count, available: 0 };
  }

  const distractors = bank.filter(
    (example) =>
      example.id !== targetExample.id &&
      example.image !== targetExample.image &&
      example.pictureEligible &&
      !matches(example.word)
  );
  if (distractors.length < count - 1) {
    warnListenSpecial(`${targetId}: not enough safe distractors`, {
      needed: count - 1,
      available: distractors.length
    });
    return { ok: false, requested: count, available: distractors.length + 1 };
  }

  const picked = shuffle(distractors).slice(0, count - 1);
  const chosen = [targetExample, ...picked];
  const matchingOptionCount = chosen.filter((example) => matches(example.word)).length;
  if (matchingOptionCount !== 1) {
    warnListenSpecial(`${targetId}: ambiguous option set`, {
      matchingOptionCount,
      words: chosen.map((example) => example.word)
    });
    return { ok: false, requested: count, available: matchingOptionCount };
  }

  return {
    ok: true,
    options: shuffle(chosen.map((example) => example.id)),
    correctOptionId: targetExample.id,
    targetExample
  };
}

/** Listen-and-choose-picture: ordinary letters by initial; Ъ/Ы/Ь by mark-in-word. */
export function buildListenRoundOptions(
  target: Pick<LetterItem, "id" | "upper" | "specialExamples" | "contentReady">,
  examples: readonly PictureExampleEntry[],
  letters: readonly Pick<LetterItem, "id" | "upper" | "specialExamples" | "contentReady">[],
  count: OptionCount,
  previousTargetExampleId?: string
): PictureRoundOptionsResult {
  const bank = uniquePictureExamples([
    ...examples,
    ...letters.flatMap(specialExamplesAsPictureEntries)
  ]);

  if (PICTURE_SKIP_LETTER_IDS.has(target.id)) {
    return buildSpecialListenRoundOptions(target.id, bank, count, previousTargetExampleId);
  }

  const byLetter = bank.filter(
    (example) => example.letterId === target.id && example.allowedAsTarget && example.pictureEligible
  );
  const matchingInitial = byLetter.filter(
    (example) => normalizedInitial(example.word) === target.upper
  );
  const targetExamples = matchingInitial.length > 0 ? matchingInitial : byLetter;
  const preferredTargets =
    targetExamples.length > 1 && previousTargetExampleId
      ? targetExamples.filter((example) => example.id !== previousTargetExampleId)
      : targetExamples;
  const targetExample = shuffle(preferredTargets)[0];

  if (!targetExample) {
    return { ok: false, requested: count, available: 0 };
  }

  const distractors = bank.filter(
    (example) =>
      example.id !== targetExample.id &&
      example.image !== targetExample.image &&
      example.pictureEligible &&
      example.allowedAsDistractor &&
      example.letterId !== target.id
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
