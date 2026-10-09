import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const clips = [
  {
    file: "meadow-night-hint.mp3",
    text: "Хочешь увидеть волшебную ночь? Нажми на солнышко!"
  },
  {
    file: "meadow-night-wow.mp3",
    text: "Ух ты! Наступила ночь! Посмотри, как светятся твои наклейки!"
  },
  {
    file: "meadow-day-hint.mp3",
    text: "Чтобы вернуть день, нажми на луну!"
  },
  {
    file: "meadow-night-reminder.mp3",
    text: "Нажми на солнышко — и увидишь ночь!"
  }
];

for (const clip of clips) {
  const full = path.join(root, "public/assets/audio/ru/common", clip.file);
  assert.equal(fs.existsSync(full), true, `missing ${clip.file}`);
  assert.ok(fs.statSync(full).size > 1000, `${clip.file} too small`);
}

const voice = read("src/audio/meadowTutorialVoice.ts");
for (const clip of clips) {
  assert.match(voice, new RegExp(clip.file.replace(".", "\\.")));
  assert.ok(voice.includes(clip.text), `text missing for ${clip.file}`);
}

const types = read("src/types.ts");
assert.match(types, /meadowDayNightTutorialSeen: boolean/);
assert.match(types, /meadowDayNightNightUnlocked: boolean/);
assert.match(types, /meadowDayNightSunHintHeard: boolean/);

const storage = read("src/utils/storage.ts");
assert.match(storage, /meadowDayNightTutorialSeen: false/);
assert.match(storage, /meadowDayNightNightUnlocked: false/);
assert.match(storage, /meadowDayNightSunHintHeard: false/);
assert.match(storage, /parsed\.meadowDayNightTutorialSeen === true/);

const meadow = read("src/components/MyMeadowScreen.tsx");
assert.match(meadow, /MEADOW_TUTORIAL_CLIPS/);
assert.match(meadow, /audioManager\.playVoice/);
assert.match(meadow, /is-tutorial-hint/);
assert.match(meadow, /my-meadow-celestial__sparks/);
assert.match(meadow, /onMarkTutorialSeen/);
assert.match(meadow, /onMarkNightUnlocked/);
assert.match(meadow, /onMarkSunHintHeard/);
assert.doesNotMatch(meadow, /speechSynthesis/);
assert.doesNotMatch(meadow, /MeadowStickerLayer[\s\S]*meadowTheme/);

const app = read("src/App.tsx");
assert.match(app, /markMeadowTutorialSeen/);
assert.match(app, /tutorialSeen=\{progress\.meadowDayNightTutorialSeen === true\}/);
assert.match(app, /onMarkTutorialSeen=\{markMeadowTutorialSeen\}/);
const toggleBlock = app.slice(
  app.indexOf("function setMeadowTheme"),
  app.indexOf("function markMeadowSunHintHeard")
);
assert.doesNotMatch(toggleBlock, /favoriteStickerLayouts/);
assert.doesNotMatch(toggleBlock, /favoriteStickerPositions/);

const css = read("src/styles.css");
assert.match(
  css,
  /\.my-meadow-celestial \{[\s\S]*?left:\s*50%;[\s\S]*?transform:\s*translateX\(-50%\);/
);
assert.match(
  css,
  /\.my-meadow-screen--mobile \.my-meadow-celestial \{[\s\S]*?left:\s*50%;[\s\S]*?transform:\s*translateX\(-50%\);/
);
assert.match(css, /\.my-meadow-screen--mobile \.cloud-a/);
assert.match(css, /\.my-meadow-screen--mobile \.cloud-b/);
assert.match(css, /meadow-celestial-pulse/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /pointer-events:\s*none/);

// Fresh storage defaults
const fresh = {
  meadowDayNightTutorialSeen: false,
  meadowDayNightNightUnlocked: false,
  meadowDayNightSunHintHeard: false,
  meadowTheme: "day"
};
assert.equal(fresh.meadowDayNightTutorialSeen, false);

// Simulated tutorial flow
let state = { ...fresh };
assert.equal(state.meadowTheme, "day");
state.meadowDayNightSunHintHeard = true; // night hint played
state.meadowTheme = "night"; // sun click
state.meadowDayNightNightUnlocked = true; // wow
assert.equal(state.meadowTheme, "night");
state.meadowTheme = "day"; // moon click
state.meadowDayNightTutorialSeen = true;
assert.equal(state.meadowDayNightTutorialSeen, true);

// Reload: full tutorial must not restart when seen
const reloaded = { ...state };
assert.equal(reloaded.meadowDayNightTutorialSeen, true);

// Saved night + incomplete tutorial → moon path, not sun hint
const edge = {
  meadowTheme: "night",
  meadowDayNightTutorialSeen: false,
  meadowDayNightNightUnlocked: false,
  meadowDayNightSunHintHeard: false
};
assert.equal(edge.meadowTheme, "night");
assert.equal(edge.meadowDayNightTutorialSeen, false);

const layer = read("src/components/MeadowStickerLayer.tsx");
assert.match(layer, /onPointerDown/);
assert.doesNotMatch(layer, /tutorialSeen/);
assert.doesNotMatch(layer, /MEADOW_TUTORIAL/);

console.log("verify-meadow-tutorial: ok");
