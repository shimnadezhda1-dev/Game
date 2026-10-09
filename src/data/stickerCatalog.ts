import { FINAL_STICKER_ART } from "./finalStickerArt";
import { RewardAudience, RewardFallbackVisual, RewardItem } from "./rewardCatalog";
import { resolveStickerAsset, stickerAssetExists } from "./stickerAssets";

export type StickerKind = "regular" | "achievement" | "legacy";

export interface StickerCollection {
  id: string;
  title: string;
  order: number;
}

export interface StickerItem extends RewardItem {
  kind: StickerKind;
  order: number;
}

export const STICKER_COLLECTIONS: readonly StickerCollection[] = [
  { id: "meadow-friends", title: "Друзья поляны", order: 1 },
  { id: "sky-party", title: "Небо и праздник", order: 2 },
  { id: "toy-magic", title: "Игрушки и чудеса", order: 3 },
  { id: "achievements", title: "Достижения", order: 4 }
];

const COLLECTION_TITLES: Record<string, string> = Object.fromEntries(
  STICKER_COLLECTIONS.map((collection) => [collection.id, collection.title])
);

const MEADOW_NAMES = [
  "Белочка",
  "Ромашка",
  "Божья коровка",
  "Зайчик",
  "Белочка",
  "Ёжик",
  "Птичка",
  "Бабочка",
  "Грибочек",
  "Ягодка",
  "Листочек",
  "Улитка",
  "Лягушонок",
  "Котёнок",
  "Щенок",
  "Рыбка",
  "Утёнок",
  "Мышонок",
  "Пчёлка",
  "Жучок"
];

function regularSticker(
  order: number,
  collectionId: string,
  title: string
): StickerItem {
  const id = `sticker-${String(order).padStart(2, "0")}`;
  return {
    id,
    title,
    collectionId,
    collectionTitle: COLLECTION_TITLES[collectionId] ?? collectionId,
    preferredAudience: "universal",
    asset: `/assets/stickers/${id}.webp`,
    fallbackVisual: "sticker",
    kind: "regular",
    order
  };
}

/**
 * Real artwork currently on disk. Title/collection/asset stay on the same sticker.id
 * so already unlocked IDs keep their image after a label fix.
 */
export const VISIBLE_STICKER_ART: Record<
  string,
  { title: string; asset: string; collectionId: string }
> = {
  "sticker-01": {
    title: "Белочка",
    asset: "/assets/stickers/final/universal/squirrel-acorn.png",
    collectionId: "meadow-friends"
  },
  "sticker-02": {
    title: "Колибри",
    asset: "/assets/stickers/final/universal/hummingbird.png",
    collectionId: "sky-party"
  },
  "sticker-03": {
    title: "Звёздочка",
    asset: "/assets/stickers/final/girls/star.png",
    collectionId: "sky-party"
  },
  "sticker-04": {
    title: "Сундучок",
    asset: "/assets/stickers/final/boys/treasure-chest.png",
    collectionId: "sky-party"
  }
};

function withVisibleArtwork(item: StickerItem): StickerItem {
  const art = VISIBLE_STICKER_ART[item.id];
  if (!art) {
    return item;
  }
  return {
    ...item,
    title: art.title,
    asset: art.asset,
    collectionId: art.collectionId,
    collectionTitle: COLLECTION_TITLES[art.collectionId] ?? item.collectionTitle
  };
}

function finalSticker(art: (typeof FINAL_STICKER_ART)[number]): StickerItem {
  const order = Number(art.id.replace("sticker-", ""));
  return {
    id: art.id,
    title: art.title,
    collectionId: art.collectionId,
    collectionTitle: COLLECTION_TITLES[art.collectionId] ?? art.collectionId,
    preferredAudience: art.preferredAudience,
    asset: art.asset,
    fallbackVisual: "sticker",
    kind: "regular",
    order
  };
}

function makeRegularStickers(): StickerItem[] {
  const kept = MEADOW_NAMES.slice(0, 4).map((title, index) =>
    regularSticker(index + 1, "meadow-friends", title)
  );
  return [...kept, ...FINAL_STICKER_ART.map(finalSticker)].map(withVisibleArtwork);
}

