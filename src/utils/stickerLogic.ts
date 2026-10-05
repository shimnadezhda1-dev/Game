import { ProgressState } from "../types";
import { PLAY_ACTIVITIES } from "./playSettings";
import { withActivityLetter } from "./activityProgress";
import { crossedStickerMilestone } from "../data/rewardCatalog";
import { ALPHABET_ACHIEVEMENT_ID, pickNextRegularSticker } from "../data/stickerCatalog";

export const ALPHABET_CYCLE_LETTER_IDS = [
  "A",
  "B",
  "V",
  "G",
  "D",
  "E",
  "Yo",
  "Zh",
  "Z",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "R",
  "S",
  "T",
  "U",
  "F",
  "Kh",
  "Ts",
  "Ch",
  "Sh",
  "Shch",
  "Hard",
  "Yery",
  "Soft",
  "Eh",
  "Yu",
  "Ya"
] as const;

const ALPHABET_SET = new Set<string>(ALPHABET_CYCLE_LETTER_IDS);

export function uniqueNumbers(values: readonly unknown[]): number[] {
  const seen = new Set<number>();
  const next: number[] = [];
  for (const value of values) {
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numeric) || seen.has(numeric)) {
      continue;
    }
    seen.add(numeric);
    next.push(numeric);
  }
  return next;
}

export function uniqueIds(ids: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const value of ids) {
    if (typeof value !== "string" || !value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    next.push(value);
  }
  return next;
}

export function isAlphabetCycleComplete(letterIds: readonly string[]): boolean {
  const unique = uniqueIds(letterIds).filter((id) => ALPHABET_SET.has(id));
  if (unique.length !== ALPHABET_CYCLE_LETTER_IDS.length) {
    return false;
  }
  return ALPHABET_CYCLE_LETTER_IDS.every((id) => unique.includes(id));
}

export function shouldCountAlphabetLetter(args: {
  studyOrder: ProgressState["studyOrder"] | undefined;
  step: string;
}): boolean {
  return args.studyOrder === "alpha" && args.step === "learn";
}

export function addCompletedCycleLetter(
  current: readonly string[],
  letterId: string
): string[] {
  if (!ALPHABET_SET.has(letterId)) {
    return uniqueIds(current);
  }
  return uniqueIds([...current, letterId]);
}

export function startNewAlphabetAdventure(progress: ProgressState): ProgressState {
  let next: ProgressState = {
    ...progress,
    stars: 0,
    completedLettersThisCycle: [],
    claimedMilestonesThisCycle: [],
    rewardedThresholds: [],
    alphabetCycleCompleted: false
  };
  for (const activity of PLAY_ACTIVITIES) {
    next = withActivityLetter(next, activity, "A");
  }
  return next;
}

export function unlockStarSticker(args: {
  unlockedStickerIds: readonly string[];
  claimedMilestonesThisCycle: readonly number[];
  prevStars: number;
  nextStars: number;
}): { stickerId: string; threshold: number } | null {
  const threshold = crossedStickerMilestone(args.prevStars, args.nextStars);
  if (!threshold || args.claimedMilestonesThisCycle.includes(threshold)) {
    return null;
  }
  const next = pickNextRegularSticker(args.unlockedStickerIds);
  if (!next) {
    return null;
  }
  return { stickerId: next.id, threshold };
}

export function applyAlphabetAchievement(progress: ProgressState): ProgressState {
  const unlockedStickerIds = uniqueIds([...progress.unlockedStickerIds, ALPHABET_ACHIEVEMENT_ID]);
  const unlockedAchievements = uniqueIds([
    ...(progress.unlockedAchievements ?? []),
    ALPHABET_ACHIEVEMENT_ID
  ]);
  return {
    ...progress,
    unlockedStickerIds,
    unlockedRewards: unlockedStickerIds,
    unlockedAchievements
  };
}
