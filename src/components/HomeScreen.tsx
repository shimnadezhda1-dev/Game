import { useEffect, useState } from "react";
import { assetUrl } from "../utils/assets";
import { ToyLetter } from "./ToyLetter";
import { MusicNoteIcon } from "./ToyIcons";

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

      <div className="home-balloons" aria-hidden="true">
        <span className="home-balloon hb-1" />
        <span className="home-balloon hb-2" />
        <span className="home-balloon hb-3" />
        <span className="home-balloon hb-4" />
        <span className="home-balloon hb-5" />
        <span className="home-balloon hb-6" />
      </div>

      <div className="toy-sun home-sun" aria-hidden="true">
        <span className="sun-core">
          <i className="sun-eye sun-eye-l" />
          <i className="sun-eye sun-eye-r" />
          <i className="sun-smile" />
        </span>
      </div>

      <h1 className="visually-hidden">Весёлый алфавит</h1>

      <img
        className="home-rainbow"
        src={assetUrl("/assets/home/rainbow-3d.png")}
        alt=""
        draggable={false}
      />

      <div className="home-cluster">
        <div className="home-fox-wrap">
          <img
            className="home-fox-art"
            src={assetUrl("/assets/home/fox.png")}
            alt=""
            draggable={false}
          />
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
            <span className="home-block home-block-a">
              <ToyLetter letterId="A" glyph="А" size="tile" />
            </span>
            <span className="home-block home-block-b">
              <ToyLetter letterId="B" glyph="Б" size="tile" />
            </span>
            <span className="home-block home-block-v">
              <ToyLetter letterId="V" glyph="В" size="tile" />
            </span>
          </button>
        </div>
      </div>

      <button
        className={`home-music ${musicOn ? "" : "is-off"}`}
        onClick={onToggleMusic}
        aria-label={musicOn ? "Музыка включена" : "Музыка выключена"}
      >
        <MusicNoteIcon />
      </button>
    </div>
  );
}
