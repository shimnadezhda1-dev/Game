import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function uniqueIds(ids) {
  const seen = new Set();
  const next = [];
  for (const value of ids) {
    if (typeof value !== "string" || !value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    next.push(value);
  }
  return next;
}

function migrateFavoriteStickerIds(args) {
  const unlocked = new Set(args.unlockedStickerIds);
  const fromList = Array.isArray(args.favoriteStickerIds)
    ? args.favoriteStickerIds.filter((id) => typeof id === "string" && id.length > 0)
    : [];
  const legacy = typeof args.favoriteStickerId === "string" ? args.favoriteStickerId : null;
  const favoriteStickerIds = uniqueIds([...fromList, ...(legacy ? [legacy] : [])]).filter((id) =>
    unlocked.has(id)
  );
  return {
    favoriteStickerIds,
    favoriteStickerId: favoriteStickerIds[0] ?? null
  };
}

function toggleFavoriteStickerId(current, id, unlockedStickerIds) {
  if (!unlockedStickerIds.includes(id)) {
    return uniqueIds(current);
  }
  if (current.includes(id)) {
    return current.filter((item) => item !== id);
  }
  return uniqueIds([...current, id]);
}

function meadowFavoriteIds(favoriteStickerIds, currentRewardId) {
  return favoriteStickerIds.filter((id) => id !== currentRewardId);
}

const unlocked = ["sticker-a", "sticker-b", "sticker-c", "sticker-x"];

const empty = migrateFavoriteStickerIds({
  favoriteStickerId: null,
  favoriteStickerIds: [],
  unlockedStickerIds: unlocked
});
assert.deepEqual(empty.favoriteStickerIds, []);
assert.deepEqual(meadowFavoriteIds(empty.favoriteStickerIds, null), []);

let favorites = toggleFavoriteStickerId(empty.favoriteStickerIds, "sticker-a", unlocked);
assert.deepEqual(favorites, ["sticker-a"]);
assert.deepEqual(meadowFavoriteIds(favorites, null), ["sticker-a"]);

favorites = toggleFavoriteStickerId(favorites, "sticker-b", unlocked);
favorites = toggleFavoriteStickerId(favorites, "sticker-c", unlocked);
assert.deepEqual(favorites, ["sticker-a", "sticker-b", "sticker-c"]);
assert.deepEqual(meadowFavoriteIds(favorites, null), ["sticker-a", "sticker-b", "sticker-c"]);

favorites = toggleFavoriteStickerId(favorites, "sticker-b", unlocked);
assert.deepEqual(favorites, ["sticker-a", "sticker-c"]);
assert.equal(favorites.includes("sticker-b"), false);
assert.deepEqual(meadowFavoriteIds(favorites, null), ["sticker-a", "sticker-c"]);

const reloaded = migrateFavoriteStickerIds({
  favoriteStickerId: favorites[0],
  favoriteStickerIds: favorites,
  unlockedStickerIds: unlocked
});
assert.deepEqual(reloaded.favoriteStickerIds, ["sticker-a", "sticker-c"]);

const migrated = migrateFavoriteStickerIds({
  favoriteStickerId: "sticker-x",
  unlockedStickerIds: unlocked
});
assert.equal(migrated.favoriteStickerIds.includes("sticker-x"), true);
assert.deepEqual(migrated.favoriteStickerIds, ["sticker-x"]);

const locked = toggleFavoriteStickerId(favorites, "sticker-locked", unlocked);
assert.deepEqual(locked, favorites);

const droppedLocked = migrateFavoriteStickerIds({
  favoriteStickerId: "sticker-locked",
  favoriteStickerIds: ["sticker-a", "sticker-locked"],
  unlockedStickerIds: ["sticker-a"]
});
assert.deepEqual(droppedLocked.favoriteStickerIds, ["sticker-a"]);

const onlyFavorites = meadowFavoriteIds(["sticker-a"], "sticker-new");
assert.deepEqual(onlyFavorites, ["sticker-a"]);
assert.equal(onlyFavorites.includes("sticker-b"), false);
assert.deepEqual(meadowFavoriteIds(["sticker-a", "sticker-c"], "sticker-a"), ["sticker-c"]);

const many = Array.from({ length: 20 }, (_, index) => `sticker-${index}`);
assert.equal(meadowFavoriteIds(many, null).length, 20);

const storage = read("src/utils/storage.ts");
assert.match(storage, /migrateFavoriteStickerIds/);
assert.match(storage, /favoriteStickerIds: favorites\.favoriteStickerIds/);
assert.match(storage, /favoriteStickerPositions/);
assert.match(storage, /migrateFavoriteStickerLayouts/);
assert.match(storage, /favoriteStickerLayouts/);
assert.match(storage, /unlockedStickerIds: unlockedFromSave/);
assert.match(storage, /claimedMilestonesThisCycle,/);
assert.match(storage, /stars,/);

const app = read("src/App.tsx");
assert.match(app, /progress\.favoriteStickerIds/);
assert.match(app, /toggleFavoriteStickerId/);
assert.match(app, /MyMeadowScreen/);
assert.match(app, /favoriteStickerLayouts/);

const album = read("src/components/StickersAlbumScreen.tsx");
assert.match(album, /sticker-preview__heart/);
assert.match(album, /В любимые/);
assert.match(album, /Убрать из любимых/);
assert.match(album, /sticker-slot__heart/);
assert.match(album, /МОЯ ПОЛЯНКА/);
assert.match(album, /onOpenMeadow/);

const world = read("src/components/WorldBackground.tsx");
assert.match(world, /meadow-life/);
assert.doesNotMatch(world, /data-meadow-friend/);

const meadowLayer = read("src/components/MeadowStickerLayer.tsx");
assert.match(meadowLayer, /data-meadow-friend/);
assert.match(meadowLayer, /layoutMeadowFriends/);
assert.match(meadowLayer, /onPointerDown/);
assert.match(meadowLayer, /setPointerCapture/);
assert.match(read("src/styles.css"), /touch-action:\s*none/);

const reward = read("src/components/RewardScreen.tsx");
assert.doesNotMatch(reward, /MeadowStickerLayer/);
assert.doesNotMatch(reward, /Расставить заново/);

const meadowScreen = read("src/components/MyMeadowScreen.tsx");
assert.doesNotMatch(meadowScreen, /Моя полянка/);
assert.doesNotMatch(meadowScreen, /Расставить заново/);
assert.match(read("src/utils/favoriteStickers.ts"), /MEADOW_HIDDEN_STICKER_IDS = new Set<string>\(\)/);
assert.match(read("src/data/stickerCatalog.ts"), /"sticker-01": \{[\s\S]*?title: "Белочка"/);

const layout = read("src/utils/favoriteStickers.ts");
assert.match(layout, /FAVORITE_STICKER_BASE_SIZE = 122/);
assert.match(layout, /DESKTOP_AUTO_LAYOUT_BANDS/);
assert.match(layout, /MOBILE_AUTO_LAYOUT_BANDS/);
assert.match(layout, /bottom: 8/);
assert.match(layout, /bottom: 48/);
assert.match(layout, /bottom: 22/);
assert.match(layout, /bottom: 66/);
assert.match(layout, /bottom: 44/);

const adventure = read("src/utils/stickerLogic.ts");
assert.doesNotMatch(adventure, /favoriteStickerIds:\s*\[\]/);

console.log("verify-favorite-stickers: ok");
