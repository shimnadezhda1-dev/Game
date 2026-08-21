export interface StarReward {
  at: number;
  id: string;
  title: string;
  hint: string;
}

export const STAR_REWARDS: StarReward[] = [
  { at: 5, id: "gift", title: "Подарок", hint: "Маленький сюрприз" },
  { at: 10, id: "sticker", title: "Наклейка", hint: "Яркий стикер" },
  { at: 15, id: "medal", title: "Медаль", hint: "Медаль чемпиона" },
  { at: 20, id: "fox", title: "Новый танец", hint: "Лисёнок радуется по-новому" }
];

export function rewardsUnlockedByStars(stars: number): string[] {
  return STAR_REWARDS.filter((reward) => stars >= reward.at).map((reward) => reward.id);
}

export function rewardJustUnlocked(prevStars: number, nextStars: number): StarReward | null {
  return STAR_REWARDS.find((reward) => prevStars < reward.at && nextStars >= reward.at) ?? null;
}
