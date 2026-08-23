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
import { findLetterPrompt, letterChoiceSrc, letterGlyphSrc, letterObjectSrc } from "../utils/letterCopy";
import { planFindColors } from "../utils/findColors";
import { ToyLetter } from "./ToyLetter";
import { LetterPlaceholder } from "./LetterPlaceholder";
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
    speakPrompt: (item) => findLetterPrompt(item),
    speakKey: (item) => letterVoiceKey("find", item.id),
    praise: (item) => `Молодец! Это буква ${item.upper}!`,
    praiseKey: (letter) => letterVoiceKey("correct", letter.id)
  });

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
                alt={target.word}
                draggable={false}
              />
            ) : (
              <LetterPlaceholder letter={target} className="find-hint-object" />
            )}
          </div>

          <div className="find-choices">
            {choices.map((id) => {
              const letter = letters.find((item) => item.id === id);
              if (!letter) {
                return null;
              }
              const art = letterChoiceSrc(letter);
              const tone = colorPlan.buttonColors[id] ?? "pink";
              const hueRotate = colorPlan.buttonHueRotates[id] ?? 0;
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
                    <img
                      src={assetUrl(art)}
                      alt={letter.upper}
                      draggable={false}
                      style={{ filter: `hue-rotate(${hueRotate}deg)` }}
                    />
                  ) : (
                    <span className={`find-choice-tile find-choice-tile-${tone}`}>{letter.upper}</span>
                  )}
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
