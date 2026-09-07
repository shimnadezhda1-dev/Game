import {
  LetterCategory,
  LetterItem,
  PlayActivity,
  StudyOrder
} from "../types";
import { shuffle } from "./selectors";

export const VOWEL_LETTERS = new Set(["А", "Е", "Ё", "И", "О", "У", "Ы", "Э", "Ю", "Я"]);
export const SIGN_LETTERS = new Set(["Ъ", "Ь"]);

export function isVowelLetter(letter: Pick<LetterItem, "upper">): boolean {
  return VOWEL_LETTERS.has(letter.upper);
}

export function isConsonantLetter(letter: Pick<LetterItem, "upper">): boolean {
  return !isVowelLetter(letter) && !SIGN_LETTERS.has(letter.upper);
}

export function validPlayActivity(value: unknown): value is PlayActivity {
  return value === "learn" || value === "find" || value === "picture" || value === "listen";
}

export function validStudyOrder(value: unknown): value is StudyOrder {
  return value === "alpha" || value === "random" || value === "pick";
}

export function validLetterCategory(value: unknown): value is LetterCategory {
  return value === "all" || value === "vowels" || value === "consonants";
}

export function filterLettersByCategory(
  letters: readonly LetterItem[],
  category: LetterCategory
): LetterItem[] {
  if (category === "vowels") {
    return letters.filter(isVowelLetter);
  }
  if (category === "consonants") {
    return letters.filter(isConsonantLetter);
  }
  return [...letters];
}

export function playLetterPool(
  letters: readonly LetterItem[],
  category: LetterCategory
): LetterItem[] {
  const filtered = filterLettersByCategory(letters, category);
  return filtered.length ? filtered : [...letters];
}

export function letterAllowsActivity(
  letter: Pick<LetterItem, "eligibleActivities"> | undefined,
  activity: PlayActivity
): boolean {
  const eligible = letter?.eligibleActivities;
  if (!eligible || eligible.length === 0) {
    return true;
  }
  return eligible.includes(activity);
}

export function shuffleLetterDeck(
  pool: readonly LetterItem[],
  avoidId?: string
): LetterItem[] {
  const deck = shuffle([...pool]);
  if (avoidId && deck.length > 1 && deck[0]?.id === avoidId) {
    const swapAt = deck.findIndex((item, index) => index > 0 && item.id !== avoidId);
    if (swapAt > 0) {
      [deck[0], deck[swapAt]] = [deck[swapAt], deck[0]];
    }
  }
  return deck;
}

export function advanceLetterDeck(
  deck: readonly LetterItem[],
  index: number,
  pool: readonly LetterItem[]
): { deck: LetterItem[]; index: number } | null {
  if (index + 1 < deck.length) {
    return { deck: [...deck], index: index + 1 };
  }
  if (!pool.length) {
    return null;
  }
  const lastId = deck[index]?.id;
  return { deck: shuffleLetterDeck(pool, lastId), index: 0 };
}
