import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
    keys: () => [...map.keys()]
  };
}

const storage = createMemoryStorage();
globalThis.localStorage = storage;

const bundle = await build({
  stdin: {
    contents: [
      'export * from "./src/entitlement/entitlement.ts";',
      'export { EntitlementService } from "./src/entitlement/EntitlementService.ts";',
      'export { MockPurchaseProvider, MOCK_PURCHASE_KEY, MOCK_OVERRIDE_KEY } from "./src/entitlement/MockPurchaseProvider.ts";',
      'export { UnavailablePurchaseProvider } from "./src/entitlement/PurchaseProvider.ts";',
      'export { recentAnalyticsEvents } from "./src/entitlement/analytics.ts";',
      'export { LETTERS, contentReadyLetters } from "./src/data/letters.ts";',
      'export { playLetterPool, letterAllowsActivity, shuffleLetterDeck, advanceLetterDeck, PLAY_ACTIVITIES } from "./src/utils/playSettings.ts";',
      'export { nextLetterIndex } from "./src/utils/letterProgress.ts";',
      'export { loadProgress, saveProgress } from "./src/utils/storage.ts";',
      'export { buildRoundOptions, avoidRepeatedCorrectPosition, glyphOptionPool, pictureContentBank, buildPictureRoundOptions, buildListenRoundOptions, availableOptionCounts } from "./src/utils/selectors.ts";',
      'export { resetActivityLetter, activityLetterId } from "./src/utils/activityProgress.ts";',
      'export { TRIAL_VOICE_CLIPS, speakLockedFeatureHint, LOCKED_HINT_COOLDOWN_MS } from "./src/audio/trialVoice.ts";',
      'export { audioManager as stubAudioManager } from "./src/audio/AudioManager.ts";'
    ].join("\n"),
    resolveDir: root,
    loader: "ts"
  },
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  define: { "import.meta.env.DEV": "false", "import.meta.glob": "globalThis.__verifyGlob" },
  banner: { js: "globalThis.__verifyGlob = () => ({});" },
  loader: { ".png": "empty", ".webp": "empty", ".jpg": "empty", ".mp3": "empty", ".wav": "empty" },
  plugins: [
    {
      name: "stub-audio-manager",
      setup(pluginBuild) {
        pluginBuild.onResolve({ filter: /AudioManager(\.ts)?$/ }, () => ({
          path: "audio-manager-stub",
          namespace: "stub"
        }));
        pluginBuild.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
          contents: `
            export const audioManager = {
              busy: false,
              last: "",
              played: [],
              isVoiceBusy() { return this.busy; },
              lastPlayedPath() { return this.last; },
              playVoice(path) { this.played.push(path); this.last = path; this.busy = true; },
              stopSpeaking() { this.busy = false; }
            };`,
          loader: "js"
        }));
      }
    }
  ],
  logLevel: "silent"
});
const mod = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);
const {
  TRIAL_LETTERS,
  allowedLettersFor,
  canAccessLetterFor,
  EntitlementService,
  MockPurchaseProvider,
  MOCK_PURCHASE_KEY,
  UnavailablePurchaseProvider,
  recentAnalyticsEvents,
  LETTERS,
  contentReadyLetters,
  playLetterPool,
  letterAllowsActivity,
  shuffleLetterDeck,
  advanceLetterDeck,
  PLAY_ACTIVITIES,
  nextLetterIndex,
  loadProgress,
  saveProgress,
  canUseOptionCount,
  canUseStudyOrder,
  canUseLetterCategory,
  effectivePlaySettings,
  LOCKED_FEATURE_MESSAGES,
  buildRoundOptions,
  avoidRepeatedCorrectPosition,
  glyphOptionPool,
  pictureContentBank,
  buildPictureRoundOptions,
  buildListenRoundOptions,
  availableOptionCounts,
  nextTrialActivity,
  resetActivityLetter,
  activityLetterId,
  TRIAL_VOICE_CLIPS,
  speakLockedFeatureHint,
  LOCKED_HINT_COOLDOWN_MS,
  stubAudioManager
} = mod;

