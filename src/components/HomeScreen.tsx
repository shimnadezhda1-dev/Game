import { useEffect, useState } from "react";
import { Character } from "./Character";
import { WorldBackground } from "./WorldBackground";
import { LettersMiniArt, RewardsMiniArt } from "./HomeActionArts";

interface HomeScreenProps {
  onGoLearn: () => void;
  onPlayGames: () => void;
  onOpenStars: () => void;
  onSpeak: (text: string, options?: { key?: string; onEnd?: () => void }) => void;
  foxCelebrate?: boolean;
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
    const timer = window.setTimeout(() => setPulsePlay(false), 2400);
    return () => window.clearTimeout(timer);
  }, [onSpeak]);

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
      <div className="home-hero">
        <div className="home-fox">
          <Character mood={foxCelebrate ? "celebrate" : "happy"} size="hero" />
        </div>
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
      </div>
      <div className="home-secondary">
        <button className="home-mini home-mini-letters" onClick={onGoLearn} aria-label="Буквы">
          <LettersMiniArt />
          <span className="home-mini-label">Буквы</span>
        </button>
        <button className="home-mini home-mini-rewards" onClick={onOpenStars} aria-label="Награды">
          <RewardsMiniArt />
          <span className="home-mini-label">Награды</span>
        </button>
      </div>
    </div>
  );
}
