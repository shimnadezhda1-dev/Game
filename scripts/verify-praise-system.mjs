/**
 * Inventory + session tests. Mirrors src/audio/phraseBag.ts rules:
 * STREAK_MIN=3, STREAK_GAP=4, four shuffle-bags, missing files never fetched.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const commonDir = path.join(root, "public/assets/audio/ru/common");
const source = fs.readFileSync(path.join(root, "src/audio/voicePhrases.ts"), "utf8");
const bagSrc = fs.readFileSync(path.join(root, "src/audio/phraseBag.ts"), "utf8");
const manager = fs.readFileSync(path.join(root, "src/audio/AudioManager.ts"), "utf8");

const PREFIX = {
  standard: "praise-standard",
  streak: "praise-streak",
  recovery: "praise-recovery",
  retry: "retry-support"
};

function parseCatalog() {
  const rx =
    /phrase\("(standard|streak|recovery|retry)",\s*(\d+),\s*"([^"]+)",\s*"(short|long)"(?:,\s*"([^"]+)")?\)/g;
  const items = [];
  let match;
  while ((match = rx.exec(source))) {
    const pool = match[1];
    const index = Number(match[2]);
    const n = String(index).padStart(2, "0");
    const filename = `${PREFIX[pool]}-${n}.mp3`;
    const id = `${PREFIX[pool].split("-").join("_")}_${n}`;
    const sourceFile = match[5];
    items.push({
      id,
      pool,
      text: match[3],
      pace: match[4],
      filename,
      sourceFile,
      audioStatus: "existing",
      path: `/assets/audio/ru/common/${sourceFile ?? filename}`
    });
  }
  return items;
}

function shuffle(items) {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = next[i];
    next[i] = next[j];
    next[j] = temp;
  }
  return next;
}

class ShuffleBag {
  constructor(all) {
    this.all = all;
    this.order = shuffle(all.slice());
    this.recent = [];
  }
  next(lastId) {
    const limit = Math.min(5, Math.max(1, this.all.length - 1));
    const avoid = new Set(this.recent.slice(-limit));
    if (lastId) {
      avoid.add(lastId);
    }
    let candidates = this.all.filter((phrase) => !avoid.has(phrase.id));
    if (!candidates.length) {
      candidates = this.all.filter((phrase) => phrase.id !== lastId);
    }
    if (!candidates.length) {
      candidates = this.all.slice();
    }
    if (!this.order.length) {
      this.order = shuffle(candidates);
    }
    let index = this.order.findIndex((phrase) => candidates.includes(phrase));
    if (index < 0) {
      this.order = shuffle(candidates);
      index = 0;
    }
    const chosen = this.order.splice(index, 1)[0] ?? candidates[0];
    this.recent.push(chosen.id);
    if (this.recent.length > 8) {
      this.recent.shift();
    }
    return chosen;
  }
}

function parseGirlVariants() {
  const rx =
    /withGirl\(\s*phrase\("(standard|streak|recovery|retry)",\s*(\d+),\s*"([^"]+)",\s*"(short|long)"(?:,\s*"([^"]+)")?\),\s*"([^"]+)",\s*"([^"]+)"\s*\)/g;
  const items = [];
  let match;
  while ((match = rx.exec(source))) {
    const pool = match[1];
    const index = Number(match[2]);
    const n = String(index).padStart(2, "0");
    items.push({
      pool,
      index,
      boyText: match[3],
      girlText: match[6],
      girlFilename: match[7],
      id: `${PREFIX[pool].split("-").join("_")}_${n}`
    });
  }
  return items;
}

function resolvePhraseForPlayer(phrase, preference) {
  if (preference === "girl" && phrase.girl) {
    return {
      ...phrase,
      text: phrase.girl.text,
      filename: phrase.girl.filename,
      path: `/assets/audio/ru/common/${phrase.girl.filename}`
    };
  }
  return phrase;
}

const catalog = parseCatalog();
const girlVariants = parseGirlVariants();
for (const variant of girlVariants) {
  const phrase = catalog.find((item) => item.id === variant.id);
  assert.ok(phrase, `missing gendered catalog item ${variant.id}`);
  phrase.girl = {
    text: variant.girlText,
    filename: variant.girlFilename
  };
}

const byPool = {
  standard: catalog.filter((item) => item.pool === "standard"),
  streak: catalog.filter((item) => item.pool === "streak"),
  recovery: catalog.filter((item) => item.pool === "recovery"),
  retry: catalog.filter((item) => item.pool === "retry")
};

assert.equal(byPool.standard.length, 18);
assert.equal(byPool.streak.length, 6);
assert.equal(byPool.recovery.length, 5);
assert.equal(byPool.retry.length, 11);
assert.equal(catalog.length, 40);
assert.equal(catalog.some((item) => item.id === "retry_support_09"), false);
assert.equal(source.includes("Ещё одна попытка!"), false);
assert.equal(girlVariants.length, 2);

assert.ok(source.includes("Вот это да! Сколько правильных ответов!"));
assert.equal(source.includes("Отличная серия"), false);

for (const phrase of catalog) {
  const diskName = phrase.sourceFile ?? phrase.filename;
  const filePath = path.join(commonDir, diskName);
  assert.ok(fs.existsSync(filePath), `missing audio: ${phrase.id} ${diskName}`);
  const bytes = fs.statSync(filePath).size;
  assert.ok(bytes > 1000, `audio too small: ${phrase.id} ${bytes} bytes`);
}

for (const variant of girlVariants) {
  const filePath = path.join(commonDir, variant.girlFilename);
  assert.ok(fs.existsSync(filePath), `missing girl audio: ${variant.girlFilename}`);
  const bytes = fs.statSync(filePath).size;
  assert.ok(bytes > 1000, `girl audio too small: ${variant.girlFilename} ${bytes} bytes`);
}

assert.equal(fs.existsSync(path.join(commonDir, "retry-support-09.mp3")), false);

const recovery03 = catalog.find((item) => item.id === "praise_recovery_03");
const recovery04 = catalog.find((item) => item.id === "praise_recovery_04");
assert.equal(recovery03.text, "Здорово! Ты справился!");
assert.equal(recovery04.text, "Отлично! Ты нашёл правильный ответ!");
assert.equal(resolvePhraseForPlayer(recovery03, "boy").text, "Здорово! Ты справился!");
assert.equal(resolvePhraseForPlayer(recovery03, "boy").filename, "praise-recovery-03.mp3");
assert.equal(resolvePhraseForPlayer(recovery03, null).filename, "praise-recovery-03.mp3");
assert.equal(resolvePhraseForPlayer(recovery03, "girl").filename, "praise-recovery-03-girl.mp3");
assert.equal(resolvePhraseForPlayer(recovery03, "girl").text, "Здорово! Ты справилась!");
assert.equal(resolvePhraseForPlayer(recovery04, "boy").text, "Отлично! Ты нашёл правильный ответ!");
assert.equal(resolvePhraseForPlayer(recovery04, "boy").filename, "praise-recovery-04.mp3");
assert.equal(resolvePhraseForPlayer(recovery04, "girl").filename, "praise-recovery-04-girl.mp3");
assert.equal(resolvePhraseForPlayer(recovery04, "girl").text, "Отлично! Ты нашла правильный ответ!");
assert.notEqual(resolvePhraseForPlayer(recovery03, "girl").filename, "praise-recovery-03.mp3");
assert.notEqual(resolvePhraseForPlayer(recovery04, "girl").filename, "praise-recovery-04.mp3");
assert.notEqual(resolvePhraseForPlayer(recovery03, "boy").filename, "praise-recovery-03-girl.mp3");
assert.notEqual(resolvePhraseForPlayer(recovery04, "boy").filename, "praise-recovery-04-girl.mp3");
assert.deepEqual(
  girlVariants.map((item) => item.id).sort(),
  ["praise_recovery_03", "praise_recovery_04"]
);
assert.ok(bagSrc.includes("setPraisePlayerPreference"));
assert.ok(bagSrc.includes("resolvePhraseForPlayer"));
assert.ok(bagSrc.includes('preference === "girl"'));

const existingPraise = byPool.standard.filter((item) => item.audioStatus === "existing");
const existingRetry = byPool.retry.filter((item) => item.audioStatus === "existing");
assert.ok(existingPraise.length >= 2, "need bundled praise fallbacks");
assert.ok(existingRetry.length >= 3, "need bundled retry fallbacks");

function createSession() {
  const bags = {
    standard: new ShuffleBag(byPool.standard),
    streak: new ShuffleBag(byPool.streak),
    recovery: new ShuffleBag(byPool.recovery),
    retry: new ShuffleBag(byPool.retry)
  };
  let correctStreak = 0;
  let lastStreakAt = -999;
  let lastPlayedId = "";
  let lastPlayedPath = "";

  function playable(logical, kind) {
    if (logical.audioStatus === "existing" && logical.path !== lastPlayedPath) {
      return logical;
    }
    const pool = kind === "retry" ? existingRetry : existingPraise;
    return pool.find((item) => item.path !== lastPlayedPath) ?? pool[0];
  }

  function emit(logical, kind) {
    const audio = playable(logical, kind);
    lastPlayedId = logical.id;
    lastPlayedPath = audio.path;
    return { ...logical, path: audio.path };
  }

  return {
    takePraise(recovered) {
      if (recovered) {
        correctStreak = 1;
        return emit(bags.recovery.next(lastPlayedId), "praise");
      }
      correctStreak += 1;
      if (correctStreak >= 3 && correctStreak - lastStreakAt >= 4) {
        lastStreakAt = correctStreak;
        return emit(bags.streak.next(lastPlayedId), "praise");
      }
      return emit(bags.standard.next(lastPlayedId), "praise");
    },
    takeRetry() {
      correctStreak = 0;
      return emit(bags.retry.next(lastPlayedId), "retry");
    },
    streak() {
      return correctStreak;
    }
  };
}

function publicFile(rel) {
  return fs.existsSync(path.join(root, "public", rel.replace(/^\//, "")));
}

const session1 = createSession();
const ten = Array.from({ length: 10 }, () => session1.takePraise(false));
for (let i = 1; i < ten.length; i += 1) {
  assert.notEqual(ten[i].id, ten[i - 1].id, `TEST 1 consecutive repeat ${ten[i].id}`);
}
assert.ok(new Set(ten.map((line) => line.id)).size >= 2, "TEST 1 variety");
assert.ok(ten.every((line) => line.pool === "standard" || line.pool === "streak"));
assert.ok(ten.every((line) => publicFile(line.path)), "TEST 1 existing files only");
console.log("TEST 1 PASS", ten.map((line) => `${line.pool}:${line.id}`).join(" → "));

const session2 = createSession();
const retry = session2.takeRetry();
assert.equal(retry.pool, "retry");
assert.equal(session2.streak(), 0);
assert.ok(!/неправильно|ошибка|ты ошибся|плохо|неверно|ты не угадал|^нет$/i.test(retry.text));
assert.ok(publicFile(retry.path));
console.log("TEST 2 PASS", retry.id, retry.text);

const session3 = createSession();
session3.takeRetry();
const recovered = session3.takePraise(true);
assert.equal(recovered.pool, "recovery", `TEST 3 expected recovery, got ${recovered.pool}`);
assert.equal(session3.streak(), 1);
assert.ok(publicFile(recovered.path));
console.log("TEST 3 PASS", recovered.id, recovered.text);

const session4 = createSession();
const four = Array.from({ length: 4 }, () => session4.takePraise(false));
assert.ok(
  four.some((line) => line.pool === "streak"),
  `TEST 4 expected streak, got ${four.map((line) => line.pool).join(",")}`
);
console.log("TEST 4 PASS", four.map((line) => line.pool).join(" → "));

assert.ok(bagSrc.includes("stopSpeaking") === false);
assert.ok(manager.includes("this.stopSpeaking({ preserveDuck: true })"));
assert.ok(manager.includes("const replacing = this.voiceBusy"));
assert.ok(manager.includes("this.clip = audio"));
assert.ok(manager.includes("isVoiceBusy"));
console.log("TEST 5 PASS voice overlap: single clip + stop before play");

assert.ok(manager.includes("backgroundMusic.duck()"));
assert.ok(manager.includes("backgroundMusic.unduck()"));
assert.ok(manager.includes("acquireVoice"));
assert.ok(manager.includes("releaseVoice"));
console.log("TEST 6 PASS ducking via existing VOICE hold");

function drawRecovery(preference, times) {
  const bag = new ShuffleBag(byPool.recovery);
  const lines = [];
  let lastId = "";
  for (let i = 0; i < times; i += 1) {
    const logical = resolvePhraseForPlayer(bag.next(lastId), preference);
    lastId = logical.id;
    lines.push(logical);
  }
  return lines;
}

for (const phrase of byPool.recovery) {
  const boyLine = resolvePhraseForPlayer(phrase, "boy");
  const girlLine = resolvePhraseForPlayer(phrase, "girl");
  if (phrase.id === "praise_recovery_03" || phrase.id === "praise_recovery_04") {
    assert.equal(boyLine.filename.includes("-girl"), false, `${phrase.id} boy must not use girl file`);
    assert.ok(girlLine.filename.endsWith("-girl.mp3"), `${phrase.id} girl must use girl file`);
    assert.notEqual(boyLine.filename, girlLine.filename);
    assert.notEqual(boyLine.text, girlLine.text);
  } else {
    assert.equal(boyLine.filename, girlLine.filename, `${phrase.id} must stay universal`);
    assert.equal(boyLine.text, girlLine.text, `${phrase.id} must stay universal`);
  }
}

const boyDraws = drawRecovery("boy", 20);
const girlDraws = drawRecovery("girl", 20);
assert.equal(
  boyDraws.some((line) => line.filename.includes("-girl")),
  false,
  "boy recovery must never play a girl file"
);
assert.equal(
  girlDraws
    .filter((line) => line.id === "praise_recovery_03" || line.id === "praise_recovery_04")
    .every((line) => line.filename.endsWith("-girl.mp3")),
  true,
  "girl recovery 03/04 must never play the boy file"
);
assert.ok(boyDraws.some((line) => line.id === "praise_recovery_03"));
assert.ok(boyDraws.some((line) => line.id === "praise_recovery_04"));
assert.ok(girlDraws.some((line) => line.id === "praise_recovery_03"));
assert.ok(girlDraws.some((line) => line.id === "praise_recovery_04"));
console.log("TEST 7 PASS boy/girl recovery files never mix");

const missing = catalog.filter((item) => item.audioStatus === "missing");
console.log(
  `verify-praise-system: ok phrases=${catalog.length} existing=${catalog.length - missing.length} missing=${missing.length} retry=${byPool.retry.length} girl=${girlVariants.length}`
);
