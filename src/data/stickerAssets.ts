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
  "/assets/home/rainbow-clean.png",
  "/assets/character/fox-happy.webp"
]);

/** Used only until real files appear in /assets/stickers/. Not duplicated across the catalog. */
const PREVIEW_FALLBACK_BY_ID: Record<string, string> = {
  "sticker-01": "/assets/home/sun-smiling.webp",
  "sticker-02": "/assets/home/rainbow-clean.png",
  "sticker-03": "/assets/ui/stars.webp",
  "sticker-04": "/assets/ui/rewards-chest.webp"
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
