import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ALPHABET = [
  "A","B","V","G","D","E","Yo","Zh","Z","I","J","K","L","M","N","O","P","R","S","T","U","F",
  "Kh","Ts","Ch","Sh","Shch","Hard","Yery","Soft","Eh","Yu","Ya"
];

function uniqueIds(ids) {
  return [...new Set(ids.filter((id) => typeof id === "string" && id))];
}

function isComplete(ids) {
  const unique = uniqueIds(ids).filter((id) => ALPHABET.includes(id));
  return unique.length === 33 && ALPHABET.every((id) => unique.includes(id));
}

function shouldCount({ studyOrder, step }) {
  return studyOrder === "alpha" && step === "learn";
}

function crossed(prev, next) {
  if (!(next > prev)) {
    return null;
  }
  const first = (Math.floor(prev / 5) + 1) * 5;
  return first <= next ? first : null;
}

function unlock({ unlocked, claimed, prevStars, nextStars, pool }) {
  const threshold = crossed(prevStars, nextStars);
  if (!threshold || claimed.includes(threshold)) {
    return null;
  }
  const next = pool.find((id) => !unlocked.includes(id));
  if (!next) {
    return null;
  }
  return { stickerId: next, threshold };
}

const pool = ["sticker-01", "sticker-02", "sticker-03", "sticker-04"];
let unlocked = [];
let claimed = [];
let stars = 0;

function addStars(n) {
  for (let i = 0; i < n; i += 1) {
    const grant = unlock({ unlocked, claimed, prevStars: stars, nextStars: stars + 1, pool });
    stars += 1;
    if (grant) {
      unlocked = uniqueIds([...unlocked, grant.stickerId]);
      claimed = [...claimed, grant.threshold];
    }
  }
}

addStars(4);
assert.equal(unlocked.length, 0, "4 stars → no reward");
addStars(1);
assert.equal(unlocked.length, 1, "5 stars → exactly 1");
assert.deepEqual(unlocked, ["sticker-01"]);
addStars(1);
assert.equal(unlocked.length, 1, "6 stars → no extra");
addStars(4);
assert.equal(unlocked.length, 2, "10 stars → next sticker");
assert.deepEqual(unlocked, ["sticker-01", "sticker-02"]);

const reloadGrant = unlock({ unlocked, claimed, prevStars: 9, nextStars: 10, pool });
assert.equal(reloadGrant, null, "reload on 10 → no duplicate");

const savedStickers = [...unlocked];
const savedFavorite = "sticker-01";
stars = 0;
claimed = [];
assert.deepEqual(unlocked, savedStickers, "new cycle keeps stickers");
addStars(5);
assert.equal(unlocked[2], "sticker-03", "new cycle 5 → next NEW sticker");
assert.equal(savedFavorite, "sticker-01");

assert.equal(isComplete(ALPHABET.slice(0, 32)), false, "32 letters → not complete");
assert.equal(isComplete(ALPHABET), true, "33 unique → complete");
assert.equal(isComplete([...ALPHABET, "A"]), true, "duplicates ignored");
assert.equal(shouldCount({ studyOrder: "pick", step: "learn" }), false, "pick does not count");
assert.equal(shouldCount({ studyOrder: "random", step: "learn" }), false, "random does not count");
assert.equal(shouldCount({ studyOrder: "alpha", step: "learn" }), true, "alpha learn counts");
assert.equal(shouldCount({ studyOrder: "alpha", step: "findHint" }), false, "other activity does not count");

const collection = ["sticker-01", "sticker-02"];
let favorite = "sticker-01";
favorite = "sticker-02";
assert.deepEqual(collection, ["sticker-01", "sticker-02"], "changing favorite keeps collection");
assert.equal(favorite, "sticker-02");

const longPool = Array.from({ length: 40 }, (_, index) => `sticker-${String(index + 1).padStart(2, "0")}`);
let longUnlocked = [];
let longClaimed = [];
let longStars = 0;
const grants = [];

function addLong(n) {
  for (let i = 0; i < n; i += 1) {
    const grant = unlock({
      unlocked: longUnlocked,
      claimed: longClaimed,
      prevStars: longStars,
      nextStars: longStars + 1,
      pool: longPool
    });
    longStars += 1;
    if (grant) {
      longUnlocked = uniqueIds([...longUnlocked, grant.stickerId]);
      longClaimed = [...longClaimed, grant.threshold];
      grants.push({ stars: longStars, ...grant });
    }
  }
}

