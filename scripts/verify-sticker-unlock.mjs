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

function uniqueNumbers(values) {
  const seen = new Set();
  const next = [];
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

function crossed(prev, next) {
  if (!(next > prev)) {
    return null;
  }
  const first = (Math.floor(prev / 5) + 1) * 5;
  return first <= next ? first : null;
}

function pickNext(unlocked, pool) {
  return pool.find((id) => !unlocked.includes(id)) ?? null;
}

function applyStickerGrant(unlockedStickerIds, claimed, prevStars, nextStars, pool) {
  const threshold = crossed(prevStars, nextStars);
  if (!threshold || claimed.includes(threshold)) {
    return {
      unlockedStickerIds: uniqueIds(unlockedStickerIds),
      claimedMilestonesThisCycle: uniqueNumbers(claimed),
      granted: null
    };
  }
  const stickerId = pickNext(unlockedStickerIds, pool);
  if (!stickerId) {
    return {
      unlockedStickerIds: uniqueIds(unlockedStickerIds),
      claimedMilestonesThisCycle: uniqueNumbers(claimed),
      granted: null
    };
  }
  return {
    unlockedStickerIds: uniqueIds([...unlockedStickerIds, stickerId]),
    claimedMilestonesThisCycle: uniqueNumbers([...claimed, threshold]),
    granted: { stickerId, threshold }
  };
}

function albumCollected(catalogIds, unlockedStickerIds) {
  const unlocked = new Set(unlockedStickerIds);
  return catalogIds.filter((id) => unlocked.has(id)).length;
}

function loadProgressLike(saved) {
  return {
    unlockedStickerIds: uniqueIds(
      Array.isArray(saved.unlockedStickerIds) ? saved.unlockedStickerIds : []
    ),
    claimedMilestonesThisCycle: uniqueNumbers(
      Array.isArray(saved.claimedMilestonesThisCycle) ? saved.claimedMilestonesThisCycle : []
    ),
    stars: typeof saved.stars === "number" ? saved.stars : 0
  };
}

const catalog = [
  "sticker-01",
  "sticker-02",
  "sticker-03",
  "sticker-04",
  "sticker-05",
  "alphabet-expert"
];
const pool = catalog.filter((id) => id !== "alphabet-expert");

let unlocked = ["sticker-01"];
let claimed = [5];
let stars = 8;
const overlays = [];

function addStar() {
  const grant = applyStickerGrant(unlocked, claimed, stars, stars + 1, pool);
  stars += 1;
  unlocked = grant.unlockedStickerIds;
  claimed = grant.claimedMilestonesThisCycle;
  const pending = grant.granted;
  if (pending) {
    if (!unlocked.includes(pending.stickerId)) {
      unlocked = uniqueIds([...unlocked, pending.stickerId]);
    }
    overlays.push(pending.stickerId);
  }
  return pending;
}

assert.equal(addStar(), null, "9 stars → no sticker");
const first = addStar();
assert.ok(first, "first new reward at 10");
assert.equal(first.stickerId, "sticker-02");
assert.deepEqual(unlocked, ["sticker-01", "sticker-02"]);
assert.equal(albumCollected(catalog, unlocked), 2);

const noExtra = addStar();
assert.equal(noExtra, null, "11 stars → no extra sticker");
assert.deepEqual(unlocked, ["sticker-01", "sticker-02"]);

stars = 14;
const second = addStar();
assert.ok(second, "second new reward at 15");
assert.equal(second.stickerId, "sticker-03");
assert.notEqual(first.stickerId, second.stickerId, "two rewards use different IDs");
assert.deepEqual(unlocked, ["sticker-01", "sticker-02", "sticker-03"]);
assert.equal(albumCollected(catalog, unlocked), 3, "counter follows unlocked IDs");
assert.equal(overlays.length, 2);
assert.deepEqual(overlays, ["sticker-02", "sticker-03"]);

const saved = {
  stars,
  unlockedStickerIds: [...unlocked],
  claimedMilestonesThisCycle: [...claimed]
};
const reloaded = loadProgressLike(saved);
assert.deepEqual(reloaded.unlockedStickerIds, ["sticker-01", "sticker-02", "sticker-03"]);
assert.equal(albumCollected(catalog, reloaded.unlockedStickerIds), 3);

const replay = applyStickerGrant(
  reloaded.unlockedStickerIds,
  reloaded.claimedMilestonesThisCycle,
  9,
  10,
  pool
);
assert.equal(replay.granted, null, "already claimed milestone cannot re-award");
assert.deepEqual(replay.unlockedStickerIds, reloaded.unlockedStickerIds);

const duplicate = applyStickerGrant(
  reloaded.unlockedStickerIds,
  [],
  4,
  5,
  pool
);
assert.equal(duplicate.granted.stickerId, "sticker-04", "next unused sticker, not a duplicate");
assert.equal(new Set(duplicate.unlockedStickerIds).size, duplicate.unlockedStickerIds.length);

const app = read("src/App.tsx");
assert.match(app, /applyStickerGrant\(/);
assert.match(app, /progressRef\.current = next/);
assert.match(app, /ensureStickerIdSaved\(/);
assert.match(app, /unlockedRewards: grant\.unlockedStickerIds/);
assert.doesNotMatch(
  app,
  /unlockRewardAtThreshold\(\s*snapshot/,
  "stale snapshot must not queue a reward before persist"
);

const rewards = read("src/utils/rewards.ts");
assert.match(rewards, /export function applyStickerGrant/);
assert.match(rewards, /export function ensureStickerIdSaved/);

const album = read("src/components/StickersAlbumScreen.tsx");
assert.match(album, /new Set\(progress\.unlockedStickerIds\)/);
assert.match(album, /unlocked\.has\(item\.id\)/);
assert.match(album, /Собрано: \{collected\} из \{albumStickers\.length\}/);

const storage = read("src/utils/storage.ts");
assert.match(storage, /STORAGE_KEY = "happy-alphabet-progress-v1"/);
assert.match(storage, /unlockedStickerIds: unlockedFromSave/);

console.log("verify-sticker-unlock: ok");
console.log(`first=${first.stickerId} second=${second.stickerId} collected=${albumCollected(catalog, reloaded.unlockedStickerIds)}`);
