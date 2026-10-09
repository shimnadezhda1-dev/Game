import type {
  FavoriteStickerLayouts,
  FavoriteStickerPosition,
  MeadowLayoutKind,
  MeadowTheme
} from "../types";
import { uniqueIds } from "./stickerLogic";

export const MEADOW_VISIBLE_FRACTION = 0.45;
export const MEADOW_HORIZONTAL_MARGIN_PX = 12;
export const MEADOW_AUTO_GAP_PX = 10;
export const MEADOW_AUTO_GAP_MIN_PX = 6;
export const MEADOW_AUTO_MAX_ATTEMPTS = 80;
export const MEADOW_DRAG_THRESHOLD_PX = 8;
export const LEGACY_MEADOW_HEIGHT_RATIO = 0.42;
export const LEGACY_MEADOW_TOP_RATIO = 1 - LEGACY_MEADOW_HEIGHT_RATIO;
export const FAVORITE_STICKER_SPACE_SCENE = "scene" as const;
export const FAVORITE_STICKER_BASE_SIZE = 122;
export const STICKER_OBSTACLE_PAD_PX = 8;
export const STICKER_OBSTACLE_MIN_OVERLAP = 4;
export const MEADOW_MOBILE_MAX_WIDTH = 820;
/** Shown in the album, but never as a draggable friend on «Моя полянка». */
export const MEADOW_HIDDEN_STICKER_IDS = new Set<string>();
export const MEADOW_STAR_COUNT_DESKTOP = 28;
export const MEADOW_STAR_COUNT_MOBILE = 16;
export const MEADOW_THEME_TRANSITION_MS = 650;

export function parseMeadowTheme(value: unknown): MeadowTheme {
  return value === "night" ? "night" : "day";
}

export interface MeadowStar {
  id: number;
  x: number;
  y: number;
  size: number;
  twinkle: boolean;
  delay: number;
}

