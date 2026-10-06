import { uniqueIds } from "./stickerLogic";

export interface MeadowFriendSlot {
  id: string;
  side: "left" | "right";
  inset: number;
  bottom: number;
  size: number;
  delay: number;
  tilt: number;
}

export function migrateFavoriteStickerIds(args: {
  favoriteStickerId?: unknown;
  favoriteStickerIds?: unknown;
  unlockedStickerIds: readonly string[];
}): { favoriteStickerIds: string[]; favoriteStickerId: string | null } {
  const unlocked = new Set(args.unlockedStickerIds);
  const fromList = Array.isArray(args.favoriteStickerIds)
    ? args.favoriteStickerIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
  const legacy = typeof args.favoriteStickerId === "string" ? args.favoriteStickerId : null;
  const favoriteStickerIds = uniqueIds([
    ...fromList,
    ...(legacy ? [legacy] : [])
  ]).filter((id) => unlocked.has(id));
  return {
    favoriteStickerIds,
    favoriteStickerId: favoriteStickerIds[0] ?? null
  };
}

export function toggleFavoriteStickerId(
  current: readonly string[],
  id: string,
  unlockedStickerIds: readonly string[]
): string[] {
  if (!unlockedStickerIds.includes(id)) {
    return uniqueIds(current);
  }
  if (current.includes(id)) {
    return current.filter((item) => item !== id);
  }
  return uniqueIds([...current, id]);
}

export function meadowFavoriteIds(
  favoriteStickerIds: readonly string[],
  currentRewardId?: string | null
): string[] {
  return favoriteStickerIds.filter((id) => id !== currentRewardId);
}

export function layoutMeadowFriends(ids: readonly string[]): MeadowFriendSlot[] {
  const count = ids.length;
  const size = count <= 2 ? 92 : count <= 4 ? 78 : count <= 8 ? 64 : count <= 14 ? 52 : 42;
  const columns = count <= 4 ? 1 : count <= 8 ? 2 : count <= 16 ? 3 : 4;
  const rowGap = count <= 8 ? 8 : 5.5;
  return ids.map((id, index) => {
    const side: "left" | "right" = index % 2 === 0 ? "left" : "right";
    const lane = Math.floor(index / 2);
    const column = lane % columns;
    const row = Math.floor(lane / columns);
    return {
      id,
      side,
      inset: 2 + column * 6.5 + (row % 2) * 1.5,
      bottom: Math.min(18, 5 + row * rowGap + (column % 2) * 2.5),
      size,
      delay: (index % 7) * 0.38,
      tilt: side === "left" ? -8 + (row % 3) * 4 : 7 - (column % 3) * 3
    };
  });
}
