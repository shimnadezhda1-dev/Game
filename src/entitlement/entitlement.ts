import type { LetterCategory, LetterItem, OptionCount, PlayActivity, StudyOrder } from "../types";
import { PLAY_ACTIVITIES } from "../utils/playSettings";

export type Entitlement = "trial" | "full";

/** The only place that decides which letters belong to the trial. */
export const TRIAL_LETTERS = ["А", "Б", "В", "Г", "Д"] as const;

const TRIAL_LETTER_SET = new Set<string>(TRIAL_LETTERS);

export type LetterRef = Pick<LetterItem, "upper">;

export function isEntitlement(value: unknown): value is Entitlement {
  return value === "trial" || value === "full";
}

export function isTrialLetter(letter: LetterRef): boolean {
  return TRIAL_LETTER_SET.has(letter.upper);
}

export function canAccessLetterFor(entitlement: Entitlement, letter: LetterRef): boolean {
  return entitlement === "full" || isTrialLetter(letter);
}

export function allowedLettersFor<T extends LetterRef>(
  letters: readonly T[],
  entitlement: Entitlement
): T[] {
  return entitlement === "full" ? [...letters] : letters.filter(isTrialLetter);
}

/** Trial walks the activities in menu order; the last one ends the trial. */
export function nextTrialActivity(activity: PlayActivity): PlayActivity | null {
  const index = PLAY_ACTIVITIES.indexOf(activity);
  return index >= 0 && index < PLAY_ACTIVITIES.length - 1 ? PLAY_ACTIVITIES[index + 1] : null;
}

export const TRIAL_OPTION_COUNTS: readonly OptionCount[] = [3, 5];
export const TRIAL_STUDY_ORDERS: readonly StudyOrder[] = ["alpha", "pick"];
export const TRIAL_LETTER_CATEGORIES: readonly LetterCategory[] = ["all"];

export const LOCKED_FEATURE_MESSAGES = {
  hardLevel: "Сложный уровень откроется в полной версии",
  randomOrder: "Случайный порядок откроется в полной версии",
  letterCategory: "Гласные и согласные откроются в полной версии"
} as const;

export function canUseOptionCount(entitlement: Entitlement, count: OptionCount): boolean {
  return entitlement === "full" || TRIAL_OPTION_COUNTS.includes(count);
}

export function canUseStudyOrder(entitlement: Entitlement, order: StudyOrder): boolean {
  return entitlement === "full" || TRIAL_STUDY_ORDERS.includes(order);
}

export function canUseLetterCategory(entitlement: Entitlement, category: LetterCategory): boolean {
  return entitlement === "full" || TRIAL_LETTER_CATEGORIES.includes(category);
}

export interface PlaySettingsSnapshot {
  optionCount: OptionCount;
  studyOrder: StudyOrder;
  letterCategory: LetterCategory;
}

/**
 * Settings the game actually runs with. Saved progress is never rewritten, so
 * a purchase brings back whatever the player had chosen before.
 */
export function effectivePlaySettings(
  entitlement: Entitlement,
  saved: PlaySettingsSnapshot
): PlaySettingsSnapshot {
  if (entitlement === "full") {
    return {
      optionCount: saved.optionCount,
      studyOrder: saved.studyOrder,
      letterCategory: saved.letterCategory
    };
  }
  return {
    optionCount: canUseOptionCount(entitlement, saved.optionCount)
      ? saved.optionCount
      : TRIAL_OPTION_COUNTS[TRIAL_OPTION_COUNTS.length - 1],
    studyOrder: canUseStudyOrder(entitlement, saved.studyOrder) ? saved.studyOrder : "alpha",
    letterCategory: canUseLetterCategory(entitlement, saved.letterCategory)
      ? saved.letterCategory
      : "all"
  };
}
