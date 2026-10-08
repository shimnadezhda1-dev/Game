import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const phrases = fs.readFileSync(path.join(root, "src/audio/voicePhrases.ts"), "utf8");
const bag = fs.readFileSync(path.join(root, "src/audio/phraseBag.ts"), "utf8");
const manager = fs.readFileSync(path.join(root, "src/audio/AudioManager.ts"), "utf8");
const round = fs.readFileSync(path.join(root, "src/utils/useRound.ts"), "utf8");

const praiseIds = [...phrases.matchAll(/id: "praise-\d+"/g)];
const retryIds = [...phrases.matchAll(/id: "retry-\d+"/g)];
assert.ok(praiseIds.length >= 20, `expected at least 20 praise phrases, got ${praiseIds.length}`);
assert.ok(retryIds.length >= 10, `expected at least 10 retry phrases, got ${retryIds.length}`);

for (const bad of ["Неправильно", "Ошибка", "Ты ошибся", "Плохо"]) {
  assert.equal(phrases.includes(bad), false, `negative phrase leaked: ${bad}`);
}

assert.ok(phrases.includes('id: "retry-01"'), "retry catalog missing");
assert.ok(!phrases.includes('text: "Нет"'), "retry must not say Нет");

assert.ok(bag.includes("ShuffleBag"), "shuffle-bag missing");
assert.ok(bag.includes("recent"), "recent history missing");
assert.ok(round.includes("takePraiseLine"), "useRound must use praise bag");
assert.ok(round.includes("takeRetryLine"), "useRound must use retry bag");
assert.ok(!round.includes('key: "try-again"'), "old try-again key cycle should be gone");

assert.ok(manager.includes("acquireVoice"), "voice hold missing");
assert.ok(manager.includes("releaseVoice"), "voice release missing");
assert.ok(manager.includes("preserveDuck"), "chained voice ducking missing");

const commonDir = path.join(root, "public/assets/audio/ru/common");
for (const file of ["correct.mp3", "next.mp3", "try-again.mp3", "almost.mp3", "hint.mp3"]) {
  assert.ok(fs.existsSync(path.join(commonDir, file)), `missing bundled voice ${file}`);
}

console.log(
  `verify-voice-phrases: ok praise=${praiseIds.length} retry=${retryIds.length}`
);
