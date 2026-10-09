import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = fs.readFileSync(path.join(root, "src/data/stickerCatalog.ts"), "utf8");
const assets = fs.readFileSync(path.join(root, "src/data/stickerAssets.ts"), "utf8");

const visible = {
  "sticker-01": {
    title: "Белочка",
    asset: "/assets/stickers/final/universal/squirrel-acorn.png",
    collectionId: "meadow-friends"
  },
  "sticker-02": {
    title: "Колибри",
    asset: "/assets/stickers/final/universal/hummingbird.png",
    collectionId: "sky-party"
  },
  "sticker-03": {
    title: "Звёздочка",
    asset: "/assets/stickers/final/girls/star.png",
    collectionId: "sky-party"
  },
  "sticker-04": {
    title: "Сундучок",
    asset: "/assets/stickers/final/boys/treasure-chest.png",
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
assert.equal(meadowNames.length, 20);

const finalArt = fs.readFileSync(path.join(root, "src/data/finalStickerArt.ts"), "utf8");
const finalRows = [...finalArt.matchAll(/id: "(sticker-\d+)", title: "([^"]+)", asset: "([^"]+)"/g)].map((match) => ({
  id: match[1],
  title: match[2],
  asset: match[3]
}));
assert.equal(new Set(finalRows.map((row) => row.id)).size, finalRows.length, "duplicate final sticker ids");
assert.equal(new Set(finalRows.map((row) => row.asset)).size, finalRows.length, "duplicate final sticker files");
const keptIds = new Set(["sticker-01", "sticker-02", "sticker-03", "sticker-04"]);
for (const row of finalRows) {
  assert.equal(keptIds.has(row.id), false, `${row.id} must stay on the original sticker`);
  assert.ok(row.title.trim().length > 0, `empty title ${row.id}`);
  const file = path.join(root, "public", row.asset.replace(/^\//, "").replaceAll("/", path.sep));
  assert.equal(fs.existsSync(file), true, `missing file ${file}`);
}
const expectedGirls = {
  "fairy-girl.png": "Фея",
  "ballerina-kitten.png": "Котёнок-балерина",
  "princess-pony.png": null,
  "princess-crown.png": "Корона",
  "princess-carriage.png": "Карета",
  "crystal-slipper.png": "Хрустальная туфелька",
  "princess-mirror.png": "Зеркальце"
};
for (const [file, title] of Object.entries(expectedGirls)) {
  const row = finalRows.find((item) => item.asset.endsWith(`/${file}`));
  if (title === null) {
    assert.equal(row, undefined, `${file} is not in the collection`);
    continue;
  }
  assert.ok(row, `missing catalog row for ${file}`);
  assert.equal(row.title, title, `${file} title`);
}

const titles = [...catalog.matchAll(/\btitle: "([^"]*)"/g)].map((match) => match[1]);
assert.ok(titles.length > 0 && titles.every((title) => title.trim().length > 0), "empty title");

const bunnyStillOnChest = /sticker-04[\s\S]{0,220}Зайчик/.test(artBlock);
assert.equal(bunnyStillOnChest, false, "sticker-04 must not be titled Зайчик");

const finalRoot = path.join(root, "public", "assets", "stickers", "final");
const onDisk = [];
const counts = {};
for (const folder of ["boys", "girls", "universal"]) {
  const names = fs.readdirSync(path.join(finalRoot, folder)).filter((name) => name.toLowerCase().endsWith(".png"));
  counts[folder] = names.length;
  for (const name of names) {
    onDisk.push(`${folder}/${name}`);
  }
}
const visibleFinal = Object.values(visible)
  .map((row) => row.asset)
  .filter((asset) => asset.startsWith("/assets/stickers/final/"))
  .map((asset) => asset.replace("/assets/stickers/final/", ""));
const catalogPaths = finalRows.map((row) => row.asset.replace("/assets/stickers/final/", ""));
const alphabetMatch = catalog.match(
  /ALPHABET_ACHIEVEMENT_STICKER[\s\S]*?title: "([^"]+)"[\s\S]*?asset: "([^"]+)"/
);
assert.ok(alphabetMatch, "ALPHABET_ACHIEVEMENT_STICKER block missing");
assert.equal(alphabetMatch[1], "Оленёнок");
assert.equal(alphabetMatch[2], "/assets/stickers/final/universal/fawn-flowers.png");
const alphabetAsset = alphabetMatch[2];
const alphabetFinal = alphabetAsset.startsWith("/assets/stickers/final/")
  ? [alphabetAsset.replace("/assets/stickers/final/", "")]
  : [];
const catalogPathSet = new Set([...catalogPaths, ...visibleFinal, ...alphabetFinal]);
const diskSet = new Set(onDisk);
const unconnected = onDisk.filter((item) => !catalogPathSet.has(item));
const missing = [...catalogPathSet].filter((item) => !diskSet.has(item));
assert.deepEqual(unconnected, [], `final PNG without a sticker record: ${unconnected.join(", ")}`);
assert.deepEqual(missing, [], `catalog asset missing on disk: ${missing.join(", ")}`);
assert.equal(
  onDisk.length,
  finalRows.length + visibleFinal.length + alphabetFinal.length,
  "final PNG count must match catalog rows"
);
for (const asset of visibleFinal) {
  assert.equal(catalogPaths.includes(asset), false, `final file is both an early sticker and a later sticker: ${asset}`);
}
for (const asset of alphabetFinal) {
  assert.equal(catalogPaths.includes(asset), false, `achievement file must not duplicate a final sticker row: ${asset}`);
  assert.equal(visibleFinal.includes(asset), false, `achievement file must not duplicate an early sticker: ${asset}`);
}
assert.equal(counts.boys + counts.girls + counts.universal, onDisk.length);

console.log(
  `verify-sticker-labels: ok boys=${counts.boys} girls=${counts.girls} universal=${counts.universal} total=${onDisk.length}`
);
