import { LetterItem, LetterStats } from "../types";
import type { Point } from "../utils/point";
import { letterVoiceKey } from "../audio/voiceCatalog";
import { GameStage } from "./GameStage";
import { LetterHint } from "./LetterHint";
import { LetterTile } from "./LetterTile";
import { GoldStar } from "./GoldStar";
import { StageNav } from "./StageNav";
import { NextArrowIcon } from "./ToyIcons";
import { useRound } from "../utils/useRound";
import { assetUrl, ASSETS } from "../utils/assets";
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
  stars?: number;
  onCorrect: (letterId: string, origin?: Point) => void;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string, options?: { key?: string; onEnd?: () => void }) => void;
  onBack: () => void;
  onPrev?: () => void;
  onStageNext?: () => void;
  onFinished?: () => void;
}

const CHOICE_ART: Record<string, string> = {
  A: ASSETS.find.choiceA,
  G: ASSETS.find.choiceG,
  D: ASSETS.find.choiceD
};

function orderedChoiceIds(ids: string[]): string[] {
  const rank: Record<string, number> = { A: 0, G: 1, D: 2 };
  return [...ids].sort((a, b) => (rank[a] ?? 50) - (rank[b] ?? 50));
}

export function FindLetterGame({
  letters,
  stats,
  lockTarget,
  optionIds,
  hint = "letter",
  prompt,
  awaitNext = false,
  stars = 0,
  onCorrect,
  onMistake,
  onSpeak,
  onBack,
  onPrev,
  onStageNext,
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

  if (hint === "image") {
    const choices = orderedChoiceIds(round.options);
    const titlePrompt = prompt ?? `Найди букву ${round.target.upper}!`;
    const letterMark = round.target.upper;

    return (
      <div className="screen find-screen">
        <div className="find-backdrop" aria-hidden="true">
          <img className="find-meadow" src={assetUrl(ASSETS.find.meadow)} alt="" draggable={false} />
        </div>

        <button className="learn-home" onClick={onBack} aria-label="На главную">
          <span aria-hidden="true">🏠</span>
        </button>

        <div className="learn-hud-right">
          <div className="learn-stars" aria-label={`Звёзды: ${stars}`}>
            <GoldStar size="tiny" />
            <span>{stars}</span>
          </div>
          <button
            className="learn-sound"
            onClick={round.replay}
            disabled={round.phase === "feedback"}
            aria-label="Прослушать"
          >
            <span aria-hidden="true">🔊</span>
          </button>
        </div>

        <img
          className={`find-fox ${round.phase === "feedback" ? "is-celebrate" : ""}`}
          src={assetUrl(ASSETS.find.fox)}
          alt=""
          draggable={false}
        />

        <div className="find-board">
          <h1 className="find-title">
            {titlePrompt.endsWith(`${letterMark}!`) ? (
              <>
                <span className="find-title-text">Найди букву </span>
                <span className="find-title-letter">{letterMark}</span>
                <span className="find-title-text">!</span>
              </>
            ) : (
              <span className="find-title-text">{titlePrompt}</span>
            )}
          </h1>

          <div className="find-hint-card">
            <img
              className="find-hint-letter"
              src={assetUrl(ASSETS.find.letterA)}
              alt={round.target.upper}
              draggable={false}
            />
            <span className="find-hint-divider" aria-hidden="true" />
            <img
              className="find-hint-object"
              src={assetUrl(ASSETS.find.watermelon)}
              alt={round.target.word}
              draggable={false}
            />
          </div>

          <div className="find-choices">
            {choices.map((id) => {
              const letter = letters.find((item) => item.id === id);
              if (!letter) {
                return null;
              }
              const art = CHOICE_ART[id];
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
                  {art ? (
                    <img src={assetUrl(art)} alt={letter.upper} draggable={false} />
                  ) : (
                    letter.upper
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <StageNav onPrev={onPrev} onNext={onStageNext} />

        {awaitNext && round.phase === "feedback" ? (
          <button className="learn-next" onClick={round.continueRound} aria-label="Дальше">
            <NextArrowIcon />
          </button>
        ) : null}
      </div>
    );
  }

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