export function layoutMeadowStars(count: number): MeadowStar[] {
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

export interface MeadowFriendSlot {
  id: string;
  side: "left" | "right";
  inset: number;
  bottom: number;
  size: number;
  delay: number;
  tilt: number;
}

export function migrateFavoriteStickerIds(args: {
  favoriteStickerId?: unknown;
  favoriteStickerIds?: unknown;
  unlockedStickerIds: readonly string[];
}): { favoriteStickerIds: string[]; favoriteStickerId: string | null } {
  const unlocked = new Set(args.unlockedStickerIds);
  const fromList = Array.isArray(args.favoriteStickerIds)
    ? args.favoriteStickerIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
  const legacy = typeof args.favoriteStickerId === "string" ? args.favoriteStickerId : null;
  const favoriteStickerIds = uniqueIds([
    ...fromList,
    ...(legacy ? [legacy] : [])
  ]).filter((id) => unlocked.has(id));
  return {
    favoriteStickerIds,
    favoriteStickerId: favoriteStickerIds[0] ?? null
  };
}

export function toggleFavoriteStickerId(
  current: readonly string[],
  id: string,
  unlockedStickerIds: readonly string[]
): string[] {
  if (!unlockedStickerIds.includes(id)) {
    return uniqueIds(current);
  }
  if (current.includes(id)) {
    return current.filter((item) => item !== id);
  }
  return uniqueIds([...current, id]);
}

export function meadowFavoriteIds(
  favoriteStickerIds: readonly string[],
  currentRewardId?: string | null
): string[] {
  return favoriteStickerIds.filter((id) => id !== currentRewardId);
}

const DESKTOP_AUTO_LAYOUT_BANDS = [
  { inset: 4, bottom: 8 },
  { inset: 6, bottom: 48 },
  { inset: 5, bottom: 22 },
  { inset: 9, bottom: 66 }
] as const;

const MOBILE_AUTO_LAYOUT_BANDS = [
  { inset: 5, bottom: 7 },
  { inset: 8, bottom: 18 },
  { inset: 6, bottom: 30 },
  { inset: 10, bottom: 44 }
] as const;

export function meadowLayoutKindFromWidth(width: number): MeadowLayoutKind {
  return width <= MEADOW_MOBILE_MAX_WIDTH ? "mobile" : "desktop";
}

export function emptyFavoriteStickerLayouts(): FavoriteStickerLayouts {
  return { desktop: {}, mobile: {} };
}

export function migrateFavoriteStickerLayouts(
  layoutsValue: unknown,
  legacyPositions: unknown
): FavoriteStickerLayouts {
  const legacy = migrateFavoriteStickerPositions(legacyPositions);
  const raw =
    layoutsValue && typeof layoutsValue === "object" && !Array.isArray(layoutsValue)
      ? (layoutsValue as { desktop?: unknown; mobile?: unknown })
      : null;
  const desktop = migrateFavoriteStickerPositions(raw?.desktop);
  const mobile = migrateFavoriteStickerPositions(raw?.mobile);
  return {
    desktop: Object.keys(desktop).length ? desktop : legacy,
    mobile
  };
}

export function layoutMeadowFriends(
  ids: readonly string[],
  kind: MeadowLayoutKind = "desktop"
): MeadowFriendSlot[] {
  const count = ids.length;
  const size = FAVORITE_STICKER_BASE_SIZE;
  const columns = count <= 4 ? 1 : count <= 8 ? 2 : count <= 16 ? 3 : 4;
  const bands = kind === "mobile" ? MOBILE_AUTO_LAYOUT_BANDS : DESKTOP_AUTO_LAYOUT_BANDS;
  return ids.map((id, index) => {
    const side: "left" | "right" = index % 2 === 0 ? "left" : "right";
    const lane = Math.floor(index / 2);
    const column = lane % columns;
    const band = bands[lane % bands.length];
    return {
      id,
      side,
      inset: band.inset + column * (kind === "mobile" ? 7 : 9) + (lane % 2) * 1.5,
      bottom: band.bottom + (column % 2) * 3,
      size,
      delay: (index % 7) * 0.38,
      tilt: side === "left" ? -8 + (lane % 3) * 4 : 7 - (column % 3) * 3
    };
  });
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

export function parseFavoriteStickerPosition(value: unknown): FavoriteStickerPosition | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const raw = value as {
    x?: unknown;
    y?: unknown;
    z?: unknown;
    space?: unknown;
    source?: unknown;
  };
  const x = typeof raw.x === "number" ? raw.x : Number(raw.x);
  const y = typeof raw.y === "number" ? raw.y : Number(raw.y);
  const z = typeof raw.z === "number" ? raw.z : Number(raw.z);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  const space = raw.space === "scene" || raw.space === "meadow" ? raw.space : undefined;
  const source = raw.source === "auto" || raw.source === "manual" ? raw.source : undefined;
  return {
    x: clamp01(x),
    y: clamp01(y),
    z: Number.isFinite(z) ? Math.max(0, Math.floor(z)) : 0,
    ...(space ? { space } : {}),
    ...(source ? { source } : {})
  };
}

export function meadowPositionToScene(x: number, y: number): { x: number; y: number } {
  return {
    x: clamp01(x),
    y: clamp01(LEGACY_MEADOW_TOP_RATIO + clamp01(y) * LEGACY_MEADOW_HEIGHT_RATIO)
  };
}

export function toSceneFavoritePosition(
  position: FavoriteStickerPosition
): FavoriteStickerPosition {
  if (position.space === FAVORITE_STICKER_SPACE_SCENE) {
    return {
      x: clamp01(position.x),
      y: clamp01(position.y),
      z: position.z,
      space: FAVORITE_STICKER_SPACE_SCENE,
      ...(position.source ? { source: position.source } : {})
    };
  }
  const mapped = meadowPositionToScene(position.x, position.y);
  return {
    x: mapped.x,
    y: mapped.y,
    z: position.z,
    space: FAVORITE_STICKER_SPACE_SCENE,
    ...(position.source ? { source: position.source } : {})
  };
}

export function migrateFavoriteStickerPositions(
  value: unknown
): Record<string, FavoriteStickerPosition> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const next: Record<string, FavoriteStickerPosition> = {};
  for (const [id, pos] of Object.entries(value as Record<string, unknown>)) {
    if (!id) {
      continue;
    }
    const parsed = parseFavoriteStickerPosition(pos);
    if (parsed) {
      next[id] = toSceneFavoritePosition(parsed);
    }
  }
  return next;
}

export function nextFavoriteStickerZ(
  positions: Record<string, FavoriteStickerPosition>
): number {
  let max = 0;
  for (const pos of Object.values(positions)) {
    if (pos.z > max) {
      max = pos.z;
    }
  }
  return max + 1;
}

