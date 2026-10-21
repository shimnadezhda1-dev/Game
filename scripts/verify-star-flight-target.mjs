import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const helper = read("src/utils/starFlight.ts");
const app = read("src/App.tsx");
const hud = read("src/components/GameHudRight.tsx");
const progress = read("src/components/Progress.tsx");
const flying = read("src/components/FlyingStar.tsx");
const css = read("src/styles.css");

assert.match(helper, /STAR_COUNTER_SELECTOR = "\[data-star-counter\]"/);
assert.match(helper, /getBoundingClientRect\(\)/);
assert.match(helper, /function getVisibleStarCounterElement/);
assert.match(helper, /function getStarFlightTarget/);
assert.match(helper, /display === "none"/);
assert.match(helper, /rect\.width > 1 && rect\.height > 1/);
assert.doesNotMatch(helper, /toX\s*=\s*48|toY\s*=\s*28/);

assert.match(app, /import \{ getStarFlightTarget \} from "\.\/utils\/starFlight"/);
assert.match(app, /const target = getStarFlightTarget\(\)/);
assert.match(app, /setFlight\(\{ fromX, fromY, toX: target\.x, toY: target\.y \}\)/);
assert.doesNotMatch(app, /getElementById\("star-bank"\)/);
assert.doesNotMatch(app, /toX = bank \? bank\.left/);
assert.doesNotMatch(app, /:\s*48;\s*\n\s*const toY/);
assert.doesNotMatch(app, /toY = bank \? bank\.top/);

assert.match(hud, /data-star-counter/);
assert.match(hud, /className="learn-stars"/);

assert.match(progress, /id="star-bank"/);
assert.match(progress, /data-star-counter/);

assert.match(flying, /getStarFlightTarget/);
assert.match(flying, /orientationchange/);
assert.match(flying, /position: fixed|className="flying-star"/);
assert.match(flying, /"--dx"/);
assert.match(flying, /"--dy"/);

assert.match(css, /\.app-shell\.play-hud \.top-bar \{\s*display: none;/);
assert.match(css, /\.flying-star \{[\s\S]*?position: fixed;/);
assert.match(css, /\.flying-star \{[\s\S]*?z-index: 220;/);
assert.match(css, /@keyframes fly-to-bank/);

const findGame = read("src/components/FindLetterGame.tsx");
const pictureGame = read("src/components/PictureLetterGame.tsx");
const learn = read("src/components/LearnLetters.tsx");
const adventure = read("src/components/AdventurePlay.tsx");

assert.match(findGame, /<GameHudRight/);
assert.match(pictureGame, /<GameHudRight/);
assert.match(learn, /<GameHudRight/);
assert.match(adventure, /onCorrect=\{onCorrect\}/);
assert.match(findGame, /onCorrect/);
assert.match(pictureGame, /onCorrect/);

console.log("verify-star-flight-target: ok");
