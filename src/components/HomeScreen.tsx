import { useEffect, useState } from "react";
import { assetUrl } from "../utils/assets";
import { SpeakerMuteIcon } from "./ToyIcons";

interface HomeScreenProps {
  onGoLearn: () => void;
  onPlayGames: () => void;
  onOpenStars: () => void;
  onSpeak: (text: string, options?: { key?: string; onEnd?: () => void }) => void;
  onToggleMusic: () => void;
  musicOn: boolean;
  foxCelebrate?: boolean;
}

const FIRST_VISIT_KEY = "happy-alphabet-first-visit-v1";

function HomeSun() {
  return (
    <svg className="home-sun-art" viewBox="0 0 120 120" aria-hidden="true">
      <g fill="#ffb300">
        <path d="M60 6l8 16h-16z" />
        <path d="M60 114l8-16h-16z" />
        <path d="M6 60l16-8v16z" />
        <path d="M114 60l-16-8v16z" />
        <path d="M22 22l16 4-12 12z" />
        <path d="M98 22l-16 4 12 12z" />
        <path d="M22 98l16-4-12-12z" />
        <path d="M98 98l-16-4 12-12z" />
      </g>
      <circle cx="60" cy="60" r="38" fill="#ffd93d" />
      <circle cx="48" cy="48" r="10" fill="#fff7b0" opacity="0.45" />
      <ellipse cx="46" cy="62" rx="7" ry="5" fill="#ff8aa0" opacity="0.85" />
      <ellipse cx="74" cy="62" rx="7" ry="5" fill="#ff8aa0" opacity="0.85" />
      <path d="M44 52c4 6 10 6 14 0" fill="none" stroke="#5b3d14" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M62 52c4 6 10 6 14 0" fill="none" stroke="#5b3d14" strokeWidth="3.2" strokeLinecap="round" />
      <ellipse cx="60" cy="74" rx="11" ry="9" fill="#5b3d14" />
      <ellipse cx="60" cy="76" rx="7" ry="5" fill="#ff6b85" />
    </svg>
  );
}

function HomeHouseIcon() {
  return (
    <svg className="home-ui-icon" viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M8 30 L32 10 L56 30 V54 A6 6 0 0 1 50 60 H14 A6 6 0 0 1 8 54 Z"
        fill="#fff"
      />
      <rect x="26" y="38" width="12" height="18" rx="3" fill="#3cb000" />
    </svg>
  );
}

export function HomeScreen({
  onGoLearn,
  onPlayGames,
  onSpeak,
  onToggleMusic,
  musicOn
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
      <div className="home-backdrop" aria-hidden="true">
        <img className="home-meadow" src={assetUrl("/assets/letters/meadow-bg.png")} alt="" draggable={false} />
      </div>

      <img
        className="home-rainbow"
        src={assetUrl("/assets/home/rainbow.png")}
        alt=""
        draggable={false}
      />

      <div className="home-sun" aria-hidden="true">
        <HomeSun />
      </div>

      <h1 className="visually-hidden">Весёлый алфавит</h1>

      <div className="home-cluster">
        <img
          className="home-fox-art"
          src={assetUrl("/assets/home/fox.png")}
          alt=""
          draggable={false}
        />
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
          <button className="home-abc" onClick={onGoLearn} aria-label="Буквы А Б В">
            <span className="home-block home-block-a">А</span>
            <span className="home-block home-block-b">Б</span>
            <span className="home-block home-block-v">В</span>
          </button>
        </div>
      </div>

      <button className="home-ui home-ui-home" aria-label="Домой">
        <HomeHouseIcon />
      </button>

      <button
        className={`home-ui home-ui-sound ${musicOn ? "" : "is-off"}`}
        onClick={onToggleMusic}
        aria-label={musicOn ? "Музыка включена" : "Музыка выключена"}
      >
        <SpeakerMuteIcon muted={!musicOn} />
      </button>
    </div>
  );
}
