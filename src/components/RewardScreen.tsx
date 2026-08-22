import { Character } from "./Character";
import { WorldBackground } from "./WorldBackground";
import { NextArrowIcon } from "./ToyIcons";

interface RewardScreenProps {
  stars: number;
  title?: string;
  text?: string;
  onClose: () => void;
}

export function RewardScreen({ stars, onClose }: RewardScreenProps) {
  return (
    <div className="screen reward-screen">
      <WorldBackground variant="play" />
      <div className="confetti-layer reward-confetti" aria-hidden>
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index} className={`confetti-bit bit-${index % 6}`} />
        ))}
      </div>
      <Character mood="celebrate" size="hero" />
      <div className="gold-star" aria-hidden="true" />
      <div className="stars-big">{stars}</div>
      <button className="nav-arrow nav-next adventure-go" onClick={onClose} aria-label="Дальше">
        <NextArrowIcon />
      </button>
    </div>
  );
}