export const LEGACY_STICKERS: readonly StickerItem[] = [
  {
    id: "gift",
    title: "Подарок",
    collectionId: "sky-party",
    collectionTitle: COLLECTION_TITLES["sky-party"],
    preferredAudience: "universal",
    asset: null,
    fallbackVisual: "gift",
    kind: "legacy",
    order: 1001
  },
  {
    id: "sticker",
    title: "Яркий стикер",
    collectionId: "achievements",
    collectionTitle: COLLECTION_TITLES.achievements,
    preferredAudience: "universal",
    asset: null,
    fallbackVisual: "sticker",
    kind: "legacy",
    order: 1002
  },
  {
    id: "medal",
    title: "Медаль",
    collectionId: "achievements",
    collectionTitle: COLLECTION_TITLES.achievements,
    preferredAudience: "universal",
    asset: null,
    fallbackVisual: "medal",
    kind: "legacy",
    order: 1003
  },
  {
    id: "fox",
    title: "Танец лисёнка",
    collectionId: "achievements",
    collectionTitle: COLLECTION_TITLES.achievements,
    preferredAudience: "universal",
    asset: null,
    fallbackVisual: "fox",
    kind: "legacy",
    order: 1004
  }
];

export const ALPHABET_ACHIEVEMENT_ID = "alphabet-expert";

export const ALPHABET_ACHIEVEMENT_STICKER: StickerItem = {
  id: ALPHABET_ACHIEVEMENT_ID,
  title: "Оленёнок",
  collectionId: "achievements",
  collectionTitle: COLLECTION_TITLES.achievements,
  preferredAudience: "universal",
  asset: "/assets/stickers/final/universal/fawn-flowers.png",
  fallbackVisual: "fox",
  kind: "achievement",
  order: 2000
};

export const REGULAR_STICKER_CATALOG: readonly StickerItem[] = makeRegularStickers();

export const STICKER_CATALOG: readonly StickerItem[] = [
  ...REGULAR_STICKER_CATALOG,
  ...LEGACY_STICKERS,
  ALPHABET_ACHIEVEMENT_STICKER
];

export function getStickerById(id: string): StickerItem | undefined {
  return STICKER_CATALOG.find((item) => item.id === id);
}

export function resolvedSticker(item: StickerItem): StickerItem {
  return {
    ...item,
    asset: resolveStickerAsset(item.id, item.asset)
  };
}

export function awardableRegularStickers(): StickerItem[] {
  return REGULAR_STICKER_CATALOG.map(resolvedSticker).filter((item) => stickerAssetExists(item.asset));
}

export function pickNextRegularSticker(unlockedIds: readonly string[]): StickerItem | null {
  const unlocked = new Set(unlockedIds);
  const remaining = awardableRegularStickers()
    .filter((item) => !unlocked.has(item.id))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return remaining[0] ?? null;
}

export function albumCollections(): StickerCollection[] {
  return STICKER_COLLECTIONS.filter((collection) => collection.id !== "achievements").sort(
    (a, b) => a.order - b.order
  );
}

export function stickersInCollection(collectionId: string): StickerItem[] {
  return STICKER_CATALOG.filter((item) => item.collectionId === collectionId && item.kind !== "legacy").sort(
    (a, b) => a.order - b.order
  );
}

export function collectionCounts(
  collectionId: string,
  unlockedIds: readonly string[]
): { unlocked: number; total: number } {
  const items = stickersInCollection(collectionId);
  const unlocked = new Set(unlockedIds);
  return {
    unlocked: items.filter((item) => unlocked.has(item.id)).length,
    total: items.length
  };
}

export function asRewardItem(item: StickerItem): RewardItem {
  const resolved = resolvedSticker(item);
  return {
    id: resolved.id,
    title: resolved.title,
    collectionId: resolved.collectionId,
    collectionTitle: resolved.collectionTitle,
    preferredAudience: resolved.preferredAudience as RewardAudience | readonly RewardAudience[],
    asset: resolved.asset,
    fallbackVisual: resolved.fallbackVisual as RewardFallbackVisual
  };
}
