import { GoldStar } from "./GoldStar";
import { Character } from "./Character";
import { WorldBackground } from "./WorldBackground";
import { NextArrowIcon } from "./ToyIcons";
import { TitleStyleLetters } from "./GameTitle";
import { RewardItem } from "../data/rewardCatalog";
import { assetUrl } from "../utils/assets";
import { audioManager } from "../audio/AudioManager";
import { useEffect, useRef } from "react";

interface RewardScreenProps {
  threshold: number;
  title?: string;
  reward: RewardItem;
  onClose: () => void;
}

const REWARD_STICKER_PATH = "/assets/audio/ru/common/reward-new-sticker.mp3";
const REWARD_CONTINUE_PATH = "/assets/audio/ru/common/reward-continue.mp3";
const CONTINUE_PAUSE_MS = 450;

export function RewardScreen({
  threshold,
  title = "Ура! Новая наклейка!",
  reward,
  onClose
}: RewardScreenProps) {
  const closingRef = useRef(false);
  const pauseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    audioManager.playVoice(REWARD_STICKER_PATH, () => {
      if (cancelled || closingRef.current) {
        return;
      }
      pauseTimerRef.current = window.setTimeout(() => {
        pauseTimerRef.current = null;
        if (cancelled || closingRef.current) {
          return;
        }
        audioManager.playVoice(REWARD_CONTINUE_PATH);
      }, CONTINUE_PAUSE_MS);
    });
    return () => {
      cancelled = true;
      if (pauseTimerRef.current !== null) {
        window.clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
    };
  }, []);

  function handleContinue() {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    audioManager.stopSpeaking();
    onClose();
  }

  return (
    <div className="screen reward-screen reward-overlay" role="dialog" aria-modal="true">
      <WorldBackground variant="play" sunSrc={assetUrl("/assets/stickers-page/sun.png")} />
      <div className="confetti-layer reward-confetti" aria-hidden>
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index} className={`confetti-bit bit-${index % 6}`} />
        ))}
      </div>
      <Character mood="celebrate" size="hero" />
      <section className="reward-card">
        <h1 className="reward-title">{title}</h1>
        <div
          className={`reward-showcase reward-${reward.fallbackVisual}`}
          aria-hidden="true"
        >
          {reward.asset ? (
            <img
              className="reward-showcase-art"
              src={assetUrl(reward.asset)}
              alt=""
              draggable={false}
            />
          ) : (
            <span className="reward-showcase-star">★</span>
          )}
        </div>
        <p className="reward-name">{reward.title}</p>
        <div className="reward-achievement" aria-label={`${threshold} звёзд`}>
          <GoldStar size="tiny" />
          <span>{threshold}</span>
        </div>
      </section>
      <button type="button" className="reward-continue" onClick={handleContinue}>
        <span className="reward-continue-label">
          <TitleStyleLetters text="ПРОДОЛЖИТЬ" className="reward-continue-letter" />
        </span>
        <NextArrowIcon />
      </button>
    </div>
  );
}
