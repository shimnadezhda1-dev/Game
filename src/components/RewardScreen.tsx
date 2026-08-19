import { Character } from "./Character";

interface RewardScreenProps {
  stars: number;
  onClose: () => void;
}

export function RewardScreen({ stars, onClose }: RewardScreenProps) {
  return (
    <div className="screen reward-screen">
      <div className="confetti" aria-hidden>
        ✨ ⭐ ✨ ⭐ ✨
      </div>
      <Character mood="happy" message="Ты супер!" />
      <h2 className="title">Ура!</h2>
      <div className="reward-text">Ты заработал новую звёздочку!</div>
      <div className="stars-count">Всего звёзд: {stars}</div>
      <button className="play-btn" onClick={onClose}>
        Продолжить
      </button>
    </div>
  );
}
