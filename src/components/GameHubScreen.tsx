import { GameId } from "../types";
import { Character } from "./Character";
import { BottomNav } from "./BottomNav";

interface GameHubScreenProps {
  unlockedGames: GameId[];
  onOpenGame: (id: GameId) => void;
  onBack: () => void;
}

const GAME_ITEMS: Array<{ id: GameId; badge: string; title: string; className: string }> = [
  { id: "find", badge: "АБВ", title: "Найди букву", className: "hub-find" },
  { id: "picture", badge: "Аа", title: "Что начинается?", className: "hub-picture" },
  { id: "listen", badge: "♪", title: "Послушай и выбери", className: "hub-listen" },
  { id: "match", badge: "★", title: "Собери пару", className: "hub-match" }
];

export function GameHubScreen({ unlockedGames, onOpenGame, onBack }: GameHubScreenProps) {
  return (
    <div className="screen has-bottom-nav">
      <Character mood="happy" message="Выбери игру!" />
      <h2 className="title">Играем</h2>
      <div className="menu-grid">
        {GAME_ITEMS.map((item) => {
          const isOpen = unlockedGames.includes(item.id);
          return (
            <button
              key={item.id}
              className={`menu-btn game-hub-btn ${item.className} ${isOpen ? "" : "locked"}`}
              onClick={() => onOpenGame(item.id)}
              disabled={!isOpen}
            >
              <span className="menu-icon letters-badge">{item.badge}</span>
              {item.title}
              {!isOpen ? " 🔒" : ""}
            </button>
          );
        })}
      </div>
      <BottomNav onBack={onBack} />
    </div>
  );
}
