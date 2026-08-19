import { GameId } from "../types";
import { Character } from "./Character";

interface GameHubScreenProps {
  unlockedGames: GameId[];
  onOpenGame: (id: GameId) => void;
  onBack: () => void;
}

const GAME_ITEMS: Array<{ id: GameId; icon: string; title: string }> = [
  { id: "find", icon: "🎯", title: "Найди букву" },
  { id: "picture", icon: "🖼️", title: "Что начинается?" },
  { id: "listen", icon: "🎧", title: "Послушай и выбери" },
  { id: "match", icon: "🧩", title: "Собери пару" }
];

export function GameHubScreen({ unlockedGames, onOpenGame, onBack }: GameHubScreenProps) {
  return (
    <div className="screen">
      <Character mood="happy" message="Выбери игру!" />
      <button className="back-btn" onClick={onBack}>
        ←
      </button>
      <h2 className="title">🎮 Играем</h2>
      <div className="menu-grid">
        {GAME_ITEMS.map((item) => {
          const isOpen = unlockedGames.includes(item.id);
          return (
            <button
              key={item.id}
              className={`menu-btn game-hub-btn ${isOpen ? "" : "locked"}`}
              onClick={() => onOpenGame(item.id)}
              disabled={!isOpen}
            >
              {item.icon} {item.title} {!isOpen ? "🔒" : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
