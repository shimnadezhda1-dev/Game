const stickerModules = import.meta.glob("../../public/assets/stickers/**/*.{png,webp,jpg,jpeg,svg,gif}", {
  eager: true,
  query: "?url",
  import: "default"
}) as Record<string, string>;

const fromGlob = new Set(
  Object.keys(stickerModules).map((key) => {
    const marker = "/stickers/";
    const at = key.replace(/\\/g, "/").lastIndexOf(marker);
    const file = at >= 0 ? key.slice(at + marker.length) : key.split("/").pop() ?? "";
    return `/assets/stickers/${file}`;
  })
);

const EXTRA_EXISTING_ASSETS = new Set([
  "/assets/character/fox-celebrate.webp",
  "/assets/ui/rewards-chest.webp",
  "/assets/ui/stars.webp",
  "/assets/home/sun-smiling.webp",
  "/assets/character/fox-happy.webp",
  "/assets/stickers/sun-new.png"
]);

/** Backup paths, kept in sync with VISIBLE_STICKER_ART titles in stickerCatalog.ts. */
const PREVIEW_FALLBACK_BY_ID: Record<string, string> = {
  "sticker-01": "/assets/stickers/final/universal/squirrel-acorn.png",
  "sticker-02": "/assets/stickers/final/universal/hummingbird.png",
  "sticker-03": "/assets/stickers/final/girls/star.png",
  "sticker-04": "/assets/stickers/final/boys/treasure-chest.png"
};

export function stickerAssetExists(path: string | null | undefined): boolean {
  if (!path) {
    return false;
  }
  if (fromGlob.has(path) || EXTRA_EXISTING_ASSETS.has(path)) {
    return true;
  }
  const normalized = path.replace(/^\//, "/");
  return fromGlob.has(normalized);
}

export function resolveStickerAsset(id: string, catalogPath: string | null | undefined): string | null {
  if (catalogPath && stickerAssetExists(catalogPath)) {
    return catalogPath;
  }
  const fallback = PREVIEW_FALLBACK_BY_ID[id];
  if (fallback && stickerAssetExists(fallback)) {
    return fallback;
  }
  return catalogPath ?? null;
}

export function existingStickerAssetCount(): number {
  return fromGlob.size;
}
