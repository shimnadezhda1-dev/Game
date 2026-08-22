import { useEffect, useState } from "react";
import { assetUrl, ASSETS } from "../utils/assets";

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
  onSpeak
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
        <div className="home-sky" />
        <span className="home-balloon hb-a" />
        <span className="home-balloon hb-b" />
        <span className="home-balloon hb-c" />
        <span className="home-cloud hc-a" />
        <span className="home-cloud hc-b" />
        <div className="home-hills">
          <span className="home-hill hl" />
          <span className="home-hill hm" />
          <span className="home-hill hr" />
        </div>
        <span className="home-tree ht-a" />
        <span className="home-tree ht-b" />
        <span className="home-tree ht-c" />
        <span className="home-flower hf-a" />
        <span className="home-flower hf-b" />
        <span className="home-flower hf-c" />
        <span className="home-flower hf-d" />
        <span className="home-flower hf-e" />
      </div>

      <h1 className="visually-hidden">Весёлый алфавит</h1>

      <div className="home-stage">
        <img
          className="home-rainbow"
          src={assetUrl("/assets/home/rainbow.png")}
          alt=""
          draggable={false}
        />
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
            <button className="home-abc" onClick={onGoLearn} aria-label="Буквы">
              <span className="home-block home-block-a">А</span>
              <span className="home-block home-block-b">Б</span>
              <span className="home-block home-block-v">В</span>
            </button>
          </div>
        </div>
      </div>

      <button className="home-chest" onClick={onOpenStars} aria-label="Награды">
        <img src={assetUrl(ASSETS.ui.rewards)} alt="" draggable={false} />
      </button>
    </div>
  );
}
