import { useEffect, useState } from "react";
import { LetterItem } from "../types";
import { LearnScene } from "./LearnScene";
import { GoldStar } from "./GoldStar";
import { NextArrowIcon } from "./ToyIcons";
import { StageNav } from "./StageNav";
import { letterIntroSpeech } from "../utils/letterCopy";
import { assetUrl, ASSETS } from "../utils/assets";

interface LearnLettersProps {
  letter: LetterItem;
  stars: number;
  letters?: LetterItem[];
  onSelectLetter?: (id: string) => void;
  onNext: () => void;
  onSpeak: (text: string, options?: { key?: string; onEnd?: () => void }) => void;
  onBack?: () => void;
  onHome: () => void;
  onStageNext?: () => void;
}

export function LearnLetters({ letter, stars, onNext, onSpeak, onHome, onStageNext }: LearnLettersProps) {
  const [pulseNext, setPulseNext] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  function speakLetter(withPulse: boolean) {
    onSpeak(letterIntroSpeech(letter), {
      onEnd: () => {
        if (!withPulse) {
          return;
        }
        setIntroDone(true);
        setPulseNext(true);
        window.setTimeout(() => setPulseNext(false), 2200);
      }
    });
  }

  useEffect(() => {
    setPulseNext(false);
    setIntroDone(false);
    const timer = window.setTimeout(() => speakLetter(true), 500);
    const fallback = window.setTimeout(() => setIntroDone(true), 7000);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(fallback);
    };
  }, [letter.id]);

  return (
    <div className="screen learn-screen">
      <div className="learn-backdrop" aria-hidden="true">
        <img className="learn-meadow" src={assetUrl(ASSETS.learn.meadow)} alt="" draggable={false} />
      </div>

      <img
        className="learn-sun"
        src={assetUrl("/assets/home/sun-smiling.png")}
        alt=""
        draggable={false}
      />

      <button className="learn-home" onClick={onHome} aria-label="На главную">
        <span aria-hidden="true">🏠</span>
      </button>

      <div className="learn-hud-right">
        <div className="learn-stars" aria-label={`Звёзды: ${stars}`}>
          <GoldStar size="tiny" />
          <span>{stars}</span>
        </div>
        <button
          className="learn-sound"
          onClick={() => speakLetter(false)}
          aria-label="Прослушать"
        >
          <span aria-hidden="true">🔊</span>
        </button>
      </div>

      <LearnScene letter={letter} />

      <StageNav onNext={onStageNext} showPrev={false} showNext={Boolean(onStageNext)} />

      {introDone ? (
        <button
          type="button"
          className={`learn-next internal-next ${pulseNext ? "learn-next-pulse" : ""}`}
          onClick={onNext}
          aria-label="Дальше"
        >
          <NextArrowIcon />
        </button>
      ) : null}
    </div>
  );
}
