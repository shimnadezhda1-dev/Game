import { Character } from "./Character";
import { WorldBackground } from "./WorldBackground";
import { assetUrl, ASSETS } from "../utils/assets";

interface HomeScreenProps {
  onGoLearn: () => void;
  onPlayGames: () => void;
  onOpenStars: () => void;
}

const TITLE = [
  ["В", "#ff5d7a"],
  ["е", "#ff9f1c"],
  ["с", "#ffd93d"],
  ["ё", "#7ed957"],
  ["л", "#2ec4b6"],
  ["ы", "#4d9fff"],
  ["й", "#7c4dff"]
];

export function HomeScreen({ onGoLearn, onPlayGames, onOpenStars }: HomeScreenProps) {
  return (
    <div className="screen home-screen">
      <WorldBackground variant="cover" />
      <h1 className="logo-title" aria-label="Весёлый алфавит">
        {TITLE.map(([letter, color], index) => (
          <span key={`${letter}-${index}`} style={{ color }}>
            {letter}
          </span>
        ))}
        <br />
        <span className="logo-rest">алфавит</span>
      </h1>
      <p className="subtitle">Играй • Слушай • Запоминай</p>
      <button className="play-btn" onClick={onGoLearn}>
        ▶ ИГРАТЬ
      </button>
      <div className="home-fox">
        <Character mood="happy" size="hero" message="Привет! Давай играть!" />
      </div>
      <div className="mode-grid">
        <button className="mode-card menu-learn" onClick={onGoLearn}>
          <img src={assetUrl(ASSETS.ui.cubes)} alt="" draggable={false} />
          <span>Учим буквы</span>
        </button>
        <button className="mode-card menu-play" onClick={onPlayGames}>
          <img src={assetUrl(ASSETS.ui.play)} alt="" draggable={false} />
          <span>Играем</span>
        </button>
        <button className="mode-card menu-stars" onClick={onOpenStars}>
          <img src={assetUrl(ASSETS.ui.stars)} alt="" draggable={false} />
          <span>Звёздочки</span>
        </button>
      </div>
    </div>
  );
}
