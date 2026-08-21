import { GameId } from "../types";
import { Character } from "./Character";
import { BottomNav } from "./BottomNav";
import { WorldBackground } from "./WorldBackground";
import { assetUrl, ASSETS } from "../utils/assets";

interface GameHubScreenProps {
  unlockedGames: GameId[];
  onOpenGame: (id: GameId) => void;
  onStartAdventure: () => void;
  onBack: () => void;
}

const GAME_ITEMS: Array<{
  id: GameId;
  title: string;
  hint: string;
  className: string;
  image: string;
}> = [
  {
    id: "find",
    title: "Найди букву",
    hint: "Слушай и находи нужную букву",
    className: "hub-find",
    image: ASSETS.ui.cubes
  },
  {
    id: "picture",
    title: "Угадай картинку",
    hint: "Что начинается на эту букву?",
    className: "hub-picture",
    image: ASSETS.letters.A
  },
  {
    id: "listen",
    title: "Послушай и выбери",
    hint: "Послушай звук и найди букву",
    className: "hub-listen",
    image: ASSETS.fox.idle
  }
];

export function GameHubScreen({
  unlockedGames,
  onOpenGame,
  onStartAdventure,
  onBack
}: GameHubScreenProps) {
  return (
    <div className="screen hub-screen has-bottom-nav">
      <WorldBackground variant="play" />
      <Character mood="happy" message="Во что поиграем?" />
      <h2 className="title hub-title">Во что поиграем?</h2>
      <button className="play-btn compact-play adventure-cta" onClick={onStartAdventure}>
        Пойдём искать буквы!
      </button>
      <div className="mode-grid hub-grid">
        {GAME_ITEMS.map((item) => {
          const isOpen = unlockedGames.includes(item.id);
          return (
            <button
              key={item.id}
              className={`mode-card game-hub-btn ${item.className} ${isOpen ? "" : "locked"}`}
              onClick={() => onOpenGame(item.id)}
              disabled={!isOpen}
            >
              <img src={assetUrl(item.image)} alt="" draggable={false} />
              <span className="hub-copy">
                <strong>{item.title}</strong>
                <small>{item.hint}</small>
              </span>
            </button>
          );
        })}
      </div>
      <BottomNav onBack={onBack} onHome={onBack} />
    </div>
  );
}
