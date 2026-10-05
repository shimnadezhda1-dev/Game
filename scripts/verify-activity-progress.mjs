import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ACTIVITIES = ["learn", "find", "picture", "listen"];

function empty() {
  return {
    learn: { letterId: null },
    find: { letterId: null },
    picture: { letterId: null },
    listen: { letterId: null }
  };
}

function withLetter(progress, activity, letterId) {
  return {
    ...progress,
    activityProgress: {
      ...progress.activityProgress,
      [activity]: { letterId }
    }
  };
}

function resetOne(progress, activity, startId) {
  return withLetter(progress, activity, startId);
}

let store = { stars: 7, unlockedRewards: ["fox"], activityProgress: empty() };
store = withLetter(store, "learn", "D");
store = withLetter(store, "find", "K");
store = withLetter(store, "picture", "T");
store = withLetter(store, "listen", "Eh");

const independence =
  store.activityProgress.learn.letterId === "D" &&
  store.activityProgress.find.letterId === "K" &&
  store.activityProgress.picture.letterId === "T" &&
  store.activityProgress.listen.letterId === "Eh" &&
  store.stars === 7;

store = withLetter(store, "find", "M");
store = withLetter(store, "picture", "R");
store = resetOne(store, "find", "A");
const resetIsolated =
  store.activityProgress.find.letterId === "A" &&
  store.activityProgress.picture.letterId === "R" &&
  store.stars === 7 &&
  store.unlockedRewards[0] === "fox";

const letters = [{ id: "A" }, { id: "M" }, { id: "Zh" }, { id: "Ya" }];
function indexForSaved(letterId) {
  const index = letters.findIndex((item) => item.id === letterId);
  return index >= 0 ? index : 0;
}
const learnIdx = indexForSaved("M");
const findIdx = indexForSaved("Zh");
const switchIndependent = learnIdx === 1 && findIdx === 2 && learnIdx !== findIdx;

const continueMap = {
  learn: store.activityProgress.learn.letterId,
  find: store.activityProgress.find.letterId,
  picture: store.activityProgress.picture.letterId,
  listen: store.activityProgress.listen.letterId
};

const persisted = JSON.parse(JSON.stringify(store));
const reloadOk =
  persisted.activityProgress.learn.letterId === "D" &&
  persisted.activityProgress.find.letterId === "A" &&
  persisted.activityProgress.picture.letterId === "R" &&
  persisted.activityProgress.listen.letterId === "Eh" &&
  persisted.stars === 7;

const status = independence && resetIsolated && reloadOk && switchIndependent ? "PASS" : "FAIL";
const report = {
  independence,
  resetIsolated,
  reloadOk,
  switchIndependent,
  continueMap,
  stars: store.stars,
  status
};
mkdirSync(join(dirname(fileURLToPath(import.meta.url)), "..", ".cursor-verify"), {
  recursive: true
});
writeFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", ".cursor-verify/activity-progress-verify.json"),
  JSON.stringify(report, null, 2)
);
console.log(`independence=${independence}`);
console.log(`resetIsolated=${resetIsolated}`);
console.log(`switchIndependent=${switchIndependent}`);
console.log(`continue=${JSON.stringify(continueMap)}`);
console.log(`starsUnchanged=${store.stars === 7}`);
console.log(`STATUS ${status}`);
if (status !== "PASS") {
  process.exit(1);
}
