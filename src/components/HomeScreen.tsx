import { useEffect, useState } from "react";
import { WorldBackground } from "./WorldBackground";
import { LearnActionArt, PlayActionArt, RewardsActionArt } from "./HomeActionArts";

interface HomeScreenProps {
  onGoLearn: () => void;
  onPlayGames: () => void;
  onOpenStars: () => void;
  onSpeak: (text: string) => void;
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
    onSpeak("Привет! Давай играть с буквами!");
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
      <p className="subtitle">Играй • Слушай • Запоминай</p>
      <div className="home-actions">
        <button className="kid-card kid-card-learn" onClick={onGoLearn} aria-label="Учим буквы">
          <span className="kid-card-art">
            <LearnActionArt />
          </span>
          <span className="kid-card-label">Учим буквы</span>
        </button>
        <button
          className={`kid-card kid-card-play ${pulsePlay ? "home-play-hint" : ""}`}
          onClick={onPlayGames}
          aria-label="Играть"
        >
          <span className="kid-card-art">
            <PlayActionArt celebrate={foxCelebrate} />
          </span>
          <span className="kid-card-label">Играть</span>
        </button>
        <button className="kid-card kid-card-rewards" onClick={onOpenStars} aria-label="Мои награды">
          <span className="kid-card-art">
            <RewardsActionArt />
          </span>
          <span className="kid-card-label">Мои награды</span>
        </button>
      </div>
    </div>
  );
}
