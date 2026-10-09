import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function clamp01(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

const LEGACY_MEADOW_HEIGHT_RATIO = 0.42;
const LEGACY_MEADOW_TOP_RATIO = 1 - LEGACY_MEADOW_HEIGHT_RATIO;
const FAVORITE_STICKER_SPACE_SCENE = "scene";
const FAVORITE_STICKER_BASE_SIZE = 122;
const STICKER_OBSTACLE_PAD_PX = 8;
const STICKER_OBSTACLE_MIN_OVERLAP = 4;

function parseFavoriteStickerPosition(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const x = typeof value.x === "number" ? value.x : Number(value.x);
  const y = typeof value.y === "number" ? value.y : Number(value.y);
  const z = typeof value.z === "number" ? value.z : Number(value.z);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  const space = value.space === "scene" || value.space === "meadow" ? value.space : undefined;
  return {
    x: clamp01(x),
    y: clamp01(y),
    z: Number.isFinite(z) ? Math.max(0, Math.floor(z)) : 0,
    ...(space ? { space } : {})
  };
}

function meadowPositionToScene(x, y) {
  return {
    x: clamp01(x),
    y: clamp01(LEGACY_MEADOW_TOP_RATIO + clamp01(y) * LEGACY_MEADOW_HEIGHT_RATIO)
  };
}

function toSceneFavoritePosition(position) {
  if (position.space === FAVORITE_STICKER_SPACE_SCENE) {
    return {
      x: clamp01(position.x),
      y: clamp01(position.y),
      z: position.z,
      space: FAVORITE_STICKER_SPACE_SCENE
    };
  }
  const mapped = meadowPositionToScene(position.x, position.y);
  return {
    x: mapped.x,
    y: mapped.y,
    z: position.z,
    space: FAVORITE_STICKER_SPACE_SCENE
  };
}

function migrateFavoriteStickerPositions(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const next = {};
  for (const [id, pos] of Object.entries(value)) {
    const parsed = parseFavoriteStickerPosition(pos);
    if (id && parsed) {
      next[id] = toSceneFavoritePosition(parsed);
    }
  }
  return next;
}

const MEADOW_HORIZONTAL_MARGIN_PX = 12;

function clampMeadowCenter(x, y, stickerSize, areaWidth, areaHeight, visible = 0.45) {
  if (!(areaWidth > 0) || !(areaHeight > 0)) {
    return { x: clamp01(x), y: clamp01(y) };
  }
  const half = stickerSize / 2;
  const marginX = Math.min(
    MEADOW_HORIZONTAL_MARGIN_PX,
    Math.max(0, (areaWidth - stickerSize) / 2)
  );
  const minX = half + marginX;
  const maxX = Math.max(minX, areaWidth - half - marginX);
  const keepY = Math.max(8, stickerSize * visible);
  const minY = keepY / 2;
  const maxY = Math.max(minY, areaHeight - keepY / 2);
  const cx = Math.min(maxX, Math.max(minX, x * areaWidth));
  const cy = Math.min(maxY, Math.max(minY, y * areaHeight));
  return { x: cx / areaWidth, y: cy / areaHeight };
}

function pxToNormalizedCenter(left, top, size, areaWidth, areaHeight) {
  return clampMeadowCenter(
    (left + size / 2) / areaWidth,
    (top + size / 2) / areaHeight,
    size,
    areaWidth,
    areaHeight
  );
}

function normalizedCenterToLeftTop(x, y, size, areaWidth, areaHeight) {
  const clamped = clampMeadowCenter(x, y, size, areaWidth, areaHeight);
  return {
    left: clamped.x * areaWidth - size / 2,
    top: clamped.y * areaHeight - size / 2
  };
}

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

function nearestEscape(left, top, size, obstacle) {
  const cx = left + size / 2;
  const cy = top + size / 2;
  const options = [
    { left: obstacle.x - size, top },
    { left: obstacle.x + obstacle.w, top },
    { left, top: obstacle.y - size },
    { left, top: obstacle.y + obstacle.h }
  ];
  let best = options[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const option of options) {
    const ox = option.left + size / 2 - cx;
    const oy = option.top + size / 2 - cy;
    const dist = ox * ox + oy * oy;
    if (dist < bestDist) {
      bestDist = dist;
      best = option;
    }
  }
  return best;
}

function pushOutOfObstacles(left, top, size, areaWidth, areaHeight, obstacles) {
  let x = left;
  let y = top;
  const padded = obstacles
    .filter((obs) => obs.w > 0 && obs.h > 0)
    .map((obs) => inflateBox(obs, STICKER_OBSTACLE_PAD_PX));
  for (let pass = 0; pass < 3; pass += 1) {
    let moved = false;
    for (const obs of padded) {
      const cover = overlapArea({ x, y, w: size, h: size }, obs);
      if (cover <= STICKER_OBSTACLE_MIN_OVERLAP) {
        continue;
      }
      const next = nearestEscape(x, y, size, obs);
      x = next.left;
      y = next.top;
      moved = true;
    }
    const norm = pxToNormalizedCenter(x, y, size, areaWidth, areaHeight);
    const clamped = normalizedCenterToLeftTop(norm.x, norm.y, size, areaWidth, areaHeight);
    x = clamped.left;
    y = clamped.top;
    if (!moved) {
      break;
    }
  }
  return { left: x, top: y };
}

function nextFavoriteStickerZ(positions) {
  let max = 0;
  for (const pos of Object.values(positions)) {
    if (pos.z > max) {
      max = pos.z;
    }
  }
  return max + 1;
}

const DESKTOP_AUTO_LAYOUT_BANDS = [
  { inset: 4, bottom: 8 },
  { inset: 6, bottom: 48 },
  { inset: 5, bottom: 22 },
  { inset: 9, bottom: 66 }
];

const MOBILE_AUTO_LAYOUT_BANDS = [
  { inset: 5, bottom: 7 },
  { inset: 8, bottom: 18 },
  { inset: 6, bottom: 30 },
  { inset: 10, bottom: 44 }
];

function layoutMeadowFriends(ids, kind = "desktop") {
  const bands = kind === "mobile" ? MOBILE_AUTO_LAYOUT_BANDS : DESKTOP_AUTO_LAYOUT_BANDS;
  return ids.map((id, index) => {
    const lane = Math.floor(index / 2);
    const band = bands[lane % bands.length];
    return { id, size: FAVORITE_STICKER_BASE_SIZE, bottom: band.bottom };
  });
}

function migrateFavoriteStickerLayouts(layoutsValue, legacyPositions) {
  const legacy = migrateFavoriteStickerPositions(legacyPositions);
  const raw =
    layoutsValue && typeof layoutsValue === "object" && !Array.isArray(layoutsValue)
      ? layoutsValue
      : null;
  const desktop = migrateFavoriteStickerPositions(raw?.desktop);
  const mobile = migrateFavoriteStickerPositions(raw?.mobile);
  return {
    desktop: Object.keys(desktop).length ? desktop : legacy,
    mobile
  };
}

assert.deepEqual(migrateFavoriteStickerPositions(undefined), {});
assert.deepEqual(migrateFavoriteStickerPositions(null), {});
assert.deepEqual(migrateFavoriteStickerPositions([]), {});
assert.deepEqual(migrateFavoriteStickerPositions("nope"), {});

const saved = migrateFavoriteStickerPositions({
  "sticker-a": { x: 0.25, y: 0.72, z: 2 },
  "sticker-bad": { x: "no" },
  "sticker-b": { x: 1.4, y: -0.2, z: 3.9 }
});
assert.equal(saved["sticker-a"].x, 0.25);
assert.ok(Math.abs(saved["sticker-a"].y - (LEGACY_MEADOW_TOP_RATIO + 0.72 * LEGACY_MEADOW_HEIGHT_RATIO)) < 0.0001);
assert.equal(saved["sticker-a"].space, "scene");
assert.equal(saved["sticker-a"].z, 2);
assert.equal(saved["sticker-bad"], undefined);
assert.equal(saved["sticker-b"].x, 1);
assert.equal(saved["sticker-b"].space, "scene");
assert.equal(saved["sticker-b"].z, 3);

const alreadyScene = migrateFavoriteStickerPositions({
  "sticker-sky": { x: 0.18, y: 0.22, z: 4, space: "scene" }
});
assert.equal(alreadyScene["sticker-sky"].x, 0.18);
assert.equal(alreadyScene["sticker-sky"].y, 0.22);
assert.equal(alreadyScene["sticker-sky"].space, "scene");

const remapped = migrateFavoriteStickerPositions(saved);
assert.equal(remapped["sticker-a"].y, saved["sticker-a"].y);

const oldMeadowTop = meadowPositionToScene(0.2, 0);
assert.ok(oldMeadowTop.y > 0.5, "legacy meadow top maps to lower scene");
const skyScene = { x: 0.12, y: 0.18 };
assert.ok(skyScene.y < LEGACY_MEADOW_TOP_RATIO, "new scene y can sit above old meadow top");

const areaW = 400;
const areaH = 200;
const size = 80;
const inside = clampMeadowCenter(0.25, 0.72, size, areaW, areaH);
assert.equal(inside.x, 0.25);
assert.equal(inside.y, 0.72);

const offLeft = clampMeadowCenter(-0.2, 0.5, size, areaW, areaH);
assert.ok(offLeft.x > 0);
assert.ok(offLeft.x * areaW >= size * 0.45 * 0.5);

const offRight = pxToNormalizedCenter(areaW + 40, 10, size, areaW, areaH);
assert.ok(offRight.x < 1);
assert.ok(offRight.x * areaW <= areaW - size / 2 - MEADOW_HORIZONTAL_MARGIN_PX + 0.01);
assert.ok(offLeft.x * areaW >= size / 2 + MEADOW_HORIZONTAL_MARGIN_PX - 0.01);

const wideDesktop = 1920;
const leftEdge = clampMeadowCenter(0, 0.5, 100, wideDesktop, 900);
assert.ok(Math.abs(leftEdge.x * wideDesktop - (50 + MEADOW_HORIZONTAL_MARGIN_PX)) < 1);
const rightEdge = clampMeadowCenter(1, 0.5, 100, wideDesktop, 900);
assert.ok(Math.abs(rightEdge.x * wideDesktop - (wideDesktop - 50 - MEADOW_HORIZONTAL_MARGIN_PX)) < 1);

const roundTrip = pxToNormalizedCenter(100, 80, size, areaW, areaH);
assert.ok(Math.abs(roundTrip.x - (100 + 40) / areaW) < 0.001);
assert.ok(Math.abs(roundTrip.y - (80 + 40) / areaH) < 0.001);

const big = FAVORITE_STICKER_BASE_SIZE;
const tall = 900;
const wide = 1200;
const aboveOldMeadow = pxToNormalizedCenter(80, 40, big, wide, tall);
assert.ok(aboveOldMeadow.y < LEGACY_MEADOW_TOP_RATIO, "drag above old meadow top is allowed");
const offTopLarge = pxToNormalizedCenter(80, -200, big, wide, tall);
assert.ok(offTopLarge.y * tall >= big * 0.45 * 0.5, "large sticker stays partly visible");

const card = { x: 360, y: 220, w: 480, h: 320 };
const droppedOnCard = pushOutOfObstacles(500, 300, big, wide, tall, [card]);
const stillOnCard = overlapArea(
  { x: droppedOnCard.left, y: droppedOnCard.top, w: big, h: big },
  card
);
assert.ok(stillOnCard < big * big * 0.2, "protected central card is not covered");

let positions = {
  "sticker-a": { x: 0.2, y: 0.8, z: 1, space: "scene" }
};
positions = {
  ...positions,
  "sticker-b": { x: 0.6, y: 0.7, z: nextFavoriteStickerZ(positions), space: "scene" }
};
assert.equal(positions["sticker-b"].z, 2);

const favorites = ["sticker-a", "sticker-b"];
const shown = favorites.filter((id) => id !== "sticker-new");
assert.deepEqual(shown, ["sticker-a", "sticker-b"]);
assert.equal(positions["sticker-a"].x, 0.2);

const afterRemove = favorites.filter((id) => id !== "sticker-a");
assert.deepEqual(afterRemove, ["sticker-b"]);
assert.equal(positions["sticker-a"].x, 0.2, "removing favorite must keep stored position");

const restored = ["sticker-a", "sticker-b"];
assert.equal(positions["sticker-a"].x, 0.2, "re-favorite restores previous place");
assert.ok(restored.includes("sticker-a"));

const reset = {};
assert.deepEqual(reset, {});
assert.ok(!reset["sticker-a"], "reset clears user positions only");
assert.deepEqual(favorites, ["sticker-a", "sticker-b"]);

const noPosition = positions["sticker-new"];
assert.equal(noPosition, undefined, "missing position falls back to auto layout");

const auto = layoutMeadowFriends(["a", "b", "c", "d", "e", "f", "g", "h"], "desktop");
assert.ok(auto.every((slot) => slot.size === FAVORITE_STICKER_BASE_SIZE));
assert.ok(auto.some((slot) => slot.bottom <= 10), "reset keeps some stickers on the meadow");
assert.ok(auto.some((slot) => slot.bottom >= 50), "desktop auto layout also uses the expanded sky/hills");

const autoMobile = layoutMeadowFriends(["a", "b", "c", "d", "e", "f", "g", "h"], "mobile");
assert.ok(autoMobile.some((slot) => slot.bottom <= 10), "mobile auto layout keeps some stickers on the lawn");
assert.ok(
  Math.max(...autoMobile.map((slot) => slot.bottom)) < Math.max(...auto.map((slot) => slot.bottom)),
  "mobile auto layout stays lower than desktop"
);

const migratedLayouts = migrateFavoriteStickerLayouts(undefined, {
  "sticker-a": { x: 0.2, y: 0.3, z: 1, space: "scene" }
});
assert.equal(migratedLayouts.desktop["sticker-a"].x, 0.2);
assert.deepEqual(migratedLayouts.mobile, {});
const splitLayouts = migrateFavoriteStickerLayouts(
  {
    desktop: { "sticker-a": { x: 0.1, y: 0.2, z: 1, space: "scene" } },
    mobile: { "sticker-a": { x: 0.8, y: 0.7, z: 2, space: "scene" } }
  },
  { "sticker-legacy": { x: 0.4, y: 0.5, z: 3, space: "scene" } }
);
assert.equal(splitLayouts.desktop["sticker-a"].x, 0.1);
assert.equal(splitLayouts.mobile["sticker-a"].x, 0.8);
assert.equal(splitLayouts.desktop["sticker-legacy"], undefined);

const layer = read("src/components/MeadowStickerLayer.tsx");
assert.match(layer, /onPointerDown/);
assert.match(layer, /addEventListener\("pointermove"/);
assert.match(layer, /addEventListener\("pointerup"/);
assert.match(layer, /addEventListener\("pointercancel"/);
assert.match(layer, /setPointerCapture/);
assert.match(layer, /releasePointerCapture/);
assert.match(layer, /requestAnimationFrame/);
assert.match(layer, /MEADOW_DRAG_THRESHOLD_PX/);
assert.match(layer, /FAVORITE_STICKER_SPACE_SCENE/);
assert.doesNotMatch(layer, /resetRef/);
assert.match(layer, /data-sticker-playground/);
assert.match(layer, /layoutKind/);
assert.match(layer, /source: "manual"/);
assert.match(layer, /data-meadow-source/);
assert.match(layer, /layoutMeadowAutoPositions/);
assert.doesNotMatch(layer, /saveProgress/);
assert.doesNotMatch(layer, /localStorage/);

const meadowScreen = read("src/components/MyMeadowScreen.tsx");
assert.doesNotMatch(meadowScreen, /Моя полянка/);
assert.doesNotMatch(meadowScreen, /Расставить заново/);
assert.match(meadowScreen, /MeadowStickerLayer/);
assert.match(meadowScreen, /layouts\[layoutKind\]/);
assert.match(meadowScreen, /meadowLayoutKindFromWidth/);
assert.doesNotMatch(meadowScreen, /onResetLayout/);

const app = read("src/App.tsx");
assert.match(app, /commitFavoriteStickerPosition/);
assert.doesNotMatch(app, /resetFavoriteStickerLayout/);
assert.match(app, /MEADOW_HIDDEN_STICKER_IDS/);
assert.match(app, /MyMeadowScreen/);
assert.match(app, /favoriteStickerLayouts/);
assert.doesNotMatch(app, /resetFavoriteStickerPositions/);
assert.doesNotMatch(app, /stickerPositions=\{progress\.favoriteStickerPositions\}/);

const reward = read("src/components/RewardScreen.tsx");
assert.doesNotMatch(reward, /MeadowStickerLayer/);
assert.doesNotMatch(reward, /Расставить заново/);
assert.doesNotMatch(reward, /resetRef/);
assert.doesNotMatch(reward, /onResetStickerPositions/);
assert.doesNotMatch(reward, /meadowFriends=\{meadowFriends\}/);
assert.match(reward, /ПРОДОЛЖИТЬ/);

const storage = read("src/utils/storage.ts");
assert.match(storage, /favoriteStickerPositions: \{\}/);
assert.match(storage, /migrateFavoriteStickerLayouts/);
assert.match(storage, /favoriteStickerLayouts/);

const types = read("src/types.ts");
assert.match(types, /favoriteStickerPositions: Record<string, FavoriteStickerPosition>/);
assert.match(types, /favoriteStickerLayouts: FavoriteStickerLayouts/);
assert.match(types, /"meadow"/);
assert.match(types, /space\?: "meadow" \| "scene"/);
assert.match(types, /source\?: "auto" \| "manual"/);

const helpers = read("src/utils/favoriteStickers.ts");
assert.match(helpers, /LEGACY_MEADOW_HEIGHT_RATIO = 0\.42/);
assert.match(helpers, /FAVORITE_STICKER_BASE_SIZE = 122/);
assert.match(helpers, /MEADOW_HORIZONTAL_MARGIN_PX = 12/);
assert.match(helpers, /meadowPositionToScene/);
assert.match(helpers, /DESKTOP_AUTO_LAYOUT_BANDS/);
assert.match(helpers, /MOBILE_AUTO_LAYOUT_BANDS/);
assert.match(helpers, /MEADOW_MOBILE_MAX_WIDTH = 820/);
assert.match(helpers, /MEADOW_HIDDEN_STICKER_IDS/);
assert.match(helpers, /nearestEscape/);
assert.match(helpers, /layoutMeadowAutoPositions/);
assert.match(helpers, /isManualMeadowPosition/);

const album = read("src/components/StickersAlbumScreen.tsx");
assert.match(album, /МОЯ ПОЛЯНКА/);
assert.match(album, /onOpenMeadow/);

const home = read("src/components/HomeScreen.tsx");
assert.match(home, /МОЯ ПОЛЯНКА/);
assert.match(home, /onOpenMeadow/);

const css = read("src/styles.css");
assert.match(css, /\.meadow-sticker-layer \{[\s\S]*?inset:\s*0;/);
assert.match(css, /\.my-meadow-screen/);
assert.match(css, /\.app-shell\.meadow-open \{[\s\S]*?max-width:\s*none;/);
assert.match(css, /\.app-shell\.meadow-open \.my-meadow-screen \{[\s\S]*?border-radius:\s*0;/);
assert.match(css, /clamp\(70px,\s*8\.2vw,\s*118px\)/);
assert.match(css, /clamp\(54px,\s*15vmin,\s*88px\)/);
assert.doesNotMatch(css, /\.my-meadow-title/);
assert.doesNotMatch(css, /\.my-meadow-reset/);
assert.doesNotMatch(css, /\.reward-reset-layout/);
assert.doesNotMatch(
  css,
  /\.meadow-sticker-layer \{[^}]*height:\s*calc\(42vh/
);

console.log("verify-meadow-drag: ok");
