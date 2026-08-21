import { Character } from "./Character";
import { WorldBackground } from "./WorldBackground";
import { assetUrl, ASSETS } from "../utils/assets";

interface RewardScreenProps {
  stars: number;
  title?: string;
  text?: string;
  onClose: () => void;
}

export function RewardScreen({
  stars,
  title = "УРА!",
  text = "Ты заработал звёздочку!",
  onClose
}: RewardScreenProps) {
  return (
    <div className="screen reward-screen">
      <WorldBackground variant="play" />
      <div className="confetti-layer" aria-hidden>
        {Array.from({ length: 14 }).map((_, index) => (
          <span key={index} className={`confetti-bit bit-${index % 6}`} />
        ))}
      </div>
      <Character mood="celebrate" size="hero" message="Ты супер!" />
      <img className="reward-star" src={assetUrl(ASSETS.ui.rewards)} alt="" draggable={false} />
      <h2 className="title reward-ura">{title}</h2>
      <div className="reward-text">{text}</div>
      <div className="stars-count">★ {stars}</div>
      <button className="nav-arrow nav-next adventure-go" onClick={onClose} aria-label="Дальше">
        →
      </button>
    </div>
  );
}
