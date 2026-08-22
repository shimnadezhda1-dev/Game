import { LetterItem, LetterStats } from "../types";
import type { Point } from "../utils/point";
import { CARD_TONES } from "../utils/cardTones";
import { useRound } from "../utils/useRound";
import { letterVoiceKey } from "../audio/voiceCatalog";
import { GameStage } from "./GameStage";
import { LetterTile } from "./LetterTile";

interface ListenAndChooseGameProps {
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

export function ListenAndChooseGame({
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
}: ListenAndChooseGameProps) {
  const round = useRound({
    letters,
    stats,
    optionCount: 3,
    optionIds,
    lockTarget,
    awaitNext,
    onCorrect,
    onMistake,
    onSpeak,
    onFinished,
    speakPrompt: (letter) => letter.upper,
    speakKey: (letter) => letterVoiceKey("listen", letter.id),
    praise: (letter) => `Молодец! Это буква ${letter.upper}!`,
    praiseKey: (letter) => letterVoiceKey("correct", letter.id)
  });

  return (
    <GameStage
      foxMood={round.phase === "feedback" ? "celebrate" : "tip"}
      bubble={round.phase === "feedback" ? "Молодец!" : "Послушай!"}
      onReplay={round.replay}
      replayKey={round.target.id}
      replayDisabled={round.phase === "feedback"}
      onBack={onBack}
      onNext={awaitNext ? round.continueRound : undefined}
      showNext={awaitNext && round.phase === "feedback"}
    >
      <div className="tiles-row">
        {round.options.map((id, index) => {
          const letter = letters.find((item) => item.id === id);
          if (!letter) {
            return null;
          }
          return (
            <LetterTile
              key={`${id}-${round.shakeNonce}`}
              letter={letter}
              index={index % CARD_TONES.length}
              wrong={round.selected === id && id !== round.target.id}
              correct={round.phase === "feedback" && id === round.target.id}
              hint={round.wrongCount >= 2 && id === round.target.id && round.phase === "question"}
              onClick={(event) => round.choose(id, event)}
            />
          );
        })}
      </div>
    </GameStage>
  );
}
