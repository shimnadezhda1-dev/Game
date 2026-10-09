import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const phrases = fs.readFileSync(path.join(root, "src/audio/voicePhrases.ts"), "utf8");
const bag = fs.readFileSync(path.join(root, "src/audio/phraseBag.ts"), "utf8");
const manager = fs.readFileSync(path.join(root, "src/audio/AudioManager.ts"), "utf8");
const round = fs.readFileSync(path.join(root, "src/utils/useRound.ts"), "utf8");
const app = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");

function countPool(pool) {
  return [...phrases.matchAll(new RegExp(`phrase\\("${pool}"`, "g"))].length;
}

const standard = countPool("standard");
const streak = countPool("streak");
const recovery = countPool("recovery");
const retry = countPool("retry");

assert.equal(standard, 18, `standard pool size ${standard}`);
assert.equal(streak, 6, `streak pool size ${streak}`);
assert.equal(recovery, 5, `recovery pool size ${recovery}`);
assert.equal(retry, 11, `retry pool size ${retry}`);
assert.equal(standard + streak + recovery + retry, 40, "logical active phrases");

assert.equal(phrases.includes("Ещё одна попытка!"), false);
assert.equal(phrases.includes('phrase("retry", 9,'), false);
assert.equal(phrases.includes("retry_support_09"), false);
assert.ok(phrases.includes("Здорово! Ты справился!"));
assert.ok(phrases.includes("Отлично! Ты нашёл правильный ответ!"));
assert.ok(phrases.includes("Здорово! Ты справилась!"));
assert.ok(phrases.includes("Отлично! Ты нашла правильный ответ!"));
assert.ok(phrases.includes("praise-recovery-03-girl.mp3"));
assert.ok(phrases.includes("praise-recovery-04-girl.mp3"));
assert.equal((phrases.match(/withGirl\(\s*phrase\(/g) || []).length, 2);
assert.ok(bag.includes("setPraisePlayerPreference"));
assert.ok(bag.includes("resolvePhraseForPlayer"));
assert.ok(bag.includes('preference === "girl"'));
assert.ok(bag.includes("playerPreference"));
assert.ok(app.includes("setPraisePlayerPreference(progress.playerPreference)"));
assert.ok(app.includes("setPraisePlayerPreference(playerPreference)"));

const banned = [
  "Неправильно",
  "Ошибка",
  "Ты ошибся",
  "Плохо",
  "Неверно",
  "Ты не угадал",
  "Ты самый умный",
  "Ты лучше всех",
  "Какой ты умный"
];
for (const bad of banned) {
  assert.equal(phrases.includes(bad), false, `negative phrase leaked: ${bad}`);
}
assert.ok(!phrases.includes('text: "Нет"'), "retry must not say Нет");
assert.ok(phrases.includes("Вот это да! Сколько правильных ответов!"));
assert.equal(phrases.includes("Отличная серия"), false);

assert.ok(bag.includes("ShuffleBag"), "shuffle-bag missing");
assert.ok(bag.includes("recent"), "recent history missing");
assert.ok(bag.includes("PRAISE_STREAK"), "streak pool wiring missing");
assert.ok(bag.includes("PRAISE_RECOVERY"), "recovery pool wiring missing");
assert.ok(bag.includes("RETRY_SUPPORT"), "retry pool wiring missing");
assert.ok(bag.includes("STREAK_MIN"), "streak threshold missing");
assert.ok(round.includes("takePraiseLine"), "useRound must use praise bag");
assert.ok(round.includes("takeRetryLine"), "useRound must use retry bag");
assert.ok(round.includes("takePraiseLine(wrongCount > 0)"), "recovery uses wrongCount");
assert.ok(!round.includes('key: "try-again"'), "old try-again key cycle should be gone");

assert.ok(manager.includes("acquireVoice"), "voice hold missing");
assert.ok(manager.includes("releaseVoice"), "voice release missing");
assert.ok(manager.includes("preserveDuck"), "chained voice ducking missing");
assert.ok(manager.includes("stopSpeaking({ preserveDuck: true })"), "voice replace must keep duck");

const commonDir = path.join(root, "public/assets/audio/ru/common");
for (const file of [
  "correct.mp3",
  "next.mp3",
  "try-again.mp3",
  "almost.mp3",
  "hint.mp3",
  "praise-recovery-03.mp3",
  "praise-recovery-04.mp3",
  "praise-recovery-03-girl.mp3",
  "praise-recovery-04-girl.mp3"
]) {
  assert.ok(fs.existsSync(path.join(commonDir, file)), `missing bundled voice ${file}`);
}
assert.equal(fs.existsSync(path.join(commonDir, "retry-support-09.mp3")), false);

console.log(
  `verify-voice-phrases: ok standard=${standard} streak=${streak} recovery=${recovery} retry=${retry}`
);
