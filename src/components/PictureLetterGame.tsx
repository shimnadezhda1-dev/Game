import { LetterItem, LetterStats } from "../types";
import type { Point } from "../utils/point";
import { letterVoiceKey } from "../audio/voiceCatalog";
import { letterTone } from "../utils/cardTones";
import { useRound } from "../utils/useRound";
import { GameStage } from "./GameStage";
import { LetterVisual } from "./LetterVisual";

interface PictureLetterGameProps {
  letters: LetterItem[];
  stats: Record<string, LetterStats>;
  trailStep?: number;
  lockTarget?: LetterItem;
  optionIds?: string[];
  awaitNext?: boolean;
  onCorrect: (letterId: string, origin?: Point) => void;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string, options?: { key?: string; onEnd?: () => void }) => void;
  onBack: () => void;
  onFinished?: () => void;
}

export function PictureLetterGame({
  letters,
  stats,
  lockTarget,
  optionIds,
  awaitNext = false,
  onCorrect,
  onMistake,
  onSpeak,
  onBack,
  onFinished
}: PictureLetterGameProps) {
  const round = useRound({
    letters,
    stats,
    lockTarget,
    optionIds,
    awaitNext,
    onCorrect,
    onMistake,
    onSpeak,
    onFinished,
    speakPrompt: (letter) => `Что начинается на букву ${letter.upper}?`,
    speakKey: (letter) => letterVoiceKey("picture", letter.id),
    praise: (letter) => `Молодец! Это ${letter.word.toLowerCase()}!`,
    praiseKey: (letter) => letterVoiceKey("correct", letter.id)
  });

  const bubble =
    round.phase === "feedback"
      ? "Молодец!"
      : `Что начинается на букву ${round.target.upper}?`;

  return (
    <GameStage
      foxMood={round.phase === "feedback" ? "celebrate" : "tip"}
      bubble={bubble}
      onReplay={round.replay}
      replayKey={round.target.id}
      replayDisabled={round.phase === "feedback"}
      onBack={onBack}
      onNext={awaitNext ? round.continueRound : undefined}
      showNext={awaitNext && round.phase === "feedback"}
    >
      <div className="tiles-row picture-tiles">
        {round.options.map((id) => {
          const item = letters.find((letter) => letter.id === id);
          if (!item) {
            return null;
          }
          const isWrongPick = round.selected === id && id !== round.target.id;
          const isCorrectPick = round.phase === "feedback" && id === round.target.id;
          return (
            <button
              key={`${item.id}-${isWrongPick ? round.shakeNonce : "ok"}`}
              className={`picture-tile ${letterTone(item.id)} ${isWrongPick ? "shake" : ""} ${
                isCorrectPick ? "tile-correct" : ""
              }`}
              onClick={(event) => round.choose(id, event)}
              aria-label={item.word}
            >
              <LetterVisual letter={item} size="card" />
              {isCorrectPick ? (
                <span className="tile-sparkles" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </GameStage>
  );
}