const ids = (letters) => letters.map((letter) => letter.id);
const TRIAL_IDS = ["A", "B", "V", "G", "D"];
let checks = 0;
function check(name, fn) {
  fn();
  checks += 1;
  console.log(`ok - ${name}`);
}

// --- Letters per entitlement ---
const trialLetters = allowedLettersFor(LETTERS, "trial");
const fullLetters = allowedLettersFor(LETTERS, "full");

check("TRIAL_LETTERS is А, Б, В, Г, Д", () => {
  assert.deepEqual([...TRIAL_LETTERS], ["А", "Б", "В", "Г", "Д"]);
});
check("trial letters resolve to A, B, V, G, D", () => {
  assert.deepEqual(ids(trialLetters), TRIAL_IDS);
});
check("full letters are the whole alphabet (33)", () => {
  assert.equal(fullLetters.length, 33);
  assert.deepEqual(ids(fullLetters), ids(LETTERS));
});
check("locked letters: trial blocks Е–Я, full blocks none", () => {
  const letter = (id) => LETTERS.find((item) => item.id === id);
  assert.equal(canAccessLetterFor("trial", letter("A")), true);
  assert.equal(canAccessLetterFor("trial", letter("D")), true);
  for (const item of LETTERS.slice(5)) {
    assert.equal(canAccessLetterFor("trial", item), false, item.upper);
    assert.equal(canAccessLetterFor("full", item), true, item.upper);
  }
});

// --- Pools used by the existing pipeline ---
function pool(entitlement, category, activity) {
  return playLetterPool(contentReadyLetters(allowedLettersFor(LETTERS, entitlement)), category).filter(
    (letter) => letterAllowsActivity(letter, activity)
  );
}

check("category system intact on trial letters: all → А–Д, vowels → А, consonants → Б–Д", () => {
  assert.deepEqual(ids(pool("trial", "all", "learn")), TRIAL_IDS);
  assert.deepEqual(ids(pool("trial", "vowels", "learn")), ["A"]);
  assert.deepEqual(ids(pool("trial", "consonants", "learn")), ["B", "V", "G", "D"]);
});
check("trial activities 1–4 target only А–Д", () => {
  for (const activity of PLAY_ACTIVITIES) {
    const letters = pool("trial", "all", activity);
    assert.ok(letters.length > 0, activity);
    assert.ok(letters.every((letter) => TRIAL_IDS.includes(letter.id)), activity);
  }
});
check("full activities keep the previous pools", () => {
  for (const activity of PLAY_ACTIVITIES) {
    const before = playLetterPool(contentReadyLetters(LETTERS), "all").filter((letter) =>
      letterAllowsActivity(letter, activity)
    );
    assert.deepEqual(ids(pool("full", "all", activity)), ids(before), activity);
  }
});
check("trial random order stays inside А–Д", () => {
  const base = pool("trial", "all", "find");
  let deck = shuffleLetterDeck(base);
  let index = 0;
  for (let step = 0; step < 500; step += 1) {
    assert.ok(TRIAL_IDS.includes(deck[index].id));
    const advanced = advanceLetterDeck(deck, index, base);
    assert.ok(advanced);
    deck = advanced.deck;
    index = advanced.index;
  }
});
check("full random order uses the full set", () => {
  const base = pool("full", "all", "find");
  const seen = new Set();
  let deck = shuffleLetterDeck(base);
  let index = 0;
  for (let step = 0; step < base.length * 6; step += 1) {
    seen.add(deck[index].id);
    const advanced = advanceLetterDeck(deck, index, base);
    deck = advanced.deck;
    index = advanced.index;
  }
  assert.ok([...seen].some((id) => !TRIAL_IDS.includes(id)));
});
check("alphabetical: trial ends after Д (no Е), full goes Д → Е", () => {
  const trial = pool("trial", "all", "learn");
  assert.equal(nextLetterIndex(trial.length - 1, trial.length), null);
  assert.equal(trial[trial.length - 1].id, "D");
  const full = pool("full", "all", "learn");
  const dIndex = full.findIndex((letter) => letter.id === "D");
  assert.equal(full[nextLetterIndex(dIndex, full.length)].id, "E");
});

