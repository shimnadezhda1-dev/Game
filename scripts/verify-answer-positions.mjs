import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROUNDS = 1000;

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const bundle = await build({
  stdin: {
    contents: [
      'export * from "./src/utils/selectors.ts";',
      'export { LETTERS } from "./src/data/letters.ts";'
    ].join("\n"),
    resolveDir: root,
    loader: "ts"
  },
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  define: { "import.meta.env.DEV": "false" },
  loader: { ".png": "empty", ".webp": "empty", ".jpg": "empty", ".mp3": "empty", ".wav": "empty" },
  logLevel: "silent"
});
const mod = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);
const {
  LETTERS,
  avoidRepeatedCorrectPosition,
  buildListenRoundOptions,
  buildPictureRoundOptions,
  buildRoundOptions,
  glyphOptionPool,
  pictureContentBank
} = mod;

const bank = pictureContentBank(LETTERS);

const activities = {
  find(count) {
    const pool = glyphOptionPool(LETTERS, count);
    const ids = pool.map((letter) => letter.id);
    return pool.map((letter) => () => {
      const result = buildRoundOptions(letter.id, ids, count);
      return result.ok ? { options: result.options, correct: letter.id } : null;
    });
  },
  picture(count) {
    return LETTERS.filter((letter) => letter.contentReady).map((letter) => () => {
      const result = buildPictureRoundOptions(letter.id, letter.upper, bank, count);
      return result.ok ? { options: result.options, correct: result.correctOptionId } : null;
    });
  },
  listen(count) {
    return LETTERS.filter((letter) => letter.contentReady).map((letter) => () => {
      const result = buildListenRoundOptions(letter, bank, LETTERS, count);
      return result.ok ? { options: result.options, correct: result.correctOptionId } : null;
    });
  }
};

function run(makeRounds, count, withMemory) {
  const generators = makeRounds(count);
  const hits = Array(count).fill(0);
  let repeats = 0;
  let previous;
  let produced = 0;
  for (let i = 0; produced < ROUNDS && i < ROUNDS * 20; i += 1) {
    const round = generators[Math.floor(Math.random() * generators.length)]();
    if (!round) {
      continue;
    }
    produced += 1;
    assert.equal(round.options.length, count);
    assert.equal(new Set(round.options).size, count, "duplicate option");
    const options = withMemory
      ? avoidRepeatedCorrectPosition(round.options, round.correct, previous)
      : round.options;
    assert.deepEqual([...options].sort(), [...round.options].sort(), "same option set");
    const index = options.indexOf(round.correct);
    assert.ok(index >= 0, "correct option missing");
    hits[index] += 1;
    if (index === previous) {
      repeats += 1;
    }
    previous = index;
  }
  assert.equal(produced, ROUNDS, "not enough rounds generated");
  return { hits, repeats };
}

const report = [];
for (const [name, makeRounds] of Object.entries(activities)) {
  for (const count of [3, 5, 7]) {
    const raw = run(makeRounds, count, false);
    const played = run(makeRounds, count, true);
    const expected = ROUNDS / count;
    for (const { hits } of [raw, played]) {
      hits.forEach((value, slot) => {
        assert.ok(value > 0, `${name}/${count}: slot ${slot} never gets the answer`);
        assert.ok(
          value > expected * 0.6 && value < expected * 1.4,
          `${name}/${count}: slot ${slot} skewed (${value} vs ~${Math.round(expected)})`
        );
      });
    }
    assert.equal(played.repeats, 0, `${name}/${count}: correct slot repeated in a row`);
    report.push(
      `${name}/${count}: raw ${raw.hits.join("/")} (same slot in a row ${raw.repeats}), ` +
        `in game ${played.hits.join("/")} (same slot in a row ${played.repeats})`
    );
  }
}

// Remaining slots after a repeat are chosen at random, not cycled.
{
  const after = new Map();
  for (let i = 0; i < 3000; i += 1) {
    const moved = avoidRepeatedCorrectPosition(["a", "b", "c"], "a", 0);
    after.set(moved.indexOf("a"), (after.get(moved.indexOf("a")) ?? 0) + 1);
  }
  assert.equal(after.has(0), false);
  assert.ok(after.get(1) > 1200 && after.get(2) > 1200, "avoided slot must be random among the rest");
}

// Options are built once per round: a wrong answer must not reshuffle them.
const useRound = read("src/utils/useRound.ts");
assert.match(useRound, /avoidRepeatedCorrectPosition\(\s*result\.options,/);
assert.match(useRound, /\}, \[target\.id, activeOptionCount, positionSlot\]\);/);
assert.match(read("src/components/FindLetterGame.tsx"), /positionKey: "find"/);
assert.match(read("src/components/PictureLetterGame.tsx"), /positionKey: voiceMode/);

// DOM order is the visual order: no CSS reordering of answer tiles.
const css = read("src/styles.css");
const choiceRules = css.match(/[^{}]*\.(find|picture|listen)-choices?[^{}]*\{[^}]*\}/g) ?? [];
for (const rule of choiceRules) {
  assert.doesNotMatch(rule, /\border\s*:/, `answer tile reordered by CSS: ${rule.trim().slice(0, 80)}`);
  assert.doesNotMatch(rule, /(row|column)-reverse|grid-auto-flow:\s*dense/, "answer tiles reversed");
}
assert.match(css, /\.find-screen \.find-choice:last-child \{\s*grid-column: 1 \/ -1;/);

for (const line of report) {
  console.log(line);
}
console.log("verify-answer-positions: ok");