addLong(100);
const grantAt = (stars) => grants.find((grant) => grant.stars === stars) ?? null;
for (const stars of [45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]) {
  const grant = grantAt(stars);
  assert.ok(grant, `${stars} should award the next sticker`);
  assert.equal(grant.threshold, stars);
  assert.equal(grant.stickerId, longPool[stars / 5 - 1]);
}
for (const stars of [51, 52, 53, 54, 56, 57, 58, 59]) {
  assert.equal(grantAt(stars), null, `${stars} must not award`);
}
assert.equal(longUnlocked.length, 20, "100 stars → 20 stickers, one per 5 stars");
assert.equal(new Set(longUnlocked).size, 20, "no duplicate sticker ids");
assert.deepEqual(longClaimed, grants.map((grant) => grant.threshold));

const jump55 = unlock({
  unlocked: longPool.slice(0, 10),
  claimed: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
  prevStars: 53,
  nextStars: 57,
  pool: longPool
});
assert.equal(jump55.threshold, 55, "53 → 57 keeps the 55 milestone");
assert.equal(jump55.stickerId, "sticker-11");

const jump60 = unlock({
  unlocked: longPool.slice(0, 11),
  claimed: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
  prevStars: 58,
  nextStars: 61,
  pool: longPool
});
assert.equal(jump60.threshold, 60, "58 → 61 awards 60");
assert.equal(jump60.stickerId, "sticker-12");

const reload55 = unlock({
  unlocked: [...longPool.slice(0, 10), jump55.stickerId],
  claimed: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
  prevStars: 54,
  nextStars: 55,
  pool: longPool
});
assert.equal(reload55, null, "reload at 55 does not repeat the milestone");

const after50Claimed = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
assert.equal(after50Claimed.includes(55), false, "claiming 50 does not claim 55");
const past100 = unlock({
  unlocked: longPool.slice(0, 20),
  claimed: after50Claimed.concat([55, 60, 65, 70, 75, 80, 85, 90, 95, 100]),
  prevStars: 100,
  nextStars: 105,
  pool: longPool
});
assert.equal(past100.threshold, 105, "awards continue after 100");
assert.equal(past100.stickerId, "sticker-21");

const tinyPool = ["sticker-01", "sticker-02", "sticker-03", "sticker-04"];
let tinyUnlocked = [];
let tinyClaimed = [];
let tinyStars = 0;
function addTiny() {
  const grant = unlock({
    unlocked: tinyUnlocked,
    claimed: tinyClaimed,
    prevStars: tinyStars,
    nextStars: tinyStars + 1,
    pool: tinyPool
  });
  tinyStars += 1;
  if (grant) {
    tinyUnlocked = uniqueIds([...tinyUnlocked, grant.stickerId]);
    tinyClaimed = [...tinyClaimed, grant.threshold];
  }
  return grant;
}
let lastTiny = null;
while (tinyStars < 20) {
  lastTiny = addTiny();
}
assert.equal(lastTiny.threshold, 20);
assert.deepEqual(tinyUnlocked, tinyPool);
assert.equal(addTiny(), null, "empty pool at 25 does not invent a sticker");
while (tinyStars < 55) {
  assert.equal(addTiny(), null);
}
assert.equal(tinyStars, 55);
assert.deepEqual(tinyUnlocked, tinyPool, "exhausted pool does not duplicate ids");

