import { PlayerPreference } from "../types";
import {
  crossedStickerMilestone,
  RewardItem,
  stickerMilestonesForDisplay
} from "../data/rewardCatalog";
import { asRewardItem, pickNextRegularSticker } from "../data/stickerCatalog";

export interface StarReward {
  at: number;
  id: string;
  title: string;
  hint: string;
}

const LEGACY_STAR_REWARDS: StarReward[] = [
  { at: 5, id: "gift", title: "Подарок", hint: "Маленький сюрприз" },
  { at: 10, id: "sticker", title: "Наклейка", hint: "Яркий стикер" },
  { at: 15, id: "medal", title: "Медаль", hint: "Медаль чемпиона" },
  { at: 20, id: "fox", title: "Новый танец", hint: "Лисёнок радуется по-новому" }
];

function starRewardAt(at: number, index: number): StarReward {
  const legacy = LEGACY_STAR_REWARDS[index];
  if (legacy && legacy.at === at) {
    return legacy;
  }
  return {
    at,
    id: "sticker",
    title: "Наклейка",
    hint: `Награда за ${at} звёзд`
  };
}

export function starRewardsThrough(stars: number): StarReward[] {
  return stickerMilestonesForDisplay(stars).map((at, index) => starRewardAt(at, index));
}

/** Chips shown before the player passes 100 stars. Awards keep going after that. */
export const STAR_REWARDS: StarReward[] = starRewardsThrough(0);

export function rewardsUnlockedByStars(stars: number): string[] {
  return starRewardsThrough(stars)
    .filter((reward) => stars >= reward.at)
    .map((reward) => reward.id);
}

export function crossedRewardThreshold(prevStars: number, nextStars: number): number | null {
  return crossedStickerMilestone(prevStars, nextStars);
}

/** @deprecated Use crossedRewardThreshold + pickNextReward. Kept for existing call sites. */
export function rewardJustUnlocked(prevStars: number, nextStars: number): StarReward | null {
  const at = crossedStickerMilestone(prevStars, nextStars);
  if (at === null) {
    return null;
  }
  const index = at / 5 - 1;
  return starRewardAt(at, index);
}

export function unlockRewardAtThreshold(
  _preference: PlayerPreference | null,
  unlockedIds: readonly string[],
  rewardedThresholds: readonly number[],
  prevStars: number,
  nextStars: number
): { item: RewardItem; threshold: number } | null {
  const threshold = crossedRewardThreshold(prevStars, nextStars);
  if (!threshold || rewardedThresholds.includes(threshold)) {
    return null;
  }
  const item = pickNextRegularSticker(unlockedIds);
  if (!item) {
    return null;
  }
  return { item: asRewardItem(item), threshold };
}
