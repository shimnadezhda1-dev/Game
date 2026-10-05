import { LetterItem, LetterStats, OptionCount } from "../types";
import type { Point } from "../utils/point";
import { letterVoiceKey } from "../audio/voiceCatalog";
import { audioManager } from "../audio/AudioManager";
import { playFindLetterPrompt } from "../audio/findLetterPrompt";
import { GameStage } from "./GameStage";
import { LetterHint } from "./LetterHint";
import { LetterTile } from "./LetterTile";
import { StageNav } from "./StageNav";
import { useRound } from "../utils/useRound";
import { assetUrl, ASSETS } from "../utils/assets";
import { findLetterPrompt, letterGlyphSrc, letterObjectSrc } from "../utils/letterCopy";
import { planFindColors } from "../utils/findColors";
import { ToyLetter } from "./ToyLetter";
import { HomeButton } from "./HomeButton";
import { GameHudRight } from "./GameHudRight";
import { RestartActivityButton } from "./RestartActivityButton";
import { useEffect, useMemo, useRef } from "react";

interface FindLetterGameProps {
  letters: LetterItem[];
  stats: Record<string, LetterStats>;
  trailStep?: number;
  lockTarget?: LetterItem;
  optionCount?: OptionCount;
  optionPool?: LetterItem[];
  optionCatalog?: LetterItem[];
  hint?: "image" | "letter" | "none";
  prompt?: string;
  awaitNext?: boolean;
  stars?: number;
  onCorrect: (letterId: string, origin?: Point) => void;
  onAfterSuccess?: () => Promise<void>;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string, options?: { key?: string; path?: string; onEnd?: () => void }) => void;
  onBack: () => void;
  onPrev?: () => void;
  onStageNext?: () => void;
  onFinished?: () => boolean | void;
  onRequestRestart?: () => void;
}

