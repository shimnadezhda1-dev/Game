import { useMemo } from "react";
import { LetterItem, LetterStats } from "../types";
import type { Point } from "../utils/point";
import { letterVoiceKey } from "../audio/voiceCatalog";
import { useRound } from "../utils/useRound";
import { GoldStar } from "./GoldStar";
import { NextArrowIcon } from "./ToyIcons";
import { assetUrl, ASSETS } from "../utils/assets";

interface PictureLetterGameProps {
  letters: LetterItem[];
  stats: Record<string, LetterStats>;
  trailStep?: number;
  lockTarget?: LetterItem;
  optionIds?: string[];
  awaitNext?: boolean;
  stars?: number;
  onCorrect: (letterId: string, origin?: Point) => void;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string, options?: { key?: string; onEnd?: () => void }) => void;
  onBack: () => void;
  onFinished?: () => void;
}

const PICTURE_ART: Record<string, string> = {
  A: ASSETS.picture.watermelon,
  G: ASSETS.picture.mushroom,
  D: ASSETS.picture.house
};

export function PictureLetterGame({
  letters,
  stats,
  lockTarget,
  optionIds,
  awaitNext = false,
  stars = 0,
  onCorrect,
  onMistake,
  onSpeak,
  onBack,
  onFinished
}: PictureLetterGameProps) {
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
    speakPrompt: (letter) => `Что начинается на букву ${letter.upper}?`,
    speakKey: (letter) => letterVoiceKey("picture", letter.id),
    praise: (letter) => `Молодец! Это ${letter.word.toLowerCase()}!`,
    praiseKey: (letter) => letterVoiceKey("correct", letter.id),
    tryAgainText: "Попробуй ещё раз!",
    playWrongSound: false
  });

  const letterMark = round.target.upper;

  return (
    <div className="screen picture-screen">
      <div className="picture-backdrop" aria-hidden="true">
        <img
          className="picture-meadow"
          src={assetUrl(ASSETS.picture.meadow)}
          alt=""
          draggable={false}
        />
      </div>

      <button className="learn-home" onClick={onBack} aria-label="Домой">
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
          aria-label="Послушать"
        >
          <span aria-hidden="true">🔊</span>
        </button>
      </div>

      <div className="picture-board">
        <h1 className="picture-title">
          <span className="picture-title-text">Что начинается на букву </span>
          <span className="picture-title-letter">{letterMark}</span>
          <span className="picture-title-text">?</span>
        </h1>

        <div className="picture-choices">
          {round.options.map((id) => {
            const item = letters.find((letter) => letter.id === id);
            if (!item) {
              return null;
            }
            const art = PICTURE_ART[id] ?? item.imagePath;
            const isChosenCorrect = round.phase === "feedback" && id === round.target.id;
            const isWatermelon = id === "A";
            return (
              <button
                key={id}
                className={`picture-choice ${isChosenCorrect ? "is-chosen" : ""}`}
                onClick={(event) => round.choose(id, event)}
                aria-label={item.word}
              >
                <img
                  className={isWatermelon ? "picture-choice-watermelon" : undefined}
                  src={assetUrl(art)}
                  alt={item.word}
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      </div>

      {awaitNext && round.phase === "feedback" ? (
        <button className="learn-next" onClick={round.continueRound} aria-label="Дальше">
          <NextArrowIcon />
        </button>
      ) : null}
    </div>
  );
}