// --- Difficulty, order and categories per entitlement ---
check("trial levels: Лёгкий and Средний open, Сложный locked; full opens all three", () => {
  assert.equal(canUseOptionCount("trial", 3), true);
  assert.equal(canUseOptionCount("trial", 5), true);
  assert.equal(canUseOptionCount("trial", 7), false);
  for (const count of [3, 5, 7]) {
    assert.equal(canUseOptionCount("full", count), true, String(count));
  }
  assert.equal(LOCKED_FEATURE_MESSAGES.hardLevel, "Сложный уровень откроется в полной версии");
});
check("trial order: alphabet and pick open, random locked; full opens all", () => {
  assert.equal(canUseStudyOrder("trial", "alpha"), true);
  assert.equal(canUseStudyOrder("trial", "pick"), true);
  assert.equal(canUseStudyOrder("trial", "random"), false);
  for (const order of ["alpha", "random", "pick"]) {
    assert.equal(canUseStudyOrder("full", order), true, order);
  }
});
check("trial categories: only «Все буквы»; full opens all", () => {
  assert.equal(canUseLetterCategory("trial", "all"), true);
  assert.equal(canUseLetterCategory("trial", "vowels"), false);
  assert.equal(canUseLetterCategory("trial", "consonants"), false);
  for (const category of ["all", "vowels", "consonants"]) {
    assert.equal(canUseLetterCategory("full", category), true, category);
  }
});
check("saved hard/random/vowels run as Средний/alphabet/all in trial, untouched in full", () => {
  const saved = { optionCount: 7, studyOrder: "random", letterCategory: "vowels" };
  assert.deepEqual(effectivePlaySettings("trial", saved), {
    optionCount: 5,
    studyOrder: "alpha",
    letterCategory: "all"
  });
  assert.deepEqual(effectivePlaySettings("full", saved), saved);
  const allowed = { optionCount: 3, studyOrder: "pick", letterCategory: "all" };
  assert.deepEqual(effectivePlaySettings("trial", allowed), allowed);
});

// --- Answer options ---
function simulateGlyphRounds(entitlement, count, rounds = 600) {
  const catalog = allowedLettersFor(LETTERS, entitlement);
  const optionPool = glyphOptionPool(catalog, count).map((letter) => letter.id);
  const targets = pool(entitlement, "all", "find");
  const positions = new Set();
  const used = new Set();
  let previous;
  let repeats = 0;
  for (let round = 0; round < rounds; round += 1) {
    const target = targets[round % targets.length];
    const built = buildRoundOptions(target.id, optionPool, count);
    assert.ok(built.ok, `${entitlement} ${count} ${target.id}`);
    const options = avoidRepeatedCorrectPosition(built.options, target.id, previous);
    assert.equal(options.length, count);
    assert.equal(new Set(options).size, count);
    const index = options.indexOf(target.id);
    if (index === previous) repeats += 1;
    previous = index;
    positions.add(index);
    options.forEach((id) => used.add(id));
  }
  return { positions, used, repeats };
}

for (const count of [3, 5]) {
  check(`trial «Найди букву» ${count} options: only А–Д, every slot gets the answer`, () => {
    const { positions, used, repeats } = simulateGlyphRounds("trial", count);
    assert.ok([...used].every((id) => TRIAL_IDS.includes(id)), [...used].join(","));
    assert.deepEqual([...positions].sort(), Array.from({ length: count }, (_, i) => i));
    assert.equal(repeats, 0);
  });
}
check("full «Найди букву» still mixes the whole alphabet on all three levels", () => {
  for (const count of [3, 5, 7]) {
    const { positions, used } = simulateGlyphRounds("full", count);
    assert.ok([...used].some((id) => !TRIAL_IDS.includes(id)), String(count));
    assert.equal(positions.size, count);
  }
});

