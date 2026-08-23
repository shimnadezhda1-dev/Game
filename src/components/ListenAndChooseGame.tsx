import { useMemo } from "react";
import { LetterItem, LetterStats } from "../types";
import type { Point } from "../utils/point";
import { letterVoiceKey } from "../audio/voiceCatalog";
import { useRound } from "../utils/useRound";
import { GoldStar } from "./GoldStar";
import { StageNav } from "./StageNav";
import { NextArrowIcon } from "./ToyIcons";
import { assetUrl, ASSETS } from "../utils/assets";

interface ListenAndChooseGameProps {
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
  onPrev?: () => void;
  onStageNext?: () => void;
  onFinished?: () => void;
}

const LETTER_TONE: Record<string, string> = {
  A: "pink",
  B: "orange",
  V: "teal",
  G: "purple",
  D: "blue"
};

const LISTEN_FALLBACK_TONES = ["pink", "orange", "teal", "purple", "blue"];

function listenTone(id: string): string {
  if (LETTER_TONE[id]) {
    return LETTER_TONE[id];
  }
  const index = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return LISTEN_FALLBACK_TONES[index % LISTEN_FALLBACK_TONES.length];
}

export function ListenAndChooseGame({
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
  onPrev,
  onStageNext,
  onFinished
}: ListenAndChooseGameProps) {
  const stableOptions = useMemo(() => optionIds, [optionIds?.join(",")]);
  const round = useRound({
    letters,
    stats,
    optionCount: 3,
    optionIds: stableOptions,
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

  function playTargetLetter() {
    if (celebrating) {
      return;
    }
    onSpeak(round.target.upper, { key: letterVoiceKey("listen", round.target.id) });
  }

  return (
    <div className="screen listen-screen">
      <div className="listen-backdrop" aria-hidden="true">
        <img
          className="listen-meadow"
          src={assetUrl(ASSETS.listen.meadow)}
          alt=""
          draggable={false}
        />
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
          disabled={celebrating}
          aria-label="Прослушать"
        >
          <span aria-hidden="true">🔊</span>
        </button>
      </div>

      {celebrating ? (
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
          <div className="listen-choices">
            {round.options.map((id) => {
              const item = letters.find((letter) => letter.id === id);
              if (!item) {
                return null;
              }
              const tone = listenTone(id);
              return (
                <button
                  key={id}
                  className={`listen-letter listen-letter-${tone}`}
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

      <StageNav onPrev={onPrev} onNext={onStageNext} />

      {awaitNext && celebrating ? (
        <button type="button" className="learn-next internal-next" onClick={round.continueRound} aria-label="Дальше">
          <NextArrowIcon />
        </button>
      ) : null}
    </div>
  );
}