export function FindLetterGame({
  letters,
  stats,
  lockTarget,
  optionCount = 3,
  optionPool,
  optionCatalog,
  hint = "letter",
  prompt,
  awaitNext = false,
  stars = 0,
  onCorrect,
  onAfterSuccess,
  onMistake,
  onSpeak,
  onBack,
  onPrev,
  onStageNext,
  onFinished,
  onRequestRestart
}: FindLetterGameProps) {
  const optionLetters = optionPool ?? letters;
  const lookupLetters = optionCatalog ?? optionLetters;
  const round = useRound({
    letters,
    stats,
    lockTarget,
    optionCount,
    optionPool: optionLetters,
    awaitNext,
    onCorrect,
    onAfterSuccess,
    onMistake,
    onSpeak,
    onFinished,
    speakPrompt: (item) => findLetterPrompt(item),
    speakKey: (item) => letterVoiceKey("find", item.id),
    praise: (item) => `Молодец! Это буква ${item.upper}!`,
    praiseKey: (letter) => letterVoiceKey("correct", letter.id),
    playWrongSound: false,
    autoSpeak: false
  });

  const targetRef = useRef(round.target);
  targetRef.current = round.target;
  const phaseRef = useRef(round.phase);
  phaseRef.current = round.phase;
  const findGenRef = useRef(0);
  const pauseTimerRef = useRef<number | null>(null);

  function clearFindPause() {
    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }

  function pauseMs(ms: number): Promise<void> {
    return new Promise((resolve) => {
      pauseTimerRef.current = window.setTimeout(() => {
        pauseTimerRef.current = null;
        resolve();
      }, ms);
    });
  }

  function playFindLetterPromptForCurrent() {
    if (phaseRef.current !== "question") {
      return;
    }
    clearFindPause();
    audioManager.stopSpeaking();
    const generation = ++findGenRef.current;
    const stillCurrent = () =>
      generation === findGenRef.current && phaseRef.current === "question";
    void playFindLetterPrompt(targetRef.current.id, stillCurrent, pauseMs);
  }

  useEffect(() => {
    if (round.phase !== "question" || round.optionError) {
      return;
    }
    const timer = window.setTimeout(() => {
      playFindLetterPromptForCurrent();
    }, 50);
    return () => {
      window.clearTimeout(timer);
      findGenRef.current += 1;
      clearFindPause();
      if (phaseRef.current === "question") {
        audioManager.stopSpeaking();
      }
    };
  }, [round.target.id, round.phase, round.optionError]);

  const bubble =
    round.phase === "feedback" ? "Молодец!" : prompt ?? `Найди букву ${round.target.upper}!`;
  const colorPlan = useMemo(
    () => planFindColors(round.target.id, round.options),
    [round.target.id, round.options.join(",")]
  );

  if (hint === "image") {
    const target = round.target;
    const choices = round.options;
    const letterMark = target.upper;
    const glyphSrc = letterGlyphSrc(target);
    const objectSrc = letterObjectSrc(target, "find");

    return (
      <div
        className="screen find-screen"
        style={{ ["--find-target-color" as string]: colorPlan.targetDisplayCss }}
      >
        <div className="find-backdrop" aria-hidden="true">
          <img className="find-meadow" src={assetUrl(ASSETS.find.meadow)} alt="" draggable={false} fetchPriority="high" decoding="async" />
        </div>

        <HomeButton onClick={onBack} />

        <GameHudRight stars={stars}>
          <button
            className="learn-sound"
            onClick={playFindLetterPromptForCurrent}
            disabled={round.phase === "feedback"}
            aria-label="Прослушать"
          >
            <span aria-hidden="true">🔊</span>
          </button>
        </GameHudRight>

        <img
          className={`find-fox ${round.phase === "feedback" ? "is-celebrate" : ""}`}
          src={assetUrl(ASSETS.find.fox)}
          alt=""
          draggable={false}
          decoding="async"
        />

        <div className="find-board">
          <h1 className="find-title">
            <span className="find-title-text">Найди букву </span>
            <span className="find-title-letter">{letterMark}</span>
            <span className="find-title-text">!</span>
          </h1>

          <div className="find-hint-card">
            {glyphSrc ? (
              <img
                className="find-hint-letter"
                src={assetUrl(glyphSrc)}
                alt={target.upper}
                draggable={false}
                style={{ filter: `hue-rotate(${colorPlan.hueRotate}deg)` }}
              />
            ) : (
              <ToyLetter letterId={target.id} glyph={target.upper} size="hint" />
            )}
            <span className="find-hint-divider" aria-hidden="true" />
            {objectSrc ? (
              <img
                className="find-hint-object"
                src={assetUrl(objectSrc)}
                alt={target.word || target.upper}
                draggable={false}
              />
            ) : null}
          </div>

          <div className="find-choices" data-option-count={choices.length}>
            {round.optionError ? (
              <p className="option-unavailable">Этот уровень пока недоступен</p>
            ) : null}
            {choices.map((id) => {
              const letter = lookupLetters.find((item) => item.id === id);
              if (!letter) {
                return null;
              }
              const tone = colorPlan.buttonColors[id] ?? "pink";
              const className = [
                "find-choice",
                round.selected === id && id !== round.target.id ? "is-wrong" : "",
                round.phase === "feedback" && id === round.target.id ? "is-correct" : "",
                round.wrongCount >= 2 && id === round.target.id && round.phase === "question"
                  ? "is-hint"
                  : ""
              ]
                .join(" ")
                .trim();
              return (
                <button
                  key={`${id}-${round.shakeNonce}`}
                  className={className}
                  onClick={(event) => round.choose(id, event)}
                  aria-label={letter.upper}
                >
                  <span className={`find-choice-tile find-choice-tile-${tone}`}>
                    <span className="letterTileLabel">{letter.upper}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {onRequestRestart ? <RestartActivityButton onClick={onRequestRestart} /> : null}
        </div>

        <StageNav onPrev={onPrev} onNext={onStageNext} prevDest="learn" nextDest="picture" />
      </div>
    );
  }

  return (
    <GameStage
      foxMood={round.phase === "feedback" ? "celebrate" : "tip"}
      bubble={bubble}
      onReplay={playFindLetterPromptForCurrent}
      replayKey={round.target.id}
      replayDisabled={round.phase === "feedback"}
      onBack={onBack}
    >
      {hint !== "none" ? <LetterHint letter={round.target} showImage={false} /> : null}
      <div className="tiles-row" data-option-count={round.options.length}>
        {round.optionError ? (
          <p className="option-unavailable">Этот уровень пока недоступен</p>
        ) : null}
        {round.options.map((id) => {
          const letter = lookupLetters.find((item) => item.id === id);
          if (!letter) {
            return null;
          }
          return (
            <LetterTile
              key={`${id}-${round.shakeNonce}`}
              letter={letter}
              wrong={round.selected === id && id !== round.target.id}
              correct={round.phase === "feedback" && id === round.target.id}
              hint={round.wrongCount >= 2 && id === round.target.id && round.phase === "question"}
              onClick={(event) => round.choose(id, event)}
            />
          );
        })}
      </div>
      {onRequestRestart ? <RestartActivityButton onClick={onRequestRestart} /> : null}
    </GameStage>
  );
}
