import { Character } from "./Character";
import { LetterItem, LetterStats } from "../types";
import type { Point } from "../utils/point";
import { BottomNav } from "./BottomNav";
import { WorldBackground } from "./WorldBackground";
import { CARD_TONES } from "../utils/cardTones";
import { SpeakButton } from "./SpeakButton";
import { QuestTrail } from "./QuestTrail";
import { useRound } from "../utils/useRound";

interface ListenAndChooseGameProps {
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

export function ListenAndChooseGame({
  letters,
  stats,
  trailStep = 2,
  lockTarget,
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
    lockTarget,
    onCorrect,
    onMistake,
    onSpeak,
    onFinished,
    speakPrompt: (letter) => letter.upper,
    praise: (letter) => `Правильно! Это буква ${letter.upper}!`
  });

  return (
    <div className="screen game-screen has-bottom-nav">
      <WorldBackground variant="play" />
      <QuestTrail step={trailStep} />
      <Character
        mood={round.phase === "feedback" ? "happy" : "tip"}
        message={round.phase === "feedback" ? "Молодец!" : "Послушай и найди букву"}
      />
      <SpeakButton onClick={round.replay} disabled={round.phase === "feedback"} />
      <div className="cards-row">
        {round.options.map((id, index) => {
          const letter = letters.find((item) => item.id === id);
          if (!letter) {
            return null;
          }
          const isWrongPick = round.selected === id && id !== round.target.id;
          const isCorrectPick = round.phase === "feedback" && id === round.target.id;
          const showHint = round.wrongCount >= 2 && id === round.target.id && round.phase === "question";
          return (
            <button
              key={`${id}-${isWrongPick ? round.shakeNonce : "ok"}`}
              className={`option-card ${CARD_TONES[index % CARD_TONES.length]} ${
                isWrongPick ? "shake" : ""
              } ${isCorrectPick ? "correct pop" : ""} ${showHint ? "hint" : ""}`}
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
