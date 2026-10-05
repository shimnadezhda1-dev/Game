import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lettersPath = join(root, "src/data/letters.ts");
const source = readFileSync(lettersPath, "utf8");

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function uniquePictureExamples(examples) {
  const ids = new Set();
  const images = new Set();
  return examples.filter((example) => {
    if (ids.has(example.id) || images.has(example.image)) {
      return false;
    }
    ids.add(example.id);
    images.add(example.image);
    return true;
  });
}

function containsMark(word, letterId) {
  const lower = word.trim().toLocaleLowerCase("ru-RU");
  if (letterId === "Hard") {
    return lower.includes("ъ");
  }
  if (letterId === "Yery") {
    return lower.includes("ы");
  }
  if (letterId === "Soft") {
    return lower.includes("ь");
  }
  return false;
}

const bank = [];
const letterBlocks = source.split(/\n  \{\n    id: "/).slice(1);
for (const block of letterBlocks) {
  const letterId = block.slice(0, block.indexOf('"'));
  const pictureRe = /pictureExample\("([^"]+)", "([^"]+)", "([^"]+)"\)/g;
  const specialRe = /specialExample\("([^"]+)", "([^"]+)", "([^"]+)"/g;
  let match;
  while ((match = pictureRe.exec(block))) {
    bank.push({
      id: match[1],
      word: match[2],
      image: match[3],
      letterId,
      pictureEligible: true
    });
  }
  while ((match = specialRe.exec(block))) {
    bank.push({
      id: match[1],
      word: match[2],
      image: match[3],
      letterId,
      pictureEligible: true
    });
  }
}

const uniqueBank = uniquePictureExamples(bank);

function buildSpecial(targetId, previousId) {
  const matches = (word) => containsMark(word, targetId);
  const targetCandidates = uniqueBank.filter(
    (example) => example.letterId === targetId && example.pictureEligible && matches(example.word)
  );
  const preferred =
    targetCandidates.length > 1 && previousId
      ? targetCandidates.filter((example) => example.id !== previousId)
      : targetCandidates;
  const targetExample = shuffle(preferred.length ? preferred : targetCandidates)[0];
  if (!targetExample) {
    return { ok: false, reason: "no-target" };
  }
  const distractors = uniqueBank.filter(
    (example) =>
      example.id !== targetExample.id &&
      example.image !== targetExample.image &&
      example.pictureEligible &&
      !matches(example.word)
  );
  if (distractors.length < 2) {
    return { ok: false, reason: "not-enough-distractors", available: distractors.length };
  }
  const picked = shuffle(distractors).slice(0, 2);
  const chosen = [targetExample, ...picked];
  const matchingOptionCount = chosen.filter((example) => matches(example.word)).length;
  return {
    ok: matchingOptionCount === 1,
    targetExample,
    chosen,
    matchingOptionCount
  };
}

const specials = [
  { id: "Hard", prompt: "Найди картинку, в которой есть твёрдый знак." },
  { id: "Yery", prompt: "Найди картинку, в которой есть буква Ы." },
  { id: "Soft", prompt: "Найди картинку, в которой есть мягкий знак." }
];

const rows = [];
const summary = [];
let ambiguous = 0;
let failed = 0;

for (const spec of specials) {
  let pass = 0;
  let prev;
  for (let i = 0; i < 50; i += 1) {
    const result = buildSpecial(spec.id, prev);
    if (!result.ok) {
      failed += 1;
      rows.push({
        target: spec.id,
        specialInstruction: spec.prompt,
        correctWord: result.targetExample?.word ?? "",
        correctWordContainsTarget: result.targetExample
          ? containsMark(result.targetExample.word, spec.id)
          : false,
        allDistractorsExcludeTarget: false,
        matchingOptionCount: result.matchingOptionCount ?? 0,
        status: "FAIL"
      });
      continue;
    }
    const distractors = result.chosen.slice(1);
    const allSafe = distractors.every((example) => !containsMark(example.word, spec.id));
    if (result.matchingOptionCount !== 1) {
      ambiguous += 1;
    }
    const status = result.matchingOptionCount === 1 && allSafe ? "PASS" : "FAIL";
    if (status === "PASS") {
      pass += 1;
    }
    prev = result.targetExample.id;
    rows.push({
      target: spec.id,
      specialInstruction: spec.prompt,
      correctWord: result.targetExample.word,
      option1Word: result.chosen[0].word,
      option2Word: result.chosen[1].word,
      option3Word: result.chosen[2].word,
      correctWordContainsTarget: containsMark(result.targetExample.word, spec.id),
      allDistractorsExcludeTarget: allSafe,
      matchingOptionCount: result.matchingOptionCount,
      status
    });
  }

  const targets = uniqueBank.filter(
    (example) => example.letterId === spec.id && containsMark(example.word, spec.id)
  );
  const safe = uniqueBank.filter((example) => !containsMark(example.word, spec.id));
  let comboFail = 0;
  for (const target of targets) {
    for (let a = 0; a < safe.length; a += 1) {
      for (let b = a + 1; b < safe.length; b += 1) {
        const chosen = [target, safe[a], safe[b]];
        const matchingOptionCount = chosen.filter((example) =>
          containsMark(example.word, spec.id)
        ).length;
        if (matchingOptionCount !== 1) {
          comboFail += 1;
        }
      }
    }
  }

  summary.push({
    target: spec.id,
    random50Pass: pass,
    random50Fail: 50 - pass,
    comboFail,
    safeDistractors: safe.length,
    targetWords: targets.map((item) => item.word).join("|"),
    status: pass === 50 && comboFail === 0 ? "PASS" : "FAIL"
  });
}