const trialBank = pictureContentBank(trialLetters);
const trialBankLetterIds = new Set(trialBank.map((example) => example.letterId));
check("trial picture bank holds only А–Д pictures", () => {
  assert.ok(trialBank.length > 0);
  assert.ok([...trialBankLetterIds].every((id) => TRIAL_IDS.includes(id)));
});
for (const [activity, buildFor] of [
  [
    "picture",
    (letter, count) => buildPictureRoundOptions(letter.id, letter.upper, trialBank, count)
  ],
  ["listen", (letter, count) => buildListenRoundOptions(letter, trialBank, trialLetters, count)]
]) {
  for (const count of [3, 5]) {
    check(`trial «${activity}» ${count} options: only А–Д pictures, answer moves around`, () => {
      const byId = new Map(trialBank.map((example) => [example.id, example]));
      const targets = pool("trial", "all", activity);
      const positions = new Set();
      let previous;
      for (let round = 0; round < 400; round += 1) {
        const letter = targets[round % targets.length];
        const result = buildFor(letter, count);
        assert.ok(result.ok, `${activity} ${count} ${letter.id}`);
        const options = avoidRepeatedCorrectPosition(result.options, result.correctOptionId, previous);
        for (const id of options) {
          assert.ok(TRIAL_IDS.includes(byId.get(id)?.letterId), `${activity} ${id}`);
        }
        previous = options.indexOf(result.correctOptionId);
        positions.add(previous);
      }
      assert.equal(positions.size, count);
    });
  }
}
check("trial supports Лёгкий and Средний with А–Д content; full keeps its levels", () => {
  const trialCounts = availableOptionCounts(trialLetters);
  assert.ok(trialCounts.includes(3) && trialCounts.includes(5), trialCounts.join(","));
  assert.deepEqual(availableOptionCounts(fullLetters), availableOptionCounts(LETTERS));
  assert.ok(availableOptionCounts(fullLetters).includes(7));
});

// --- Source wiring ---
const app = read("src/App.tsx");
const adventure = read("src/components/AdventurePlay.tsx");
const picker = read("src/components/LetterPickGrid.tsx");
const trialComplete = read("src/components/TrialCompleteScreen.tsx");
const parentScreen = read("src/components/ParentScreen.tsx");
const parentGate = read("src/components/ParentGate.tsx");
const entitlementIndex = read("src/entitlement/index.ts");

