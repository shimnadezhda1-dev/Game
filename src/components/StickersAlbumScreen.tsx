import { useMemo, useState } from "react";
import { ProgressState } from "../types";
import {
  albumCollections,
  ALPHABET_ACHIEVEMENT_STICKER,
  collectionCounts,
  getStickerById,
  resolvedSticker,
  stickersInCollection,
  type StickerItem
} from "../data/stickerCatalog";
import { stickerAssetExists } from "../data/stickerAssets";
import { assetUrl } from "../utils/assets";
import { HomeButton } from "./HomeButton";

interface StickersAlbumScreenProps {
  progress: ProgressState;
  onBack: () => void;
  onSetFavorite: (id: string) => void;
}

export function StickersAlbumScreen({ progress, onBack, onSetFavorite }: StickersAlbumScreenProps) {
  const [preview, setPreview] = useState<StickerItem | null>(null);
  const unlocked = useMemo(() => new Set(progress.unlockedStickerIds), [progress.unlockedStickerIds]);
  const collections = albumCollections();
  const allRegular = collections.flatMap((collection) => stickersInCollection(collection.id));
  const unlockedRegular = allRegular.filter((item) => unlocked.has(item.id)).length;
  const achievement = resolvedSticker(ALPHABET_ACHIEVEMENT_STICKER);
  const achievementUnlocked = unlocked.has(achievement.id);

  return (
    <div className="screen stickers-album">
      <img
        className="stickers-album__sun"
        src={assetUrl("/assets/stickers-page/sun.png")}
        alt=""
        draggable={false}
      />
      <HomeButton onClick={onBack} />
      <h1 className="stickers-album__title">Мои наклейки</h1>
      <p className="stickers-album__total">
        Собрано: {unlockedRegular} из {allRegular.length}
      </p>
      <div className="stickers-album__collections">
        {collections.map((collection) => {
          const counts = collectionCounts(collection.id, progress.unlockedStickerIds);
          const items = stickersInCollection(collection.id);
          return (
            <section key={collection.id} className="sticker-collection">
              <header className="sticker-collection__head">
                <h2>{collection.title}</h2>
                <span>
                  {counts.unlocked} / {counts.total}
                </span>
              </header>
              <div className="sticker-collection__grid">
                {items.map((item) => {
                  const resolved = resolvedSticker(item);
                  const isOpen = unlocked.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`sticker-slot ${isOpen ? "is-open" : "is-locked"}`}
                      onClick={() => (isOpen ? setPreview(resolved) : undefined)}
                      aria-label={isOpen ? resolved.title : "Ещё не получена"}
                    >
                      {isOpen && stickerAssetExists(resolved.asset) ? (
                        <img src={assetUrl(resolved.asset ?? "")} alt="" draggable={false} />
                      ) : isOpen ? (
                        <span className="sticker-slot__fallback" aria-hidden="true">
                          ★
                        </span>
                      ) : (
                        <span className="sticker-slot__lock" aria-hidden="true">
                          🔒
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
        <section className="sticker-collection">
          <header className="sticker-collection__head">
            <h2>{achievement.collectionTitle}</h2>
            <span>{achievementUnlocked ? 1 : 0} / 1</span>
          </header>
          <div className="sticker-collection__grid sticker-collection__grid--single">
            <button
              type="button"
              className={`sticker-slot ${achievementUnlocked ? "is-open" : "is-locked"}`}
              onClick={() => (achievementUnlocked ? setPreview(achievement) : undefined)}
              aria-label={achievementUnlocked ? achievement.title : "Ещё не получена"}
            >
              {achievementUnlocked && stickerAssetExists(achievement.asset) ? (
                <img src={assetUrl(achievement.asset ?? "")} alt="" draggable={false} />
              ) : (
                <span className="sticker-slot__lock" aria-hidden="true">
                  🔒
                </span>
              )}
            </button>
          </div>
        </section>
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
              className="sticker-preview__favorite"
              onClick={() => onSetFavorite(preview.id)}
            >
              {progress.favoriteStickerId === preview.id ? "Любимая" : "Сделать любимой"}
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
