import { GameId } from "../types";
import { Character } from "./Character";
import { BottomNav } from "./BottomNav";
import { WorldBackground } from "./WorldBackground";
import { assetUrl, ASSETS } from "../utils/assets";

interface GameHubScreenProps {
  unlockedGames: GameId[];
  onOpenGame: (id: GameId) => void;
  onBack: () => void;
}

const GAME_ITEMS: Array<{ id: GameId; title: string; className: string; image: string }> = [
  { id: "find", title: "Найди букву", className: "hub-find", image: ASSETS.ui.cubes },
  { id: "picture", title: "Что начинается?", className: "hub-picture", image: ASSETS.letters.A },
  { id: "listen", title: "Послушай и выбери", className: "hub-listen", image: ASSETS.fox.idle },
  { id: "match", title: "Собери пару", className: "hub-match", image: ASSETS.ui.stars }
];

export function GameHubScreen({ unlockedGames, onOpenGame, onBack }: GameHubScreenProps) {
  return (
    <div className="screen has-bottom-nav">
      <WorldBackground variant="play" />
      <Character mood="happy" message="Выбери игру!" />
      <h2 className="title">Играем</h2>
      <div className="mode-grid">
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
              <span>
                {item.title}
                {!isOpen ? " 🔒" : ""}
              </span>
            </button>
          );
        })}
      </div>
      <BottomNav onBack={onBack} onHome={onBack} />
    </div>
  );
}
