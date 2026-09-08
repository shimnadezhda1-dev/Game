import { useEffect, useRef, useState } from "react";
import { LetterItem } from "../types";
import { LearnScene } from "./LearnScene";
import { NextArrowIcon } from "./ToyIcons";
import { StageNav } from "./StageNav";
import { letterIntroSpeech } from "../utils/letterCopy";
import { assetUrl, ASSETS } from "../utils/assets";
import { HomeButton } from "./HomeButton";
import { GameHudRight } from "./GameHudRight";
import { LearnAdvanceSlider } from "./LearnAdvanceSlider";

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
  autoAdvance?: boolean;
  advanceDelaySec?: number;
  allowLetterSkip?: boolean;
  onAdvanceSecondsChange?: (value: number) => void;
  onGoNextActivity?: () => void;
}

export function LearnLetters({
  letter,
  stars,
  onNext,
  onSpeak,
  onHome,
  onStageNext,
  autoAdvance = false,
  advanceDelaySec = 5,
  allowLetterSkip = true,
  onAdvanceSecondsChange,
  onGoNextActivity
}: LearnLettersProps) {
  const [pulseNext, setPulseNext] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const speakGenRef = useRef(0);
  const waitTimerRef = useRef<number | null>(null);

  function clearWaitTimer() {
    if (waitTimerRef.current !== null) {
      window.clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  }

  function scheduleAdvance(generation: number) {
    clearWaitTimer();
    if (!autoAdvance) {
      return;
    }
    waitTimerRef.current = window.setTimeout(() => {
      if (generation !== speakGenRef.current) {
        return;
      }
      onNext();
    }, Math.max(1, advanceDelaySec) * 1000);
  }

  function speakLetter(withPulse: boolean) {
    const generation = speakGenRef.current;
    onSpeak(letterIntroSpeech(letter), {
      onEnd: () => {
        if (generation !== speakGenRef.current) {
          return;
        }
        setIntroDone(true);
        if (withPulse) {
          setPulseNext(true);
          window.setTimeout(() => setPulseNext(false), 2200);
        }
        scheduleAdvance(generation);
      }
    });
  }

  function skipToNextLetter() {
    speakGenRef.current += 1;
    clearWaitTimer();
    onNext();
  }

  useEffect(() => {
    const generation = ++speakGenRef.current;
    setPulseNext(false);
    setIntroDone(false);
    clearWaitTimer();
    const timer = window.setTimeout(() => {
      if (generation !== speakGenRef.current) {
        return;
      }
      speakLetter(true);
    }, 500);
    const fallback = window.setTimeout(() => {
      if (generation !== speakGenRef.current) {
        return;
      }
      setIntroDone(true);
    }, 7000);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(fallback);
      clearWaitTimer();
    };
  }, [letter.id]);

  useEffect(() => {
    if (autoAdvance) {
      return;
    }
    speakGenRef.current += 1;
    clearWaitTimer();
  }, [autoAdvance]);

  function goNextActivity() {
    speakGenRef.current += 1;
    clearWaitTimer();
    (onGoNextActivity ?? onStageNext)?.();
  }

  const showNextActivity = Boolean(onGoNextActivity || onStageNext);
  const showLetterSkip = introDone && !onStageNext && allowLetterSkip && !onGoNextActivity;
  const showTimer = Boolean(autoAdvance && onAdvanceSecondsChange);

  return (
    <div className={`screen learn-screen learn-screen--${letter.id.toLowerCase()}`}>
      <div className="learn-backdrop" aria-hidden="true">
        <img className="learn-meadow" src={assetUrl(ASSETS.learn.meadow)} alt="" draggable={false} fetchPriority="high" decoding="async" />
      </div>

      <img
        className="learn-sun"
        src={assetUrl("/assets/home/sun-smiling.webp")}
        decoding="async"
        alt=""
        draggable={false}
      />

      <HomeButton onClick={onHome} />

      <GameHudRight stars={stars}>
        <button
          className="learn-sound"
          onClick={() => {
            speakGenRef.current += 1;
            clearWaitTimer();
            speakLetter(false);
          }}
          aria-label="Прослушать"
        >
          <span aria-hidden="true">🔊</span>
        </button>
      </GameHudRight>

      <LearnScene letter={letter} />

      <StageNav
        showPrev={false}
        onNext={showNextActivity ? goNextActivity : undefined}
        nextDest="find"
      />

      {showLetterSkip ? (
        <button
          type="button"
          className={`learn-next internal-next ${pulseNext ? "learn-next-pulse" : ""}`}
          onClick={autoAdvance ? skipToNextLetter : onNext}
          aria-label="Дальше"
        >
          <NextArrowIcon />
        </button>
      ) : null}

      {showTimer ? (
        <LearnAdvanceSlider
          className="learn-advance--dock"
          value={advanceDelaySec}
          onChange={(value) => onAdvanceSecondsChange?.(value)}
        />
      ) : null}
    </div>
  );
}
