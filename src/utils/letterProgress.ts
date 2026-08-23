import { LetterItem, ProgressState } from "../types";

/** Full Russian alphabet order (33 letters, including Ё). */
export const ALPHABET_ORDER = [
  "А",
  "Б",
  "В",
  "Г",
  "Д",
  "Е",
  "Ё",
  "Ж",
  "З",
  "И",
  "Й",
  "К",
  "Л",
  "М",
  "Н",
  "О",
  "П",
  "Р",
  "С",
  "Т",
  "У",
  "Ф",
  "Х",
  "Ц",
  "Ч",
  "Ш",
  "Щ",
  "Ъ",
  "Ы",
  "Ь",
  "Э",
  "Ю",
  "Я"
] as const;

export const FIRST_LETTER_INDEX = 0;

/**
 * PLAY always starts at А (index 0).
 * Saved mastered letters / contentReady must not jump to Д.
 */
export function startPlayLetterIndex(_progress?: ProgressState): number {
  return FIRST_LETTER_INDEX;
}

export function clampLetterIndex(index: number, alphabetLength: number): number {
  if (!Number.isFinite(index) || alphabetLength <= 0) {
    return FIRST_LETTER_INDEX;
  }
  return Math.max(FIRST_LETTER_INDEX, Math.min(Math.floor(index), alphabetLength - 1));
}

/** After finishing a letter: next index, or null at the end of the alphabet. */
export function nextLetterIndex(currentIndex: number, alphabetLength: number): number | null {
  const next = currentIndex + 1;
  if (next < 0 || next >= alphabetLength) {
    return null;
  }
  return next;
}

export function letterByIndex(letters: LetterItem[], index: number): LetterItem {
  return letters[clampLetterIndex(index, letters.length)] ?? letters[FIRST_LETTER_INDEX];
}

export function alphabetMatchesOrder(letters: Pick<LetterItem, "upper">[]): boolean {
  if (letters.length !== ALPHABET_ORDER.length) {
    return false;
  }
  return letters.every((letter, index) => letter.upper === ALPHABET_ORDER[index]);
}

/** Distractors may use asset-ready letters; the current letter is always included. */
export function optionPoolIds(currentId: string, assetReadyIds: string[]): string[] {
  if (assetReadyIds.includes(currentId)) {
    return assetReadyIds;
  }
  return [currentId, ...assetReadyIds];
}
