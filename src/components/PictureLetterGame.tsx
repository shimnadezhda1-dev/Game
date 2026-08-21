import { Character } from "./Character";
import { LetterItem, LetterStats } from "../types";
import type { Point } from "../utils/point";
import { LetterVisual } from "./LetterVisual";
import { BottomNav } from "./BottomNav";
import { WorldBackground } from "./WorldBackground";
import { CARD_TONES } from "../utils/cardTones";
import { SpeakButton } from "./SpeakButton";
import { QuestTrail } from "./QuestTrail";
import { useRound } from "../utils/useRound";

interface PictureLetterGameProps {
  letters: LetterItem[];
  stats: Record<string, LetterStats>;
  trailStep?: number;
  lockTarget?: LetterItem;
  onCorrect: (letterId: string, origin?: Point) => void;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string) => void;
  onBack: () => void;
  onFinished?: () => void;
}

export function PictureLetterGame({
  letters,
  stats,
  trailStep = 1,
  lockTarget,
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
    onCorrect,
    onMistake,
    onSpeak,
    onFinished,
    speakPrompt: (letter) => `Что начинается на букву ${letter.upper}?`,
    praise: (letter) => `Молодец! Это буква ${letter.upper}!`
  });

  return (
    <div className="screen game-screen has-bottom-nav">
      <WorldBackground variant="play" />
      <QuestTrail step={trailStep} />
      <Character
        mood={round.phase === "feedback" ? "happy" : "tip"}
        message={round.phase === "feedback" ? "Молодец!" : `Что начинается на ${round.target.upper}?`}
      />
      <div className="letter-anchor">{round.target.upper}</div>
      <SpeakButton onClick={round.replay} disabled={round.phase === "feedback"} hintKey={round.target.id} />
      <div className="cards-row picture-row">
        {round.options.map((id, index) => {
          const item = letters.find((letter) => letter.id === id);
          if (!item) {
            return null;
          }
          const isWrongPick = round.selected === id && id !== round.target.id;
          const isCorrectPick = round.phase === "feedback" && id === round.target.id;
          return (
            <button
              key={`${item.id}-${isWrongPick ? round.shakeNonce : "ok"}`}
              className={`option-card picture-option ${CARD_TONES[index % CARD_TONES.length]} ${
                isWrongPick ? "shake" : ""
              } ${isCorrectPick ? "correct pop" : ""}`}
              onClick={(event) => round.choose(id, event)}
            >
              <LetterVisual letter={item} size="card" />
              <span className="word">{item.word}</span>
            </button>
          );
        })}
      </div>
      <BottomNav onBack={onBack} onHome={onBack} />
    </div>
  );
}
