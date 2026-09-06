import { Character } from "./Character";
import { WorldBackground } from "./WorldBackground";
import { NextArrowIcon } from "./ToyIcons";
import { GoldStar } from "./GoldStar";

interface RewardScreenProps {
  stars: number;
  title?: string;
  rewardName?: string;
  rewardId?: string;
  onClose: () => void;
}

export function RewardScreen({ stars, title, rewardName, rewardId, onClose }: RewardScreenProps) {
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
        <div className={`reward-showcase ${rewardId ? `reward-${rewardId}` : ""}`} aria-hidden="true">
          <span className="reward-showcase-star">★</span>
        </div>
        {rewardName ? <p className="reward-name">{rewardName}</p> : null}
        <div className="reward-achievement" aria-label={`Звёзды: ${stars}`}>
          <GoldStar size="tiny" />
          <span>{stars}</span>
        </div>
      </section>
      <button className="nav-arrow nav-next adventure-go" onClick={onClose} aria-label="Дальше">
        <NextArrowIcon />
      </button>
    </div>
  );
}
