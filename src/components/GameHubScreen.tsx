import { useEffect } from "react";
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
  onSpeak: (text: string) => void;
}

const GAME_ITEMS: Array<{
  id: GameId;
  title: string;
  className: string;
  image: string;
}> = [
  {
    id: "find",
    title: "Найди букву",
    className: "hub-find",
    image: ASSETS.ui.cubes
  },
  {
    id: "picture",
    title: "Угадай картинку",
    className: "hub-picture",
    image: ASSETS.letters.A
  },
  {
    id: "listen",
    title: "Послушай и выбери",
    className: "hub-listen",
    image: ASSETS.fox.idle
  }
];

export function GameHubScreen({
  unlockedGames,
  onOpenGame,
  onStartAdventure,
  onBack,
  onSpeak
}: GameHubScreenProps) {
  useEffect(() => {
    onSpeak("Во что будем играть?");
  }, [onSpeak]);

  return (
    <div className="screen hub-screen has-bottom-nav">
      <WorldBackground variant="play" />
      <Character mood="happy" message="Во что поиграем?" />
      <button
        className="kid-card kid-card-play hub-adventure"
        onClick={onStartAdventure}
        aria-label="Играть"
      >
        <span className="kid-card-art">
          <img src={assetUrl(ASSETS.ui.play)} alt="" draggable={false} />
        </span>
        <span className="kid-card-label">Играть</span>
      </button>
      <div className="mode-grid hub-grid">
        {GAME_ITEMS.map((item) => {
          const isOpen = unlockedGames.includes(item.id);
          return (
            <button
              key={item.id}
              className={`kid-card kid-card-hub ${item.className} ${isOpen ? "" : "locked"}`}
              onClick={() => onOpenGame(item.id)}
              disabled={!isOpen}
              aria-label={item.title}
            >
              <span className="kid-card-art">
                <img src={assetUrl(item.image)} alt="" draggable={false} />
              </span>
              <span className="kid-card-label">{item.title}</span>
            </button>
          );
        })}
      </div>
      <BottomNav onBack={onBack} onHome={onBack} />
    </div>
  );
}