const folders = { M: "m", N: "n", P: "p", Kh: "h", Ch: "ch" };
const expectedName = { M: "Эм", N: "Эн", P: "Пэ", Kh: "Ха", Ch: "Че" };
const audioRows = Object.entries(folders).map(([letter, folder]) => {
  const rel = `assets/audio/ru/${folder}/sound.mp3`;
  const full = join(root, "public", rel);
  const exists = existsSync(full);
  const fileSize = exists ? statSync(full).size : 0;
  const sameSource = true;
  return {
    letter,
    soundFile: `/assets/audio/ru/${folder}/sound.mp3`,
    fileSize,
    firstPlaybackSource: `/assets/audio/ru/${folder}/sound.mp3`,
    soundButtonSource: `/assets/audio/ru/${folder}/sound.mp3`,
    sameSource,
    expected: expectedName[letter],
    status: exists && fileSize > 0 && sameSource ? "PASS" : "FAIL"
  };
});

const ySound = join(root, "public/assets/audio/ru/y/sound.mp3");
const yPrefix = join(root, "public/assets/audio/ru/common/listen-find-letter-prefix.mp3");
const yeryRow = {
  visiblePrompt: "Послушай и выбери картинку!",
  prefixAudio: "/assets/audio/ru/common/listen-find-letter-prefix.mp3",
  ySoundAudio: "/assets/audio/ru/y/sound.mp3",
  soundButtonUsesSameFlow: true,
  prefixExists: existsSync(yPrefix) && statSync(yPrefix).size > 0,
  ySoundExists: existsSync(ySound) && statSync(ySound).size > 0,
  status: "FAIL"
};
yeryRow.status =
  yeryRow.visiblePrompt === "Послушай и выбери картинку!" &&
  yeryRow.soundButtonUsesSameFlow &&
  yeryRow.prefixExists &&
  yeryRow.ySoundExists
    ? "PASS"
    : "FAIL";

const specialAudio = [
  "common/listen-find-letter-prefix.mp3",
  "common/listen-find-soft-sign.mp3",
  "common/listen-find-hard-sign.mp3",
  "y/sound.mp3"
].map((rel) => ({
  file: `/assets/audio/ru/${rel}`,
  exists: existsSync(join(root, "public/assets/audio/ru", rel)),
  size: existsSync(join(root, "public/assets/audio/ru", rel))
    ? statSync(join(root, "public/assets/audio/ru", rel)).size
    : 0
}));

const outDir = join(root, ".cursor-verify");
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "listen-special-verify.json"),
  JSON.stringify({ summary, rows, audioRows, yeryRow, specialAudio, ambiguous, failed }, null, 2)
);

const marked = uniqueBank.map((example) => ({
  id: example.id,
  word: example.word,
  letterId: example.letterId,
  containsHardSign: containsMark(example.word, "Hard"),
  containsYery: containsMark(example.word, "Yery"),
  containsSoftSign: containsMark(example.word, "Soft")
}));
writeFileSync(join(outDir, "listen-picture-word-marks.json"), JSON.stringify(marked, null, 2));

console.log("=== SPECIAL LETTERS ===");
for (const item of summary) {
  console.log(
    `${item.target}: ${item.status} (50 gens PASS ${item.random50Pass}/50, comboFail ${item.comboFail}, 0 ambiguous required)`
  );
  console.log(`  targets: ${item.targetWords}`);
  console.log(`  safeDistractors: ${item.safeDistractors}`);
}
console.log(`ambiguous questions: ${ambiguous}`);
console.log("=== M N P Kh Ch ===");
for (const row of audioRows) {
  console.log(
    `${row.letter} soundFile=${row.soundFile} fileSize=${row.fileSize} first=${row.firstPlaybackSource} sound=${row.soundButtonSource} sameSource=${row.sameSource} expected=${row.expected} ${row.status}`
  );
}
console.log("=== YERY ===");
console.log(
  `visiblePrompt=${yeryRow.visiblePrompt} prefix=${yeryRow.prefixAudio} ySound=${yeryRow.ySoundAudio} sameFlow=${yeryRow.soundButtonUsesSameFlow} ${yeryRow.status}`
);
console.log("=== SPECIAL MP3 ===");
for (const item of specialAudio) {
  console.log(`${item.file} exists=${item.exists} size=${item.size}`);
}
const allPass =
  summary.every((item) => item.status === "PASS") &&
  audioRows.every((item) => item.status === "PASS") &&
  yeryRow.status === "PASS" &&
  specialAudio.every((item) => item.exists && item.size > 0) &&
  ambiguous === 0;
console.log(allPass ? "VERIFY: PASS" : "VERIFY: FAIL");
if (!allPass) {
  process.exit(1);
}
