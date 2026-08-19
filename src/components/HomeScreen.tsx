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
      <Character mood="happy" message="Привет! Давай играть!" />
      <h1 className="title">Весёлый алфавит</h1>
      <button className="play-btn" onClick={onGoLearn}>
        ▶ Играть
      </button>
      <div className="menu-grid">
        <button className="menu-btn" onClick={onGoLearn}>
          🔤 Учим буквы
        </button>
        <button className="menu-btn" onClick={onPlayGames}>
          🎮 Играем
        </button>
        <button className="menu-btn" onClick={onOpenStars}>
          ⭐ Мои звёздочки
        </button>
      </div>
    </div>
  );
}
