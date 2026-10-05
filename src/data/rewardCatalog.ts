import { PlayerPreference } from "../types";

export type RewardAudience = "boy" | "girl" | "universal";

export type RewardFallbackVisual = "gift" | "sticker" | "medal" | "fox";

export interface RewardItem {
  id: string;
  title: string;
  collectionId: string;
  collectionTitle: string;
  preferredAudience: RewardAudience | readonly RewardAudience[];
  asset: string | null;
  fallbackVisual: RewardFallbackVisual;
}

export const REWARD_THRESHOLDS = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 50,
  55, 60, 65, 70, 75, 80, 85, 90, 95, 100
] as const;

export type RewardThreshold = (typeof REWARD_THRESHOLDS)[number];

/** Legacy slot IDs kept so already earned stickers stay in the child's album. */
export const LEGACY_REWARD_IDS = ["gift", "sticker", "medal", "fox"] as const;

export const REWARD_CATALOG: readonly RewardItem[] = [
  {
    id: "gift",
    title: "Подарок",
    collectionId: "celebrations",
    collectionTitle: "Праздники",
    preferredAudience: "universal",
    asset: null,
    fallbackVisual: "gift"
  },
  {
    id: "sticker",
    title: "Яркий стикер",
    collectionId: "achievements",
    collectionTitle: "Достижения",
    preferredAudience: "universal",
    asset: null,
    fallbackVisual: "sticker"
  },
  {
    id: "medal",
    title: "Медаль",
    collectionId: "achievements",
    collectionTitle: "Достижения",
    preferredAudience: "universal",
    asset: null,
    fallbackVisual: "medal"
  },
  {
    id: "fox",
    title: "Танец лисёнка",
    collectionId: "fox",
    collectionTitle: "Лисёнок",
    preferredAudience: "universal",
    asset: null,
    fallbackVisual: "fox"
  },
  {
    id: "safari-friend",
    title: "Сафари-друг",
    collectionId: "animals",
    collectionTitle: "Животные",
    preferredAudience: "universal",
    asset: null,
    fallbackVisual: "sticker"
  },
  {
    id: "ocean-wave",
    title: "Морская волна",
    collectionId: "ocean",
    collectionTitle: "Океан",
    preferredAudience: "universal",
    asset: null,
    fallbackVisual: "sticker"
  },
  {
    id: "planet-spark",
    title: "Звёздная планета",
    collectionId: "space",
    collectionTitle: "Космос",
    preferredAudience: "universal",
    asset: null,
    fallbackVisual: "medal"
  },
  {
    id: "dino-buddy",
    title: "Дино-друг",
    collectionId: "dinosaurs",
    collectionTitle: "Динозавры",
    preferredAudience: "boy",
    asset: null,
    fallbackVisual: "sticker"
  },
  {
    id: "race-car",
    title: "Гоночная машина",
    collectionId: "vehicles",
    collectionTitle: "Машины",
    preferredAudience: "boy",
    asset: null,
    fallbackVisual: "gift"
  },
  {
    id: "rocket-pilot",
    title: "Ракета",
    collectionId: "space",
    collectionTitle: "Космос",
    preferredAudience: "boy",
    asset: null,
    fallbackVisual: "medal"
  },
  {
    id: "robot-pal",
    title: "Робот-приятель",
    collectionId: "robots",
    collectionTitle: "Роботы",
    preferredAudience: "boy",
    asset: null,
    fallbackVisual: "fox"
  },
  {
    id: "unicorn-star",
    title: "Единорог",
    collectionId: "magicForest",
    collectionTitle: "Волшебный лес",
    preferredAudience: "girl",
    asset: null,
    fallbackVisual: "sticker"
  },
  {
    id: "fairy-sparkle",
    title: "Фея",
    collectionId: "magicForest",
    collectionTitle: "Волшебный лес",
    preferredAudience: "girl",
    asset: null,
    fallbackVisual: "gift"
  },
  {
    id: "kitten-bow",
    title: "Котёнок",
    collectionId: "animals",
    collectionTitle: "Животные",
    preferredAudience: "girl",
    asset: null,
    fallbackVisual: "fox"
  },
  {
    id: "rainbow-bloom",
    title: "Радуга",
    collectionId: "rainbow",
    collectionTitle: "Радуга",
    preferredAudience: "girl",
    asset: null,
    fallbackVisual: "medal"
  }
];

export function getRewardById(id: string): RewardItem | undefined {
  return REWARD_CATALOG.find((item) => item.id === id);
}

function audiencesOf(item: RewardItem): readonly RewardAudience[] {
  const audience = item.preferredAudience;
  if (typeof audience === "string") {
    return [audience];
  }
  return audience;
}

export function preferredAudiencesFor(
  preference: PlayerPreference | null
): readonly RewardAudience[] {
  if (preference === "boy") {
    return ["boy", "universal"];
  }
  if (preference === "girl") {
    return ["girl", "universal"];
  }
  return ["boy", "girl", "universal"];
}

export function pickNextReward(
  preference: PlayerPreference | null,
  unlockedIds: readonly string[]
): RewardItem | null {
  const unlocked = new Set(unlockedIds);
  const remaining = REWARD_CATALOG.filter((item) => !unlocked.has(item.id));
  if (!remaining.length) {
    return null;
  }
  const ranked = remaining
    .map((item, index) => ({ item, index, rank: audienceRank(item, preference) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index);
  return ranked[0]?.item ?? null;
}

function audienceRank(item: RewardItem, preference: PlayerPreference | null): number {
  const audiences = audiencesOf(item);
  if (preference === "boy") {
    if (audiences.includes("boy")) {
      return 0;
    }
    if (audiences.includes("universal")) {
      return 1;
    }
    return 2;
  }
  if (preference === "girl") {
    if (audiences.includes("girl")) {
      return 0;
    }
    if (audiences.includes("universal")) {
      return 1;
    }
    return 2;
  }
  return 0;
}
