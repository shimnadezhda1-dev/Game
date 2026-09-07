import { GoldStar } from "./GoldStar";
import { Character } from "./Character";
import { WorldBackground } from "./WorldBackground";
import { NextArrowIcon } from "./ToyIcons";
import { RewardItem } from "../data/rewardCatalog";
import { assetUrl } from "../utils/assets";

interface RewardScreenProps {
  threshold: number;
  title?: string;
  reward: RewardItem;
  onClose: () => void;
}

export function RewardScreen({
  threshold,
  title = "Ура! Новая наклейка!",
  reward,
  onClose
}: RewardScreenProps) {
  return (
    <div className="screen reward-screen reward-overlay" role="dialog" aria-modal="true">
      <WorldBackground variant="play" />
      <div className="confetti-layer reward-confetti" aria-hidden>
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index} className={`confetti-bit bit-${index % 6}`} />
        ))}
      </div>
      <Character mood="celebrate" size="hero" />
      <section className="reward-card">
        <h1 className="reward-title">{title}</h1>
        <div
          className={`reward-showcase reward-${reward.fallbackVisual}`}
          aria-hidden="true"
        >
          {reward.asset ? (
            <img
              className="reward-showcase-art"
              src={assetUrl(reward.asset)}
              alt=""
              draggable={false}
            />
          ) : (
            <span className="reward-showcase-star">★</span>
          )}
        </div>
        <p className="reward-name">{reward.title}</p>
        {reward.collectionTitle ? (
          <p className="reward-collection">{reward.collectionTitle}</p>
        ) : null}
        <div className="reward-achievement" aria-label={`${threshold} звёзд`}>
          <GoldStar size="tiny" />
          <span>{threshold}</span>
        </div>
      </section>
      <button className="nav-arrow nav-next adventure-go" onClick={onClose} aria-label="Дальше">
        <NextArrowIcon />
      </button>
    </div>
  );
}
