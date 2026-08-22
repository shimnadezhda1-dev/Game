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
      <div className="home-layer home-layer-bg" aria-hidden="true">
        <img className="home-meadow" src={assetUrl("/assets/home/meadow-nonsun.png")} alt="" draggable={false} />
      </div>

      <img
        className="home-rainbow"
        src={assetUrl("/assets/home/rainbow-clean.png")}
        alt=""
        draggable={false}
      />

      <img
        className="home-sun"
        src={assetUrl("/assets/home/sun.png")}
        alt=""
        draggable={false}
      />

      <h1 className="visually-hidden">Весёлый алфавит</h1>

      <div className="home-cluster">
        <img
          className="home-fox-art"
          src={assetUrl("/assets/home/fox-jump.png")}
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
            <img src={assetUrl("/assets/home/abc-tiles.png")} alt="А Б В" draggable={false} />
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
