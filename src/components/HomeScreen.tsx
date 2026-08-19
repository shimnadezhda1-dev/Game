import { Character } from "./Character";

interface HomeScreenProps {
  onGoLearn: () => void;
  onPlayGames: () => void;
  onOpenStars: () => void;
}

export function HomeScreen({
  onGoLearn,
  onPlayGames,
  onOpenStars
}: HomeScreenProps) {
  return (
    <div className="screen home-screen">
      <div className="decor decor-one" />
      <div className="decor decor-two" />
      <Character mood="happy" message="Привет! Давай играть!" />
      <h1 className="title">Весёлый алфавит</h1>
      <p className="subtitle">Играем и учим русские буквы</p>
      <button className="play-btn" onClick={onGoLearn}>
        Играть
      </button>
      <div className="menu-grid">
        <button className="menu-btn menu-learn" onClick={onGoLearn}>
          <span className="menu-icon letters-badge" aria-hidden>
            АБВ
          </span>
          Учим буквы
        </button>
        <button className="menu-btn menu-play" onClick={onPlayGames}>
          <span className="menu-icon play-badge" aria-hidden>
            ▶
          </span>
          Играем
        </button>
        <button className="menu-btn menu-stars" onClick={onOpenStars}>
          <span className="menu-icon stars-badge" aria-hidden>
            ★
          </span>
          Мои звёздочки
        </button>
      </div>
    </div>
  );
}
