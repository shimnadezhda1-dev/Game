import { Character } from "./Character";
import { WorldBackground } from "./WorldBackground";
import { assetUrl, ASSETS } from "../utils/assets";

interface RewardScreenProps {
  stars: number;
  onClose: () => void;
}

export function RewardScreen({ stars, onClose }: RewardScreenProps) {
  return (
    <div className="screen reward-screen">
      <WorldBackground variant="cover" />
      <div className="reward-veil" />
      <div className="confetti-layer" aria-hidden>
        {Array.from({ length: 14 }).map((_, index) => (
          <span key={index} className={`confetti-bit bit-${index % 6}`} />
        ))}
      </div>
      <Character mood="celebrate" size="hero" message="Ты супер!" />
      <img className="reward-star" src={assetUrl(ASSETS.ui.stars)} alt="" draggable={false} />
      <h2 className="title reward-ura">УРА!</h2>
      <div className="reward-text">Ты заработал звёздочку!</div>
      <div className="stars-count">★ {stars}</div>
      <button className="play-btn" onClick={onClose}>
        ИГРАТЬ ДАЛЬШЕ →
      </button>
    </div>
  );
}
