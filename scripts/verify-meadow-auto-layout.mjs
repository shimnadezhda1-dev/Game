import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const MEADOW_HORIZONTAL_MARGIN_PX = 12;
const MEADOW_AUTO_GAP_PX = 10;
const MEADOW_AUTO_GAP_MIN_PX = 6;
const MEADOW_AUTO_MAX_ATTEMPTS = 80;

function overlapArea(a, b) {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return x * y;
}

function inflateBox(box, pad) {
  return {
    x: box.x - pad,
    y: box.y - pad,
    w: box.w + pad * 2,
    h: box.h + pad * 2
  };
}

function boxesOverlap(a, b, gap = 0) {
  if (gap <= 0) {
    return overlapArea(a, b) > 0;
  }
  return overlapArea(inflateBox(a, gap / 2), inflateBox(b, gap / 2)) > 0;
}

function isManualMeadowPosition(position) {
  if (!position) {
    return false;
  }
  return position.source !== "auto";
}

function meadowAutoStickerSize(kind, areaWidth, areaHeight) {
  if (kind === "mobile") {
    const vmin = Math.min(areaWidth, areaHeight);
    return Math.min(88, Math.max(54, 0.15 * vmin));
  }
  return Math.min(118, Math.max(70, 0.082 * areaWidth));
}

function centerToBox(x, y, size, areaWidth, areaHeight) {
  return {
    x: x * areaWidth - size / 2,
    y: y * areaHeight - size / 2,
    w: size,
    h: size
  };
}

function buildAutoSlots(areaWidth, areaHeight, size, gap, margin) {
  const cell = size + gap;
  if (!(cell > 0) || !(areaWidth > 0) || !(areaHeight > 0)) {
    return [];
  }
  const usableW = Math.max(size, areaWidth - margin * 2);
  const usableH = Math.max(size, areaHeight - margin * 2);
  const cols = Math.max(1, Math.floor((usableW + gap) / cell));
  const rows = Math.max(1, Math.floor((usableH + gap) / cell));
  const extraX = Math.max(0, usableW - (cols * size + Math.max(0, cols - 1) * gap));
  const extraY = Math.max(0, usableH - (rows * size + Math.max(0, rows - 1) * gap));
  const startX = margin + extraX / 2;
  const startY = margin + extraY / 2;
  const slots = [];
  for (let row = rows - 1; row >= 0; row -= 1) {
    for (let i = 0; i < cols; i += 1) {
      const col = row % 2 === 0 ? i : cols - 1 - i;
      const jitterX = (row % 3) * 2;
      const jitterY = (col % 2) * 3;
      slots.push({
        left: startX + col * cell + jitterX,
        top: startY + row * cell - jitterY
      });
    }
  }
  return slots;
}

function layoutMeadowAutoPositions(ids, kind, areaWidth, areaHeight, occupiedCenters = []) {
  if (!ids.length || !(areaWidth > 0) || !(areaHeight > 0)) {
    return [];
  }
  const minSize = kind === "mobile" ? 48 : 58;
  let size = meadowAutoStickerSize(kind, areaWidth, areaHeight);
  let gap = MEADOW_AUTO_GAP_PX;
  const margin = MEADOW_HORIZONTAL_MARGIN_PX;

  const tryPlace = (sizeTry, gapTry) => {
    const occupied = occupiedCenters.map((item) =>
      centerToBox(item.x, item.y, item.size ?? sizeTry, areaWidth, areaHeight)
    );
    const slots = buildAutoSlots(areaWidth, areaHeight, sizeTry, gapTry, margin);
    const placed = [];
    let slotIndex = 0;
    for (let i = 0; i < ids.length; i += 1) {
      let found = null;
      let attempts = 0;
      while (slotIndex < slots.length && attempts < MEADOW_AUTO_MAX_ATTEMPTS) {
        const slot = slots[slotIndex];
        slotIndex += 1;
        attempts += 1;
        const maxLeft = Math.max(margin, areaWidth - margin - sizeTry);
        const maxTop = Math.max(margin, areaHeight - margin - sizeTry);
        const left = Math.min(Math.max(margin, slot.left), maxLeft);
        const top = Math.min(Math.max(margin, slot.top), maxTop);
        const box = { x: left, y: top, w: sizeTry, h: sizeTry };
        if (occupied.some((other) => boxesOverlap(box, other, gapTry))) {
          continue;
        }
        found = { left, top };
        break;
      }
      if (!found) {
        return null;
      }
      occupied.push({ x: found.left, y: found.top, w: sizeTry, h: sizeTry });
      placed.push({
        id: ids[i],
        x: (found.left + sizeTry / 2) / areaWidth,
        y: (found.top + sizeTry / 2) / areaHeight,
        size: sizeTry
      });
    }
    return placed;
  };

  for (let step = 0; step < 8; step += 1) {
    const result = tryPlace(size, gap);
    if (result) {
      return result;
    }
    if (gap > MEADOW_AUTO_GAP_MIN_PX) {
      gap = MEADOW_AUTO_GAP_MIN_PX;
    } else {
      size = Math.max(minSize, size - 6);
    }
  }
  return tryPlace(size, 4) ?? [];
}