export function clampMeadowCenter(
  x: number,
  y: number,
  stickerSize: number,
  areaWidth: number,
  areaHeight: number,
  visible = MEADOW_VISIBLE_FRACTION
): { x: number; y: number } {
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

export function pxToNormalizedCenter(
  left: number,
  top: number,
  size: number,
  areaWidth: number,
  areaHeight: number
): { x: number; y: number } {
  if (!(areaWidth > 0) || !(areaHeight > 0)) {
    return { x: 0.5, y: 0.75 };
  }
  return clampMeadowCenter(
    (left + size / 2) / areaWidth,
    (top + size / 2) / areaHeight,
    size,
    areaWidth,
    areaHeight
  );
}

export function normalizedCenterToLeftTop(
  x: number,
  y: number,
  size: number,
  areaWidth: number,
  areaHeight: number
): { left: number; top: number } {
  const clamped = clampMeadowCenter(x, y, size, areaWidth, areaHeight);
  return {
    left: clamped.x * areaWidth - size / 2,
    top: clamped.y * areaHeight - size / 2
  };
}

export interface MeadowBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function overlapArea(a: MeadowBox, b: MeadowBox): number {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return x * y;
}

function inflateBox(box: MeadowBox, pad: number): MeadowBox {
  return {
    x: box.x - pad,
    y: box.y - pad,
    w: box.w + pad * 2,
    h: box.h + pad * 2
  };
}

function nearestEscape(
  left: number,
  top: number,
  size: number,
  obstacle: MeadowBox
): { left: number; top: number } {
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

export function pushOutOfObstacles(
  left: number,
  top: number,
  size: number,
  areaWidth: number,
  areaHeight: number,
  obstacles: MeadowBox[]
): { left: number; top: number } {
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

export function isManualMeadowPosition(
  position: FavoriteStickerPosition | null | undefined
): boolean {
  if (!position) {
    return false;
  }
  return position.source !== "auto";
}

export function meadowAutoStickerSize(
  kind: MeadowLayoutKind,
  areaWidth: number,
  areaHeight: number
): number {
  if (kind === "mobile") {
    const vmin = Math.min(areaWidth, areaHeight);
    return Math.min(88, Math.max(54, 0.15 * vmin));
  }
  return Math.min(118, Math.max(70, 0.082 * areaWidth));
}

export function boxesOverlap(a: MeadowBox, b: MeadowBox, gap = 0): boolean {
  if (gap <= 0) {
    return overlapArea(a, b) > 0;
  }
  return overlapArea(inflateBox(a, gap / 2), inflateBox(b, gap / 2)) > 0;
}

export interface MeadowAutoPlacement {
  id: string;
  x: number;
  y: number;
  size: number;
  side: "left" | "right";
  delay: number;
  tilt: number;
}

function centerToBox(
  x: number,
  y: number,
  size: number,
  areaWidth: number,
  areaHeight: number
): MeadowBox {
  return {
    x: x * areaWidth - size / 2,
    y: y * areaHeight - size / 2,
    w: size,
    h: size
  };
}

function buildAutoSlots(
  areaWidth: number,
  areaHeight: number,
  size: number,
  gap: number,
  margin: number
): Array<{ left: number; top: number }> {
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
  const slots: Array<{ left: number; top: number }> = [];
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

export function layoutMeadowAutoPositions(
  ids: readonly string[],
  kind: MeadowLayoutKind,
  areaWidth: number,
  areaHeight: number,
  occupiedCenters: readonly { x: number; y: number; size?: number }[] = []
): MeadowAutoPlacement[] {
  if (!ids.length || !(areaWidth > 0) || !(areaHeight > 0)) {
    return [];
  }
  const minSize = kind === "mobile" ? 48 : 58;
  let size = meadowAutoStickerSize(kind, areaWidth, areaHeight);
  let gap = MEADOW_AUTO_GAP_PX;
  const margin = MEADOW_HORIZONTAL_MARGIN_PX;

  const tryPlace = (sizeTry: number, gapTry: number): MeadowAutoPlacement[] | null => {
    const occupied: MeadowBox[] = occupiedCenters.map((item) =>
      centerToBox(item.x, item.y, item.size ?? sizeTry, areaWidth, areaHeight)
    );
    const slots = buildAutoSlots(areaWidth, areaHeight, sizeTry, gapTry, margin);
    const placed: MeadowAutoPlacement[] = [];
    let slotIndex = 0;
    for (let i = 0; i < ids.length; i += 1) {
      let found: { left: number; top: number } | null = null;
      let attempts = 0;
      while (slotIndex < slots.length && attempts < MEADOW_AUTO_MAX_ATTEMPTS) {
        const slot = slots[slotIndex];
        slotIndex += 1;
        attempts += 1;
        const maxLeft = Math.max(margin, areaWidth - margin - sizeTry);
        const maxTop = Math.max(margin, areaHeight - margin - sizeTry);
        const left = Math.min(Math.max(margin, slot.left), maxLeft);
        const top = Math.min(Math.max(margin, slot.top), maxTop);
        const box: MeadowBox = { x: left, y: top, w: sizeTry, h: sizeTry };
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
      const side: "left" | "right" = found.left + sizeTry / 2 < areaWidth / 2 ? "left" : "right";
      placed.push({
        id: ids[i],
        x: (found.left + sizeTry / 2) / areaWidth,
        y: (found.top + sizeTry / 2) / areaHeight,
        size: sizeTry,
        side,
        delay: (i % 7) * 0.38,
        tilt: side === "left" ? -8 + (i % 3) * 4 : 7 - (i % 3) * 3
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
