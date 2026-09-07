import { useEffect, useMemo, useRef } from "react";
import {
  LetterItem,
  LetterStats,
  OptionCount,
  PictureExampleEntry
} from "../types";
import type { Point } from "../utils/point";
import { letterVoiceKey } from "../audio/voiceCatalog";
import { showCorrectHint, useRound } from "../utils/useRound";
import { StageNav } from "./StageNav";
import { NextArrowIcon } from "./ToyIcons";
import { assetUrl, ASSETS } from "../utils/assets";
import { HomeButton } from "./HomeButton";
import { GameHudRight } from "./GameHudRight";
import { buildPictureRoundOptions } from "../utils/selectors";

interface PictureLetterGameProps {
  letters: LetterItem[];
  stats: Record<string, LetterStats>;
  trailStep?: number;
  lockTarget?: LetterItem;
  optionCount?: OptionCount;
  pictureBank: readonly PictureExampleEntry[];
  pictureExampleHistory?: Map<string, string>;
  awaitNext?: boolean;
  stars?: number;
  onCorrect: (letterId: string, origin?: Point) => void;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string, options?: { key?: string; onEnd?: () => void }) => void;
  onBack: () => void;
  onPrev?: () => void;
  onStageNext?: () => void;
  onFinished?: () => void;
}

export function PictureLetterGame({
  letters,
  stats,
  lockTarget,
  optionCount = 3,
  pictureBank,
  pictureExampleHistory,
  awaitNext = false,
  stars = 0,
  onCorrect,
  onMistake,
  onSpeak,
  onBack,
  onPrev,
  onStageNext,
  onFinished
}: PictureLetterGameProps) {
  const localExampleHistoryRef = useRef(new Map<string, string>());
  const exampleHistory = pictureExampleHistory ?? localExampleHistoryRef.current;
  const examplesById = useMemo(
    () => new Map(pictureBank.map((example) => [example.id, example])),
    [pictureBank]
  );
  const round = useRound({
    letters,
    stats,
    lockTarget,
    optionCount,
    optionBuilder: (target, count) =>
      buildPictureRoundOptions(
        target.id,
        target.upper,
        pictureBank,
        count,
        exampleHistory.get(target.id)
      ),
    awaitNext,
    onCorrect,
    onMistake,
    onSpeak,
    onFinished,
    speakPrompt: (letter) => `Что начинается на букву ${letter.upper}?`,
    speakKey: (letter) => letterVoiceKey("picture", letter.id),
    praise: (letter, correctOptionId) => {
      const example = examplesById.get(correctOptionId);
      return example?.word
        ? `Молодец! Это ${example.word.toLowerCase()}!`
        : letter.word
          ? `Молодец! Это ${letter.word.toLowerCase()}!`
          : `Молодец! Это буква ${letter.upper}!`;
    },
    praiseKey: (letter) => letterVoiceKey("correct", letter.id),
    tryAgainText: "Попробуй ещё раз!",
    playWrongSound: false
  });

  useEffect(() => {
    if (!round.optionError) {
      exampleHistory.set(round.target.id, round.correctOptionId);
    }
  }, [
    exampleHistory,
    round.correctOptionId,
    round.optionError,
    round.target.id
  ]);

  const letterMark = round.target.upper;

  return (
    <div className="screen picture-screen">
      <div className="picture-backdrop" aria-hidden="true">
        <img
          className="picture-meadow"
          src={assetUrl(ASSETS.picture.meadow)}
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
          disabled={round.phase === "feedback"}
          aria-label="Прослушать"
        >
          <span aria-hidden="true">🔊</span>
        </button>
      </GameHudRight>

      <div className="picture-board">
        <h1 className="picture-title">
          <span className="picture-title-text">Что начинается на букву </span>
          <span className="picture-title-letter">{letterMark}</span>
          <span className="picture-title-text">?</span>
        </h1>

        <div className="picture-choices" data-option-count={round.options.length}>
          {round.optionError ? (
            <p className="option-unavailable">Этот уровень пока недоступен</p>
          ) : null}
          {round.options.map((id) => {
            const example = examplesById.get(id);
            if (!example) {
              return null;
            }
            const isChosenCorrect =
              round.phase === "feedback" && id === round.correctOptionId;
            const isCorrectHinted =
              showCorrectHint(round.wrongCount, round.phase) &&
              id === round.correctOptionId;
            return (
              <button
                key={id}
                className={`picture-choice ${isChosenCorrect ? "is-chosen" : ""} ${
                  isCorrectHinted ? "is-hint" : ""
                }`}
                onClick={(event) => round.choose(id, event)}
                aria-label={example.word}
              >
                <img
                  src={assetUrl(example.image)}
                  alt={example.word}
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      </div>

      <StageNav onPrev={onPrev} onNext={onStageNext} />

      {awaitNext && round.phase === "feedback" ? (
        <button type="button" className="learn-next internal-next" onClick={round.continueRound} aria-label="Дальше">
          <NextArrowIcon />
        </button>
      ) : null}
    </div>
  );
}
