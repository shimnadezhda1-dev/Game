import { Character } from "./Character";
import { WorldBackground } from "./WorldBackground";
import { TitleStyleLetters } from "./GameTitle";
import { ALPHABET_ACHIEVEMENT_STICKER, resolvedSticker } from "../data/stickerCatalog";
import { stickerAssetExists } from "../data/stickerAssets";
import { assetUrl } from "../utils/assets";

interface AlphabetCompleteScreenProps {
  isNewAchievement: boolean;
  onStartNewAdventure: () => void;
}

export function AlphabetCompleteScreen({
  isNewAchievement,
  onStartNewAdventure
}: AlphabetCompleteScreenProps) {
  const achievement = resolvedSticker(ALPHABET_ACHIEVEMENT_STICKER);

  return (
    <div className="screen alphabet-complete" role="dialog" aria-modal="true">
      <WorldBackground variant="play" />
      <div className="confetti-layer reward-confetti" aria-hidden>
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index} className={`confetti-bit bit-${index % 6}`} />
        ))}
      </div>
      <Character mood="celebrate" size="hero" />
      <section className="alphabet-complete__card">
        <h1>Ура! Ты прошёл весь алфавит!</h1>
        {isNewAchievement ? (
          <>
            {stickerAssetExists(achievement.asset) ? (
              <img
                className="alphabet-complete__sticker"
                src={assetUrl(achievement.asset ?? "")}
                alt=""
                draggable={false}
              />
            ) : null}
            <p className="alphabet-complete__prize">{achievement.title}</p>
          </>
        ) : (
          <p className="alphabet-complete__prize">Молодец! Можно начать новое приключение.</p>
        )}
        <button type="button" className="alphabet-complete__start" onClick={onStartNewAdventure}>
          <TitleStyleLetters text="НАЧАТЬ НОВОЕ ПРИКЛЮЧЕНИЕ" className="reward-continue-letter" />
        </button>
      </section>
    </div>
  );
}
