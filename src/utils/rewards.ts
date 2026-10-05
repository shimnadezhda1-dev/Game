import { PlayerPreference } from "../types";
import {
  REWARD_THRESHOLDS,
  RewardItem,
  RewardThreshold
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

/** Reward milestones run every five stars through 100. */
export const STAR_REWARDS: StarReward[] = REWARD_THRESHOLDS.map((at, index) => {
  const legacy = LEGACY_STAR_REWARDS[index];
  return legacy ?? {
    at,
    id: "sticker",
    title: "Наклейка",
    hint: `Награда за ${at} звёзд`
  };
});

export function rewardsUnlockedByStars(stars: number): string[] {
  return STAR_REWARDS.filter((reward) => stars >= reward.at).map((reward) => reward.id);
}

export function crossedRewardThreshold(
  prevStars: number,
  nextStars: number
): RewardThreshold | null {
  return REWARD_THRESHOLDS.find((at) => prevStars < at && nextStars >= at) ?? null;
}

/** @deprecated Use crossedRewardThreshold + pickNextReward. Kept for existing call sites. */
export function rewardJustUnlocked(prevStars: number, nextStars: number): StarReward | null {
  return STAR_REWARDS.find((reward) => prevStars < reward.at && nextStars >= reward.at) ?? null;
}

export function unlockRewardAtThreshold(
  _preference: PlayerPreference | null,
  unlockedIds: readonly string[],
  rewardedThresholds: readonly number[],
  prevStars: number,
  nextStars: number
): { item: RewardItem; threshold: RewardThreshold } | null {
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
