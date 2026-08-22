import { LetterItem, LetterStats } from "../types";
import type { Point } from "../utils/point";
import { letterVoiceKey } from "../audio/voiceCatalog";
import { GameStage } from "./GameStage";
import { LetterHint } from "./LetterHint";
import { LetterTile } from "./LetterTile";
import { useRound } from "../utils/useRound";
import { useMemo } from "react";

interface FindLetterGameProps {
  letters: LetterItem[];
  stats: Record<string, LetterStats>;
  trailStep?: number;
  lockTarget?: LetterItem;
  optionIds?: string[];
  hint?: "image" | "letter" | "none";
  prompt?: string;
  awaitNext?: boolean;
  onCorrect: (letterId: string, origin?: Point) => void;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string, options?: { key?: string; onEnd?: () => void }) => void;
  onBack: () => void;
  onFinished?: () => void;
}

export function FindLetterGame({
  letters,
  stats,
  lockTarget,
  optionIds,
  hint = "letter",
  prompt,
  awaitNext = false,
  onCorrect,
  onMistake,
  onSpeak,
  onBack,
  onFinished
}: FindLetterGameProps) {
  const stableOptions = useMemo(() => optionIds, [optionIds?.join(",")]);
  const round = useRound({
    letters,
    stats,
    lockTarget,
    optionIds: stableOptions,
    awaitNext,
    onCorrect,
    onMistake,
    onSpeak,
    onFinished,
    speakPrompt: (letter) => prompt ?? `Найди букву ${letter.upper}!`,
    speakKey: (letter) => letterVoiceKey("find", letter.id),
    praise: (letter) => `Молодец! Это буква ${letter.upper}!`,
    praiseKey: (letter) => letterVoiceKey("correct", letter.id)
  });

  const bubble =
    round.phase === "feedback" ? "Молодец!" : prompt ?? `Найди букву ${round.target.upper}!`;

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
      {hint !== "none" ? <LetterHint letter={round.target} showImage={hint === "image"} /> : null}
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