check("App feeds allowedLetters into the existing pools", () => {
  assert.match(app, /allowedLettersFor\(LETTERS, entitlement\)/);
  assert.doesNotMatch(app, /playLetterPool\(contentReadyLetters\(LETTERS\)/);
  assert.match(app, /onTrialPoolFinished=\{isTrial && !previewLetter \? onTrialPoolFinished : undefined\}/);
});
check("App runs on effective settings and A–Д option catalog", () => {
  assert.match(app, /effectivePlaySettings\(entitlement, progress\)/);
  assert.match(app, /optionCatalog=\{previewLetter \? LETTERS : allowedLetters\}/);
  assert.match(app, /glyphOptionPool\(allowedLetters, optionCount\)/);
  assert.match(app, /pictureContentBank\(allowedLetters\)/);
  assert.doesNotMatch(app, /optionCatalog=\{LETTERS\}/);
  assert.doesNotMatch(app, /progress\.(optionCount|studyOrder|letterCategory)/);
  for (const feature of ["hardLevel", "randomOrder", "letterCategory"]) {
    assert.match(app, new RegExp(`showLockedFeature\\("${feature}"\\)`), feature);
  }
});
check("Locked Сложный / Рандомно / categories stay visible with a lock", () => {
  const difficulty = read("src/components/DifficultySelector.tsx");
  assert.match(difficulty, /canUseOptionCount\(entitlement, option\.value\)/);
  assert.match(difficulty, /🔒/);
  assert.match(difficulty, /disabled=\{!available\}/);
  const menu = read("src/components/playMenuOptions.tsx");
  assert.match(menu, /locked: !canUseStudyOrder\(entitlement, option\.value\)/);
  assert.match(menu, /locked: !canUseLetterCategory\(entitlement, option\.value\)/);
  assert.match(read("src/components/HomePanel.tsx"), /home-choice__lock/);
  const notice = read("src/components/LockedFeatureNotice.tsx");
  assert.match(notice, /Позвать взрослого/);
  for (const file of ["src/components/HomeScreen.tsx", "src/components/GameControls.tsx"]) {
    const source = read(file);
    assert.match(source, /options=\{orderOptions\}/, file);
    assert.match(source, /options=\{categoryOptions\}/, file);
  }
});
check("AdventurePlay shows TrialComplete instead of wrapping past the last trial letter", () => {
  assert.match(
    adventure,
    /if \(next === null\) \{\s*if \(onTrialPoolFinished\) \{\s*onTrialPoolFinished\(currentActivity\);\s*return false;/
  );
});
check("TrialComplete: own short title per activity, no gendered forms, no price", () => {
  const titles = {
    learn: "Ура! Первые 5 букв уже знакомы!",
    find: "Отлично! Все 5 букв найдены!",
    picture: "Здорово! Все задания с картинками пройдены!",
    listen: "Ура! Пробная часть пройдена!"
  };
  for (const [activity, title] of Object.entries(titles)) {
    assert.ok(trialComplete.includes(`${activity}: "${title}"`), activity);
  }
  assert.equal(new Set(Object.values(titles)).size, 4);
  assert.doesNotMatch(trialComplete, /познакомился|познакомилась|прош[ёе]л|прошла|справил/);
  assert.doesNotMatch(trialComplete, /₽/);
});
check("TrialComplete buttons: «Следующее занятие» only with a next activity, «Позвать взрослого» only at the end", () => {
  assert.match(trialComplete, /\{onNext \? \([\s\S]*?СЛЕДУЮЩЕЕ ЗАНЯТИЕ/);
  assert.match(trialComplete, /const isFinal = !onNext;/);
  assert.match(trialComplete, /\{isFinal \? \([\s\S]*?ПОЗВАТЬ ВЗРОСЛОГО/);
  assert.match(trialComplete, /trial-complete__adult-icon/);
  assert.match(trialComplete, /ПОВТОРИТЬ/);
  assert.match(trialComplete, /НА ГЛАВНУЮ/);
  assert.match(
    app,
    /onNext=\{nextTrialActivity\(trialCompleteActivity\) \? nextTrialActivityFromComplete : undefined\}/
  );
});
check("trial activity chain: learn → find → picture → listen → final", () => {
  assert.equal(nextTrialActivity("learn"), "find");
  assert.equal(nextTrialActivity("find"), "picture");
  assert.equal(nextTrialActivity("picture"), "listen");
  assert.equal(nextTrialActivity("listen"), null);
});
check("«Следующее занятие» starts the next activity at А and keeps everything else", () => {
  storage.clear();
  const start = {
    ...loadProgress(),
    stars: 33,
    unlockedStickerIds: ["s1", "s2"],
    favoriteStickerIds: ["s1"],
    meadowTheme: "night",
    optionCount: 3,
    playActivity: "learn"
  };
  let progress = start;
  for (const activity of PLAY_ACTIVITIES) {
    progress = { ...resetActivityLetter(progress, activity, "D"), playActivity: activity };
    const finished = pool("trial", "all", activity);
    assert.equal(nextLetterIndex(finished.length - 1, finished.length), null, activity);
    const next = nextTrialActivity(activity);
    if (!next) {
      assert.equal(activity, "listen");
      break;
    }
    const nextPool = pool("trial", "all", next);
    progress = { ...resetActivityLetter(progress, next, nextPool[0].id), playActivity: next };
    assert.equal(activityLetterId(progress, next), "A", next);
    assert.equal(progress.playActivity, next);
    for (const key of ["stars", "unlockedStickerIds", "favoriteStickerIds", "meadowTheme", "optionCount"]) {
      assert.deepEqual(progress[key], start[key], `${next} ${key}`);
    }
  }
  assert.match(app, /onTrialPoolFinished\(activity: PlayActivity\)/);
  assert.match(app, /resetActivityLetter\(prev, activity, pool\[0\]\?\.id \?\? "A"\),\s*playActivity: activity/);
  assert.match(adventure, /onTrialPoolFinished\(currentActivity\)/);
});
check("FULL never sees trial completion screens", () => {
  assert.match(app, /onTrialPoolFinished=\{isTrial && !previewLetter \? onTrialPoolFinished : undefined\}/);
  assert.match(app, /\{trialCompleteActivity && !preview \? \(/);
  const full = pool("full", "all", "find");
  const dIndex = full.findIndex((letter) => letter.id === "D");
  assert.equal(full[nextLetterIndex(dIndex, full.length)].id, "E");
});

// --- Trial voice (Anastasia / Fish Audio) ---
const trialVoiceSource = read("src/audio/trialVoice.ts");
const generator = read("scripts/fish-audio-generate-trial.mjs");
check("trial voice MP3s exist, match the generator texts and avoid gendered forms", () => {
  const expected = {
    nextActivity: ["trial-next-activity.mp3", "Отлично! Теперь попробуем следующее занятие!"],
    trialFinished: [
      "trial-finished.mp3",
      "Ура! Пробная часть пройдена! Хочешь продолжить игру? Позови взрослого."
    ],
    lockedFeature: [
      "trial-locked-feature.mp3",
      "Эта возможность откроется в полной версии. Позови взрослого."
    ]
  };
  for (const [id, [file, text]] of Object.entries(expected)) {
    const clip = TRIAL_VOICE_CLIPS[id];
    assert.equal(clip.text, text, id);
    assert.ok(clip.path.endsWith(`/common/${file}`), clip.path);
    const full = path.join(root, "public/assets/audio/ru/common", file);
    assert.ok(fs.existsSync(full), `missing ${file}`);
    assert.ok(fs.statSync(full).size > 1000, `${file} too small`);
    assert.ok(generator.includes(`filename: "${file}"`) && generator.includes(`text: "${text}"`), file);
    assert.doesNotMatch(text, /прош[ёе]л|прошла|справил/);
  }
  assert.match(generator, /EXPECTED_VOICE_ID = "ef7303ce0aaa4ffeb518b86afb6c5c9c"/);
  assert.match(generator, /https:\/\/api\.fish\.audio\/v1\/tts/);
});
check("trial screens speak through AudioManager, never browser speech synthesis", () => {
  assert.match(trialComplete, /audioManager\.playVoice\(clip\.path\)/);
  assert.match(trialComplete, /TRIAL_VOICE_CLIPS\.trialFinished : TRIAL_VOICE_CLIPS\.nextActivity/);
  for (const source of [trialComplete, trialVoiceSource, picker, app]) {
    assert.doesNotMatch(source, /speechSynthesis|SpeechSynthesisUtterance/);
  }
  assert.match(app, /speakLockedFeatureHint\(\);/);
  assert.match(picker, /speakLockedFeatureHint\(\);/);
});
check("locked-feature hint is not restarted by rapid taps", () => {
  stubAudioManager.played.length = 0;
  stubAudioManager.busy = false;
  const t0 = 1_000_000;
  assert.equal(speakLockedFeatureHint(t0), true);
  for (let i = 1; i <= 6; i += 1) {
    assert.equal(speakLockedFeatureHint(t0 + i * 150), false);
  }
  stubAudioManager.busy = false;
  assert.equal(speakLockedFeatureHint(t0 + 1000), false, "cooldown still active");
  stubAudioManager.busy = true;
  assert.equal(speakLockedFeatureHint(t0 + LOCKED_HINT_COOLDOWN_MS + 10), false, "still playing");
  stubAudioManager.busy = false;
  assert.equal(speakLockedFeatureHint(t0 + LOCKED_HINT_COOLDOWN_MS + 20), true);
  assert.deepEqual(stubAudioManager.played, [
    TRIAL_VOICE_CLIPS.lockedFeature.path,
    TRIAL_VOICE_CLIPS.lockedFeature.path
  ]);
});
check("Locked letter notice in the picker", () => {
  assert.match(picker, /Эта буква откроется в полной версии/);
  assert.match(picker, /Позвать взрослого/);
  assert.match(picker, /locked_letter_clicked/);
});
check("Parent screen copy, price and gate", () => {
  for (const text of [
    "Полная версия «Весёлого алфавита»",
    "Откройте весь русский алфавит и продолжите обучение.",
    "весь алфавит А–Я",
    "все четыре занятия",
    "три уровня сложности",
    "вся коллекция наград и наклеек",
    "«Моя полянка»",
    "будущие обновления этой версии",
    "599 ₽ ОДИН РАЗ",
    "БЕЗ РЕКЛАМЫ · БЕЗ ПОДПИСКИ",
    "Одна покупка — полный доступ навсегда",
    "КУПИТЬ ПОЛНУЮ ВЕРСИЮ — 599 ₽",
    "Восстановить покупку"
  ]) {
    assert.ok(parentScreen.includes(text), text);
  }
  assert.match(parentGate, /Для взрослых/);
  assert.match(app, /parentFlow\?\.step === "gate"/);
});
check("Dev entitlement is gated away from production builds", () => {
  assert.match(entitlementIndex, /import\.meta\.env\.DEV \|\| import\.meta\.env\.MODE === "trialdev"/);
  assert.match(entitlementIndex, /return new UnavailablePurchaseProvider\(\)/);
});
check("Trial letter list is defined only in the entitlement module", () => {
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        const source = fs.readFileSync(full, "utf8");
        if (/TRIAL_LETTERS\s*=/.test(source) && !full.endsWith(path.join("entitlement", "entitlement.ts"))) {
          offenders.push(full);
        }
        if (/\["А",\s*"Б",\s*"В",\s*"Г",\s*"Д"\]/.test(source) && !full.endsWith(path.join("entitlement", "entitlement.ts"))) {
          offenders.push(full);
        }
      }
    }
  };
  walk(path.join(root, "src"));
  assert.deepEqual(offenders, []);
});
check("App ID unchanged", () => {
  assert.match(read("capacitor.config.ts"), /appId: "com\.shimnadezhda\.game"/);
});

// --- Entitlement service + providers ---
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const progressSnapshot = (() => {
  storage.clear();
  const base = loadProgress();
  const progress = {
    ...base,
    stars: 12,
    playerPreference: "girl",
    meadowTheme: "night",
    meadowDayNightTutorialSeen: true,
    meadowDayNightNightUnlocked: true,
    meadowDayNightSunHintHeard: true,
    learnAdvanceSeconds: 5,
    optionCount: base.optionCount
  };
  saveProgress(progress);
  storage.setItem("happy-alphabet-music-v1", JSON.stringify({ enabled: true, mode: "calm", volume: 0.4 }));
  return { raw: storage.getItem("happy-alphabet-progress-v1"), loaded: loadProgress() };
})();

await (async () => {
  const provider = new MockPurchaseProvider({ defaultEntitlement: "trial", storage, latencyMs: 0 });
  const service = new EntitlementService(provider, { devTools: true });
  assert.equal(service.getEntitlement(), "trial");
  await service.refresh();
  assert.equal(service.getEntitlement(), "trial");
  assert.equal(service.isFullVersion(), false);
  assert.equal(service.canAccessLetter("А"), true);
  assert.equal(service.canAccessLetter("Е"), false);
  check("mock: starts as TRIAL", () => undefined);

  const notified = [];
  service.subscribe((value) => notified.push(value));
  const purchase = await service.purchaseFullVersion();
  assert.equal(purchase.status, "purchased");
  assert.equal(service.getEntitlement(), "full");
  assert.equal(service.canAccessLetter("Я"), true);
  assert.deepEqual(notified, ["full"]);
  check("mock upgrade TRIAL → FULL", () => undefined);
  check("upgrade opens Сложный, Рандомно, categories and Е–Я", () => {
    const entitlement = service.getEntitlement();
    assert.equal(canUseOptionCount(entitlement, 7), true);
    assert.equal(canUseStudyOrder(entitlement, "random"), true);
    assert.equal(canUseLetterCategory(entitlement, "vowels"), true);
    assert.equal(allowedLettersFor(LETTERS, entitlement).length, 33);
    assert.deepEqual(
      effectivePlaySettings(entitlement, { optionCount: 7, studyOrder: "random", letterCategory: "vowels" }),
      { optionCount: 7, studyOrder: "random", letterCategory: "vowels" }
    );
  });

  check("upgrade preserves progress, music and settings byte-for-byte", () => {
    assert.equal(storage.getItem("happy-alphabet-progress-v1"), progressSnapshot.raw);
    assert.deepEqual(loadProgress(), progressSnapshot.loaded);
    assert.ok(!/entitlement|purchase/i.test(progressSnapshot.raw));
    assert.equal(storage.getItem(MOCK_PURCHASE_KEY), "purchased");
  });

  const reloaded = new EntitlementService(
    new MockPurchaseProvider({ defaultEntitlement: "trial", storage, latencyMs: 0 }),
    { devTools: true }
  );
  await reloaded.refresh();
  check("mock purchase survives a restart", () => assert.equal(reloaded.getEntitlement(), "full"));

  service.devSetEntitlement("trial");
  check("dev switch can downgrade in dev only", () => assert.equal(service.getEntitlement(), "trial"));
  const restore = await service.restorePurchase();
  check("mock restore brings FULL back", () => {
    assert.equal(restore.status, "restored");
    assert.equal(service.getEntitlement(), "full");
  });

  service.devResetMockPurchase();
  await tick();
  const notFound = await service.restorePurchase();
  check("restore without a purchase reports not_found", () => {
    assert.equal(service.getEntitlement(), "trial");
    assert.equal(notFound.status, "not_found");
  });

  const names = recentAnalyticsEvents().map((event) => event.name);
  check("internal analytics events fire", () => {
    for (const name of ["trial_started", "purchase_started", "purchase_completed", "purchase_restored"]) {
      assert.ok(names.includes(name), name);
    }
  });
})();

await (async () => {
  const service = new EntitlementService(new UnavailablePurchaseProvider(), { devTools: false });
  await service.refresh();
  const purchase = await service.purchaseFullVersion();
  const restore = await service.restorePurchase();
  check("production without a store never fakes a purchase", () => {
    assert.equal(purchase.status, "unavailable");
    assert.equal(restore.status, "unavailable");
    assert.equal(service.getEntitlement(), "trial");
  });
  service.devSetEntitlement("full");
  check("production ignores dev switches", () => assert.equal(service.getEntitlement(), "trial"));
})();

await (async () => {
  let answer = "full";
  const flaky = {
    kind: "mock",
    getEntitlement: async () => answer,
    purchaseFullVersion: async () => ({ status: "cancelled" }),
    restorePurchase: async () => ({ status: "not_found" })
  };
  const service = new EntitlementService(flaky, { devTools: false });
  await service.refresh();
  answer = "trial";
  await service.refresh();
  service.devSetEntitlement("trial");
  check("FULL never downgrades spontaneously outside dev", () => assert.equal(service.getEntitlement(), "full"));
})();

check("progress without an entitlement field still loads (migration)", () => {
  storage.clear();
  storage.setItem("happy-alphabet-progress-v1", JSON.stringify({ stars: 7, unlockedStickerIds: [] }));
  const loaded = loadProgress();
  assert.equal(loaded.stars, 7);
  assert.ok(storage.getItem("happy-alphabet-progress-v1"));
  assert.equal(storage.getItem(MOCK_PURCHASE_KEY), null);
});

console.log(`verify-trial-entitlement: ${checks} checks passed`);
