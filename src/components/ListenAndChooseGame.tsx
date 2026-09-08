import { useEffect, useRef } from "react";
import { LetterItem, LetterStats, OptionCount } from "../types";
import type { Point } from "../utils/point";
import { letterVoiceKey } from "../audio/voiceCatalog";
import { audioManager } from "../audio/AudioManager";
import { getListenTone } from "../data/letterRegistry";
import { showCorrectHint, useRound } from "../utils/useRound";
import { GoldStar } from "./GoldStar";
import { StageNav } from "./StageNav";
import { NextArrowIcon } from "./ToyIcons";
import { assetUrl, ASSETS } from "../utils/assets";
import { HomeButton } from "./HomeButton";
import { GameHudRight } from "./GameHudRight";

interface ListenAndChooseGameProps {
  letters: LetterItem[];
  stats: Record<string, LetterStats>;
  trailStep?: number;
  lockTarget?: LetterItem;
  optionCount?: OptionCount;
  optionPool?: LetterItem[];
  optionCatalog?: LetterItem[];
  awaitNext?: boolean;
  stars?: number;
  onCorrect: (letterId: string, origin?: Point) => void;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string, options?: { key?: string; onEnd?: () => void }) => void;
  onBack: () => void;
  onPrev?: () => void;
  onStageNext?: () => void;
  onFinished?: () => boolean | void;
  showInternalNext?: boolean;
  showMasteryCelebration?: boolean;
}

export function ListenAndChooseGame({
  letters,
  stats,
  lockTarget,
  optionCount = 3,
  optionPool,
  optionCatalog,
  awaitNext = false,
  stars = 0,
  onCorrect,
  onMistake,
  onSpeak,
  onBack,
  onPrev,
  onStageNext,
  onFinished,
  showInternalNext = true,
  showMasteryCelebration = true
}: ListenAndChooseGameProps) {
  const optionLetters = optionPool ?? letters;
  const lookupLetters = optionCatalog ?? optionLetters;
  const round = useRound({
    letters,
    stats,
    optionCount,
    optionPool: optionLetters,
    lockTarget,
    awaitNext,
    onCorrect,
    onMistake,
    onSpeak,
    onFinished,
    autoSpeak: false,
    speakPrompt: () => "Послушай и выбери букву!",
    speakKey: () => "listen-prompt",
    praise: (letter) => `Ура! Ты выучил букву ${letter.upper}!`,
    praiseKey: (letter) => letterVoiceKey("reward", letter.id),
    tryAgainText: "Попробуй ещё раз!",
    playWrongSound: false
  });

  const celebrating = round.phase === "feedback";
  const letterMark = round.target.upper;
  const onSpeakRef = useRef(onSpeak);
  onSpeakRef.current = onSpeak;

  function playTargetLetter() {
    if (celebrating) {
      return;
    }
    onSpeak(round.target.upper, { key: letterVoiceKey("listen", round.target.id) });
  }

  useEffect(() => {
    if (round.phase !== "question") {
      return;
    }
    if (lockTarget && lockTarget.id !== round.target.id) {
      return;
    }
    const letterId = round.target.id;
    const glyph = round.target.upper;
    const timer = window.setTimeout(() => {
      onSpeakRef.current(glyph, { key: letterVoiceKey("listen", letterId) });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [round.phase, round.target.id, lockTarget?.id]);

  useEffect(() => {
    return () => {
      audioManager.stopSpeaking();
    };
  }, []);

  return (
    <div className="screen listen-screen">
      <div className="listen-backdrop" aria-hidden="true">
        <img
          className="listen-meadow"
          src={assetUrl(ASSETS.listen.meadow)}
          alt=""
          draggable={false}
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <HomeButton onClick={onBack} />

      <GameHudRight stars={stars}>
        <button
          className="learn-sound"
          onClick={round.replay}
          disabled={celebrating}
          aria-label="Прослушать"
        >
          <span aria-hidden="true">🔊</span>
        </button>
      </GameHudRight>

      {celebrating && showMasteryCelebration ? (
        <div className="listen-reward" aria-live="polite">
          <div className="listen-reward-burst" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <span key={index} className={`listen-confetti listen-confetti-${index}`} />
            ))}
          </div>
          <div className="listen-reward-heroes">
            <img
              className="listen-reward-fox"
              src={assetUrl(ASSETS.picture.fox)}
              alt=""
              draggable={false}
            />
            <GoldStar size="hero" />
          </div>
          <p className="listen-reward-plaque">
            Ура! Ты выучил букву <span className="listen-reward-letter">{letterMark}</span>!
          </p>
        </div>
      ) : (
        <div className="listen-board">
          <h1 className="listen-title">Послушай и выбери букву!</h1>
          <button
            className="listen-play"
            onClick={playTargetLetter}
            aria-label="Прослушать"
          >
            <span aria-hidden="true">🔊</span>
          </button>
          <div className="listen-choices" data-option-count={round.options.length}>
            {round.optionError ? (
              <p className="option-unavailable">Этот уровень пока недоступен</p>
            ) : null}
            {round.options.map((id) => {
              const item = lookupLetters.find((letter) => letter.id === id);
              if (!item) {
                return null;
              }
              const tone = getListenTone(id);
              const isCorrectHinted =
                showCorrectHint(round.wrongCount, round.phase) &&
                id === round.correctOptionId;
              return (
                <button
                  key={id}
                  className={`listen-letter listen-letter-${tone}${
                    isCorrectHinted ? " is-hint" : ""
                  }`}
                  onClick={(event) => round.choose(id, event)}
                  aria-label={item.upper}
                >
                  <span className="listen-letter-3d">
                    <span className="listen-letter-depth" aria-hidden="true">
                      {item.upper}
                    </span>
                    <span className="listen-letter-face">{item.upper}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <StageNav onPrev={onPrev} onNext={onStageNext} prevDest="picture" nextDest="learn" />

      {awaitNext && celebrating && showInternalNext ? (
        <button
          type="button"
          className="learn-next internal-next learn-next--dest-learn"
          onClick={round.continueRound}
          aria-label="Знакомство с буквой"
        >
          <NextArrowIcon />
        </button>
      ) : null}
    </div>
  );
}
