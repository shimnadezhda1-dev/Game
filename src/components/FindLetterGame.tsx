import { Character } from "./Character";
import { LetterItem, LetterStats } from "../types";
import type { Point } from "../utils/point";
import { BottomNav } from "./BottomNav";
import { WorldBackground } from "./WorldBackground";
import { CARD_TONES } from "../utils/cardTones";
import { SpeakButton } from "./SpeakButton";
import { QuestTrail } from "./QuestTrail";
import { useRound } from "../utils/useRound";

interface FindLetterGameProps {
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

export function FindLetterGame({
  letters,
  stats,
  trailStep = 0,
  lockTarget,
  onCorrect,
  onMistake,
  onSpeak,
  onBack,
  onFinished
}: FindLetterGameProps) {
  const round = useRound({
    letters,
    stats,
    lockTarget,
    onCorrect,
    onMistake,
    onSpeak,
    onFinished,
    speakPrompt: (letter) => `Найди букву ${letter.upper}!`,
    praise: (letter) => `Молодец! Это буква ${letter.upper}!`
  });

  return (
    <div className="screen game-screen has-bottom-nav">
      <WorldBackground variant="play" />
      <QuestTrail step={trailStep} />
      <Character
        mood={round.phase === "feedback" ? "happy" : "tip"}
        message={round.phase === "feedback" ? "Молодец!" : `Найди букву ${round.target.upper}`}
      />
      <SpeakButton onClick={round.replay} disabled={round.phase === "feedback"} hintKey={round.target.id} />
      <div className="task-pill" aria-label={`Найди букву ${round.target.upper}`}>
        <span className="task-letter">{round.target.upper}</span>
      </div>
      <div className="cards-row">
        {round.options.map((id, index) => {
          const letter = letters.find((item) => item.id === id);
          if (!letter) {
            return null;
          }
          const isWrongPick = round.selected === id && id !== round.target.id;
          const isCorrectPick = round.phase === "feedback" && id === round.target.id;
          const showHint = round.wrongCount >= 2 && id === round.target.id && round.phase === "question";
          const className = [
            "option-card",
            CARD_TONES[index % CARD_TONES.length],
            isWrongPick ? "shake" : "",
            isCorrectPick ? "correct pop" : "",
            showHint ? "hint" : ""
          ]
            .join(" ")
            .trim();
          return (
            <button
              key={`${id}-${isWrongPick ? round.shakeNonce : "ok"}`}
              className={className}
              onClick={(event) => round.choose(id, event)}
            >
              {letter.upper}
              {isCorrectPick ? <span className="card-sparkle">✨</span> : null}
            </button>
          );
        })}
      </div>
      <BottomNav onBack={onBack} onHome={onBack} />
    </div>
  );
}
