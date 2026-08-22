import { useEffect, useState } from "react";
import { Character } from "./Character";
import { Rainbow } from "./Rainbow";
import { WorldBackground } from "./WorldBackground";
import { assetUrl, ASSETS } from "../utils/assets";
import { ToyLetter } from "./ToyLetter";

interface HomeScreenProps {
  onGoLearn: () => void;
  onPlayGames: () => void;
  onOpenStars: () => void;
  onSpeak: (text: string, options?: { key?: string; onEnd?: () => void }) => void;
  foxCelebrate?: boolean;
}

const FIRST_VISIT_KEY = "happy-alphabet-first-visit-v1";

export function HomeScreen({
  onGoLearn,
  onPlayGames,
  onOpenStars,
  onSpeak,
  foxCelebrate
}: HomeScreenProps) {
  const [pulsePlay, setPulsePlay] = useState(false);

  useEffect(() => {
    const first = !localStorage.getItem(FIRST_VISIT_KEY);
    if (!first) {
      return;
    }
    localStorage.setItem(FIRST_VISIT_KEY, "1");
    onSpeak("Привет! Давай играть с буквами!", { key: "welcome" });
    setPulsePlay(true);
    const timer = window.setTimeout(() => setPulsePlay(false), 2200);
    return () => window.clearTimeout(timer);
  }, [onSpeak]);

  return (
    <div className="screen home-screen">
      <WorldBackground variant="cover" />
      <Rainbow />
      <h1 className="visually-hidden">Весёлый алфавит</h1>
      <div className="home-hero">
        <div className="home-fox">
          <Character mood={foxCelebrate ? "celebrate" : "tip"} size="hero" />
        </div>
        <div className="home-cta">
          <button
            className={`play-btn home-play-btn ${pulsePlay ? "home-play-hint" : ""}`}
            onClick={onPlayGames}
            aria-label="Играть"
          >
            <span className="home-play-glyph" aria-hidden="true">
              ▶
            </span>
            <span className="home-play-label">ИГРАТЬ</span>
          </button>
          <button className="home-abc" onClick={onGoLearn} aria-label="Буквы">
            <span className="home-abc-tile">
              <ToyLetter letterId="A" glyph="А" size="tile" />
            </span>
            <span className="home-abc-tile">
              <ToyLetter letterId="B" glyph="Б" size="tile" />
            </span>
            <span className="home-abc-tile">
              <ToyLetter letterId="V" glyph="В" size="tile" />
            </span>
          </button>
        </div>
      </div>
      <button className="home-chest" onClick={onOpenStars} aria-label="Награды">
        <img src={assetUrl(ASSETS.ui.rewards)} alt="" draggable={false} />
      </button>
    </div>
  );
}
