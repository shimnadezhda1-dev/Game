import { LetterItem, LetterStats } from "../types";
import type { Point } from "../utils/point";
import { letterVoiceKey } from "../audio/voiceCatalog";
import { useRound } from "../utils/useRound";
import { GameStage } from "./GameStage";
import { LetterTile } from "./LetterTile";
import { SpeakButton } from "./SpeakButton";

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
    speakPrompt: () => "Послушай и выбери букву!",
    speakKey: () => "listen-prompt",
    speakFollowUp: (letter) => ({
      text: `${letter.upper}-а-а`,
      key: letterVoiceKey("listen", letter.id)
    }),
    praise: (letter) => `Молодец! Это буква ${letter.upper}!`,
    praiseKey: (letter) => letterVoiceKey("correct", letter.id)
  });

  return (
    <GameStage
      foxMood={round.phase === "feedback" ? "celebrate" : "tip"}
      bubble={round.phase === "feedback" ? "Молодец!" : "Послушай и выбери букву!"}
      onReplay={round.replay}
      replayKey={round.target.id}
      replayDisabled={round.phase === "feedback"}
      onBack={onBack}
      onNext={awaitNext ? round.continueRound : undefined}
      showNext={awaitNext && round.phase === "feedback"}
    >
      <div className="listen-speaker">
        <SpeakButton onClick={round.replay} disabled={round.phase === "feedback"} hintKey={round.target.id} />
      </div>
      <div className="tiles-row">
        {round.options.map((id) => {
          const letter = letters.find((item) => item.id === id);
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
    </GameStage>
  );
}