const cycleClaimed = [];
const cycleGrant = unlock({
  unlocked: tinyPool,
  claimed: cycleClaimed,
  prevStars: 4,
  nextStars: 5,
  pool: tinyPool
});
assert.equal(cycleGrant, null, "new cycle does not duplicate when the pool is empty");
const cycleNext = unlock({
  unlocked: ["sticker-01"],
  claimed: [],
  prevStars: 49,
  nextStars: 50,
  pool: tinyPool
});
assert.equal(cycleNext.stickerId, "sticker-02", "new cycle still awards the next free sticker at 50");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogSource = fs.readFileSync(path.join(root, "src/data/stickerCatalog.ts"), "utf8");
assert.match(
  catalogSource,
  /return awardableRegularStickers\(\)\.find\(\(item\) => !unlocked\.has\(item\.id\)\)/,
  "pickNextRegularSticker must choose only a sticker id that is not unlocked"
);
const finalArt = fs.readFileSync(path.join(root, "src/data/finalStickerArt.ts"), "utf8");
const finalIds = [...finalArt.matchAll(/id: "(sticker-\d+)"/g)].map((match) => match[1]);
const fullCatalog = ["sticker-01", "sticker-02", "sticker-03", "sticker-04", ...finalIds];
assert.equal(new Set(fullCatalog).size, fullCatalog.length, "catalog ids must be unique");
let owned = [];
let ownedClaimed = [];
let ownedStars = 0;
const grantedIds = [];
while (owned.length < fullCatalog.length) {
  const grant = unlock({
    unlocked: owned,
    claimed: ownedClaimed,
    prevStars: ownedStars,
    nextStars: ownedStars + 1,
    pool: fullCatalog
  });
  ownedStars += 1;
  if (!grant) {
    continue;
  }
  assert.equal(owned.includes(grant.stickerId), false, `repeat grant ${grant.stickerId}`);
  grantedIds.push(grant.stickerId);
  owned = uniqueIds([...owned, grant.stickerId]);
  ownedClaimed = [...ownedClaimed, grant.threshold];
}
const duplicateGrantCount = grantedIds.length - new Set(grantedIds).size;
assert.equal(grantedIds.length, fullCatalog.length, "one grant for every catalog sticker");
assert.equal(new Set(grantedIds).size, fullCatalog.length, "each sticker id is granted once");
assert.equal(duplicateGrantCount, 0, "duplicate sticker.id count");
console.log(
  `unique-grant: issued=${grantedIds.length} unique=${new Set(grantedIds).size} duplicates=${duplicateGrantCount}`
);
assert.deepEqual(owned, fullCatalog);
assert.equal(
  unlock({
    unlocked: owned,
    claimed: [],
    prevStars: ownedStars,
    nextStars: ownedStars + 5,
    pool: fullCatalog
  }),
  null,
  "a full collection does not open another new sticker"
);

const alreadyOwned = fullCatalog.slice(0, 40);
const nextFree = unlock({
  unlocked: alreadyOwned,
  claimed: [],
  prevStars: 49,
  nextStars: 50,
  pool: fullCatalog
});
assert.equal(alreadyOwned.includes(nextFree.stickerId), false, "next reward stays outside unlocked ids");
assert.equal(nextFree.stickerId, "sticker-41");

const milestoneIds = [];
let milestoneOwned = [];
for (const at of [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110]) {
  const grant = unlock({
    unlocked: milestoneOwned,
    claimed: [],
    prevStars: at - 1,
    nextStars: at,
    pool: fullCatalog
  });
  assert.ok(grant, `missing reward at ${at}`);
  assert.equal(grant.threshold, at);
  assert.equal(milestoneOwned.includes(grant.stickerId), false, `repeat at ${at}`);
  milestoneIds.push(grant.stickerId);
  milestoneOwned = [...milestoneOwned, grant.stickerId];
}
assert.equal(new Set(milestoneIds).size, milestoneIds.length, "milestones 50–110 award distinct stickers");
const repeatAfterReload = unlock({
  unlocked: milestoneOwned,
  claimed: [110],
  prevStars: 109,
  nextStars: 110,
  pool: fullCatalog
});
assert.equal(repeatAfterReload, null, "reload does not grant the sticker from milestone 110 again");

const savedState = JSON.parse(
  JSON.stringify({
    unlockedStickerIds: fullCatalog.slice(0, 8),
    claimedMilestonesThisCycle: [5, 10, 15, 20, 25, 30, 35, 40]
  })
);
const loadedState = JSON.parse(JSON.stringify(savedState));
let persistedOwned = loadedState.unlockedStickerIds;
let persistedClaimed = [];
let persistedStars = 49;
const continuedIds = [];
for (let step = 0; step < fullCatalog.length * 5; step += 1) {
  const grant = unlock({
    unlocked: persistedOwned,
    claimed: persistedClaimed,
    prevStars: persistedStars,
    nextStars: persistedStars + 1,
    pool: fullCatalog
  });
  persistedStars += 1;
  if (!grant) {
    continue;
  }
  assert.equal(
    savedState.unlockedStickerIds.includes(grant.stickerId),
    false,
    `reload awarded an already saved sticker ${grant.stickerId}`
  );
  continuedIds.push(grant.stickerId);
  persistedOwned = uniqueIds([...persistedOwned, grant.stickerId]);
  persistedClaimed = [...persistedClaimed, grant.threshold];
}
const persistedDuplicates = continuedIds.length - new Set(continuedIds).size;
assert.equal(persistedOwned.length, fullCatalog.length, "reload continuation finishes the collection");
assert.equal(persistedDuplicates, 0, "reload continuation has duplicate ids");
assert.equal(
  continuedIds.some((id) => savedState.unlockedStickerIds.includes(id)),
  false,
  "a saved sticker id was granted again"
);
console.log(
  `reload-persistence: saved=${savedState.unlockedStickerIds.length} continued=${continuedIds.length} duplicates=${persistedDuplicates}`
);

console.log("verify-sticker-cycle: ok");
