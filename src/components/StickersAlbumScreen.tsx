import { useMemo, useState } from "react";
import { ProgressState } from "../types";
import {
  albumCollections,
  ALPHABET_ACHIEVEMENT_STICKER,
  getStickerById,
  resolvedSticker,
  stickersInCollection,
  type StickerItem
} from "../data/stickerCatalog";
import { stickerAssetExists } from "../data/stickerAssets";
import { assetUrl } from "../utils/assets";

interface StickersAlbumScreenProps {
  progress: ProgressState;
  onBack: () => void;
  onSetFavorite: (id: string) => void;
}

export function StickersAlbumScreen({ progress, onSetFavorite }: StickersAlbumScreenProps) {
  const [preview, setPreview] = useState<StickerItem | null>(null);
  const unlocked = useMemo(() => new Set(progress.unlockedStickerIds), [progress.unlockedStickerIds]);
  const favorites = useMemo(() => new Set(progress.favoriteStickerIds), [progress.favoriteStickerIds]);
  const albumStickers = useMemo(() => {
    const regular = albumCollections().flatMap((collection) => stickersInCollection(collection.id));
    return [...regular, ALPHABET_ACHIEVEMENT_STICKER].map((item) => resolvedSticker(item));
  }, []);
  const collected = albumStickers.filter((item) => unlocked.has(item.id)).length;

  return (
    <div className="screen stickers-album">
      <h1 className="stickers-album__title">Мои наклейки</h1>
      <p className="stickers-album__total">
        Собрано: {collected} из {albumStickers.length}
      </p>
      <div className="stickers-album__collections">
        <div className="sticker-collection__grid">
          {albumStickers.map((item) => {
            const isOpen = unlocked.has(item.id);
            const isFavorite = isOpen && favorites.has(item.id);
            const hasArt = stickerAssetExists(item.asset);
            return (
              <button
                key={item.id}
                type="button"
                className={`sticker-slot ${isOpen ? "is-open" : "is-locked"}${isFavorite ? " is-favorite" : ""}`}
                onClick={() => (isOpen ? setPreview(item) : undefined)}
                aria-label={isOpen ? item.title : "Ещё не получена"}
              >
                {hasArt ? (
                  <img src={assetUrl(item.asset ?? "")} alt="" draggable={false} />
                ) : (
                  <span className="sticker-slot__fallback" aria-hidden="true">
                    ★
                  </span>
                )}
                {isOpen ? null : (
                  <span className="sticker-slot__lock" aria-hidden="true">
                    🔒
                  </span>
                )}
                {isFavorite ? (
                  <span className="sticker-slot__heart" aria-hidden="true">
                    ♥
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      {preview ? (
        <div className="sticker-preview" role="dialog" aria-modal="true" aria-label={preview.title}>
          <button type="button" className="sticker-preview__backdrop" onClick={() => setPreview(null)} />
          <div className="sticker-preview__card">
            {stickerAssetExists(preview.asset) ? (
              <img src={assetUrl(preview.asset ?? "")} alt="" draggable={false} />
            ) : (
              <span className="sticker-slot__fallback">★</span>
            )}
            <h3>{preview.title}</h3>
            <button
              type="button"
              className={`sticker-preview__favorite${
                progress.favoriteStickerIds.includes(preview.id) ? " is-favorite" : ""
              }`}
              aria-pressed={progress.favoriteStickerIds.includes(preview.id)}
              onClick={() => onSetFavorite(preview.id)}
            >
              {progress.favoriteStickerIds.includes(preview.id) ? "♥ Убрать из любимых" : "♡ В любимые"}
            </button>
            <button type="button" className="sticker-preview__close" onClick={() => setPreview(null)}>
              Закрыть
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function favoriteStickerItem(favoriteId: string | null): StickerItem | undefined {
  if (!favoriteId) {
    return undefined;
  }
  const item = getStickerById(favoriteId);
  return item ? resolvedSticker(item) : undefined;
}
