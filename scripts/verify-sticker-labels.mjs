import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = fs.readFileSync(path.join(root, "src/data/stickerCatalog.ts"), "utf8");
const assets = fs.readFileSync(path.join(root, "src/data/stickerAssets.ts"), "utf8");

const visible = {
  "sticker-01": {
    title: "Солнышко",
    asset: "/assets/stickers/sun-new.png",
    collectionId: "meadow-friends"
  },
  "sticker-02": {
    title: "Радуга",
    asset: "/assets/home/rainbow-clean.png",
    collectionId: "sky-party"
  },
  "sticker-03": {
    title: "Звёздочка",
    asset: "/assets/ui/stars.webp",
    collectionId: "sky-party"
  },
  "sticker-04": {
    title: "Сундучок",
    asset: "/assets/ui/rewards-chest.webp",
    collectionId: "sky-party"
  }
};

const artBlock = catalog.slice(catalog.indexOf("VISIBLE_STICKER_ART"), catalog.indexOf("function withVisibleArtwork"));
assert.ok(artBlock.length > 0, "VISIBLE_STICKER_ART block missing");

const seenAssets = new Set();
for (const [id, row] of Object.entries(visible)) {
  assert.ok(artBlock.includes(`"${id}"`), `${id} missing from VISIBLE_STICKER_ART`);
  assert.ok(artBlock.includes(`title: "${row.title}"`), `${id} title mismatch`);
  assert.ok(artBlock.includes(`asset: "${row.asset}"`), `${id} asset mismatch`);
  assert.ok(artBlock.includes(`collectionId: "${row.collectionId}"`), `${id} collection mismatch`);
  assert.match(assets, new RegExp(`${id}": "${row.asset.replace(/\//g, "\\/")}"`));
  const file = path.join(root, "public", row.asset.replace(/^\//, "").replaceAll("/", path.sep));
  assert.equal(fs.existsSync(file), true, `missing file ${file}`);
  assert.equal(seenAssets.has(row.asset), false, `duplicate file ${row.asset}`);
  seenAssets.add(row.asset);
}

const explicitIds = [...catalog.matchAll(/\bid: "([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(explicitIds).size, explicitIds.length, `duplicate catalog ids: ${explicitIds}`);
assert.ok(catalog.includes('ALPHABET_ACHIEVEMENT_ID = "alphabet-expert"'));
assert.match(catalog, /sticker-\$\{String\(order\)\.padStart\(2, "0"\)\}/);
const meadowNames = [...catalog.match(/const MEADOW_NAMES = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const skyNames = [...catalog.match(/const SKY_NAMES = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const toyNames = [...catalog.match(/const TOY_NAMES = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
assert.equal(meadowNames.length, 20);
assert.equal(skyNames.length, 20);
assert.equal(toyNames.length, 20);

const titles = [...catalog.matchAll(/\btitle: "([^"]*)"/g)].map((match) => match[1]);
assert.ok(titles.length > 0 && titles.every((title) => title.trim().length > 0), "empty title");

const bunnyStillOnChest = /sticker-04[\s\S]{0,220}Зайчик/.test(artBlock);
assert.equal(bunnyStillOnChest, false, "sticker-04 must not be titled Зайчик");

console.log("verify-sticker-labels: ok");