function assertNoAutoOverlap(placed, areaW, areaH, gap = MEADOW_AUTO_GAP_MIN_PX) {
  for (let i = 0; i < placed.length; i += 1) {
    const a = centerToBox(placed[i].x, placed[i].y, placed[i].size, areaW, areaH);
    for (let j = i + 1; j < placed.length; j += 1) {
      const b = centerToBox(placed[j].x, placed[j].y, placed[j].size, areaW, areaH);
      assert.equal(
        overlapArea(inflateBox(a, gap / 2), inflateBox(b, gap / 2)),
        0,
        `${placed[i].id} overlaps ${placed[j].id}`
      );
    }
  }
}

const viewports = [
  [360, 800],
  [390, 844],
  [412, 915]
];
const ids = Array.from({ length: 13 }, (_, index) => `sticker-${index + 1}`);

for (const [width, height] of viewports) {
  const placed = layoutMeadowAutoPositions(ids, "mobile", width, height);
  assert.equal(placed.length, ids.length, `placed all autos on ${width}x${height}`);
  assertNoAutoOverlap(placed, width, height);
}

const many = layoutMeadowAutoPositions(
  Array.from({ length: 24 }, (_, index) => `n-${index}`),
  "mobile",
  390,
  844
);
assert.equal(many.length, 24);
assertNoAutoOverlap(many, 390, 844, 4);

const manuals = [
  { x: 0.5, y: 0.5, size: 70 },
  { x: 0.52, y: 0.52, size: 70 }
];
assert.ok(
  overlapArea(
    centerToBox(manuals[0].x, manuals[0].y, manuals[0].size, 390, 844),
    centerToBox(manuals[1].x, manuals[1].y, manuals[1].size, 390, 844)
  ) > 0,
  "manual pair is allowed to overlap"
);

const aroundManual = layoutMeadowAutoPositions(["auto-a", "auto-b", "auto-c"], "mobile", 390, 844, [
  manuals[0]
]);
assert.equal(aroundManual.length, 3);
const manualBox = centerToBox(manuals[0].x, manuals[0].y, manuals[0].size, 390, 844);
for (const item of aroundManual) {
  const box = centerToBox(item.x, item.y, item.size, 390, 844);
  assert.equal(overlapArea(inflateBox(box, 3), inflateBox(manualBox, 3)), 0);
}

assert.equal(isManualMeadowPosition(undefined), false);
assert.equal(isManualMeadowPosition({ x: 0.2, y: 0.3, z: 1, space: "scene" }), true);
assert.equal(isManualMeadowPosition({ x: 0.2, y: 0.3, z: 1, space: "scene", source: "manual" }), true);
assert.equal(isManualMeadowPosition({ x: 0.2, y: 0.3, z: 1, space: "scene", source: "auto" }), false);

const helpers = read("src/utils/favoriteStickers.ts");
assert.match(helpers, /export function layoutMeadowAutoPositions/);
assert.match(helpers, /MEADOW_AUTO_MAX_ATTEMPTS = 80/);
assert.match(helpers, /isManualMeadowPosition/);
assert.doesNotMatch(helpers, /while \(true\)/);

const layer = read("src/components/MeadowStickerLayer.tsx");
assert.match(layer, /layoutMeadowAutoPositions/);
assert.match(layer, /source: "manual"/);
assert.match(layer, /data-meadow-source/);
assert.match(layer, /isManualMeadowPosition/);

console.log("verify-meadow-auto-layout: ok");
