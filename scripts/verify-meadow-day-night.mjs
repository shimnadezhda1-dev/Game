import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function parseMeadowTheme(value) {
  return value === "night" ? "night" : "day";
}

function layoutMeadowStars(count) {
  const total = Math.max(0, Math.floor(count));
  let seed = 17;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: total }, (_, index) => {
    const spread = total > 1 ? (index + 0.5) / total : 0.5;
    const x = Math.min(98, Math.max(2, 2 + spread * 96 + (rand() - 0.5) * 7));
    const y = 4 + rand() * 34;
    const size = 3 + rand() * 5;
    return {
      id: index,
      x,
      y,
      size,
      twinkle: index % 3 === 0,
      delay: (index % 7) * 0.45
    };
  });
}

assert.equal(parseMeadowTheme(undefined), "day");
assert.equal(parseMeadowTheme(null), "day");
assert.equal(parseMeadowTheme("day"), "day");
assert.equal(parseMeadowTheme("dusk"), "day");
assert.equal(parseMeadowTheme("night"), "night");

const MEADOW_STAR_COUNT_DESKTOP = 28;
const MEADOW_STAR_COUNT_MOBILE = 16;
const desktopStars = layoutMeadowStars(MEADOW_STAR_COUNT_DESKTOP);
const mobileStars = layoutMeadowStars(MEADOW_STAR_COUNT_MOBILE);
assert.equal(desktopStars.length, 28);
assert.equal(mobileStars.length, 16);
assert.ok(desktopStars.length >= 20 && desktopStars.length <= 35);
assert.ok(mobileStars.length < desktopStars.length);
assert.ok(desktopStars.every((star) => star.y <= 50), "stars stay in the sky");
assert.ok(desktopStars.some((star) => star.x < 18), "stars reach the left sky");
assert.ok(desktopStars.some((star) => star.x > 82), "stars reach the right sky");
assert.ok(desktopStars.some((star) => star.twinkle));
assert.ok(desktopStars.some((star) => !star.twinkle));

let theme = parseMeadowTheme(undefined);
assert.equal(theme, "day");
theme = theme === "night" ? "day" : "night";
assert.equal(theme, "night");
theme = theme === "night" ? "day" : "night";
assert.equal(theme, "day");

const layouts = {
  desktop: { "sticker-05": { x: 0.2, y: 0.7, z: 2, space: "scene" } },
  mobile: { "sticker-05": { x: 0.4, y: 0.8, z: 1, space: "scene" } }
};
const afterNight = { ...{ meadowTheme: "night" }, favoriteStickerLayouts: layouts };
assert.equal(afterNight.favoriteStickerLayouts.desktop["sticker-05"].x, 0.2);
assert.equal(afterNight.favoriteStickerLayouts.mobile["sticker-05"].y, 0.8);
const afterDay = { meadowTheme: "day", favoriteStickerLayouts: afterNight.favoriteStickerLayouts };
assert.equal(afterDay.favoriteStickerLayouts.desktop["sticker-05"].z, 2);

const types = read("src/types.ts");
assert.match(types, /export type MeadowTheme = "day" \| "night"/);
assert.match(types, /meadowTheme: MeadowTheme/);

const storage = read("src/utils/storage.ts");
assert.match(storage, /meadowTheme: "day"/);
assert.match(storage, /meadowDayNightTutorialSeen: false/);
assert.match(storage, /parseMeadowTheme\(parsed\.meadowTheme\)/);

const helpers = read("src/utils/favoriteStickers.ts");
assert.match(helpers, /MEADOW_STAR_COUNT_DESKTOP = 28/);
assert.match(helpers, /MEADOW_STAR_COUNT_MOBILE = 16/);
assert.match(helpers, /parseMeadowTheme/);
assert.match(helpers, /layoutMeadowStars/);

const meadow = read("src/components/MyMeadowScreen.tsx");
assert.match(meadow, /data-meadow-theme=\{theme\}/);
assert.match(meadow, /Включить ночь/);
assert.match(meadow, /Включить день/);
assert.match(meadow, /data-meadow-celestial/);
assert.match(meadow, /data-meadow-stars/);
assert.match(meadow, /my-meadow-screen--night/);
assert.match(meadow, /layoutMeadowStars/);
assert.match(meadow, /onToggleTheme/);
assert.match(meadow, /meadow-moon\.jpg/);
assert.match(meadow, /tutorialSeen/);
assert.doesNotMatch(meadow, /new Date\(/);
assert.doesNotMatch(meadow, /getHours/);
assert.doesNotMatch(meadow, /WebGL/);
assert.doesNotMatch(meadow, /canvas/);

const app = read("src/App.tsx");
assert.match(app, /setMeadowTheme/);
assert.match(app, /theme=\{parseMeadowTheme\(progress\.meadowTheme\)\}/);
assert.match(app, /onToggleTheme/);
assert.doesNotMatch(app, /favoriteStickerLayouts: \{\}/);
const toggleBlock = app.slice(app.indexOf("function setMeadowTheme"), app.indexOf("function commitFavoriteStickerPosition"));
assert.doesNotMatch(toggleBlock, /favoriteStickerLayouts/);
assert.doesNotMatch(toggleBlock, /favoriteStickerIds/);
assert.doesNotMatch(toggleBlock, /favoriteStickerPositions/);

const layer = read("src/components/MeadowStickerLayer.tsx");
assert.match(layer, /onPointerDown/);
assert.match(layer, /setPointerCapture/);
assert.doesNotMatch(layer, /meadowTheme/);
assert.doesNotMatch(layer, /drop-shadow\(0 0 6px/);

const reward = read("src/components/RewardScreen.tsx");
assert.doesNotMatch(reward, /onToggleTheme/);
assert.doesNotMatch(reward, /meadowTheme/);

const css = read("src/styles.css");
assert.match(css, /\.my-meadow-night-veil \{[\s\S]*?inset:\s*0;/);
assert.match(css, /\.my-meadow-night-veil \{[\s\S]*?border-radius:\s*0;/);
assert.match(css, /\.my-meadow-stars \{[\s\S]*?inset:\s*0;/);
assert.match(css, /\.app-shell\.meadow-open \{[\s\S]*?max-width:\s*none;/);
assert.match(css, /\.app-shell\.meadow-open \.my-meadow-screen \{[\s\S]*?border-radius:\s*0;/);
assert.match(css, /\.app-shell\.meadow-open \.my-meadow-screen \{[\s\S]*?inset:\s*0;/);
assert.match(css, /\.my-meadow-screen--night \.world-sky/);
assert.match(css, /pointer-events:\s*none/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /drop-shadow\(0 0 6px/);
assert.match(css, /\.my-meadow-celestial/);
assert.match(css, /\.my-meadow-celestial \{[\s\S]*?left:\s*50%;[\s\S]*?transform:\s*translateX\(-50%\);/);
assert.match(css, /\.my-meadow-screen--mobile \.my-meadow-celestial \{[\s\S]*?left:\s*50%;/);
assert.match(css, /min-width:\s*44px/);
assert.match(css, /min-height:\s*44px/);
assert.match(css, /0\.65s/);
assert.doesNotMatch(css, /canvas/);

assert.ok(fs.existsSync(path.join(root, "public/assets/home/meadow-moon.jpg")));
assert.ok(fs.existsSync(path.join(root, "public/assets/stickers-page/sun.png")));

console.log("verify-meadow-day-night: ok");
