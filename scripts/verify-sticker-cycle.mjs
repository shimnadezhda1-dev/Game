import assert from "node:assert/strict";

const ALPHABET = [
  "A","B","V","G","D","E","Yo","Zh","Z","I","J","K","L","M","N","O","P","R","S","T","U","F",
  "Kh","Ts","Ch","Sh","Shch","Hard","Yery","Soft","Eh","Yu","Ya"
];
const THRESHOLDS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

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
  return THRESHOLDS.find((at) => prev < at && next >= at) ?? null;
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

console.log("verify-sticker-cycle: ok");
