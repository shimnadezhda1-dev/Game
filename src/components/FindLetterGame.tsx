import { useEffect, useMemo, useState } from "react";
import { Character } from "./Character";
import { LetterItem } from "../types";
import { audioManager } from "../audio/AudioManager";
import { randomOptions, weightedLetterPick } from "../utils/selectors";
import { BottomNav } from "./BottomNav";
import { Point, pointFromEvent } from "../utils/point";
import { WorldBackground } from "./WorldBackground";

const TONES = ["card-sun", "card-sky", "card-mint", "card-coral"];

interface FindLetterGameProps {
  letters: LetterItem[];
  mistakes: Record<string, number>;
  onCorrect: (letterId: string, origin?: Point) => void;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string) => void;
  onBack: () => void;
}

export function FindLetterGame({
  letters,
  mistakes,
  onCorrect,
  onMistake,
  onSpeak,
  onBack
}: FindLetterGameProps) {
  const [target, setTarget] = useState<LetterItem>(() => weightedLetterPick(letters, mistakes));
  const [wrongCount, setWrongCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(false);

  const options = useMemo(
    () => randomOptions(target.id, letters.map((l) => l.id), 3),
    [target.id, letters]
  );

  useEffect(() => {
    onSpeak(`Найди букву ${target.upper}`);
  }, [target.id, onSpeak, target.upper]);

  function nextRound() {
    setTarget((current) => weightedLetterPick(letters, mistakes, current.id));
    setWrongCount(0);
    setSelected(null);
    setCorrect(false);
  }

  function handleChoose(id: string, event: { currentTarget: EventTarget }) {
    if (correct) return;
    setSelected(id);
    if (id === target.id) {
      setCorrect(true);
      onCorrect(target.id, pointFromEvent(event));
      window.setTimeout(nextRound, 1700);
    } else {
      audioManager.playTryAgain();
      onMistake(target.id);
      setWrongCount((prev) => prev + 1);
      onSpeak("Попробуй ещё разок!");
    }
  }

  return (
    <div className="screen has-bottom-nav">
      <WorldBackground variant="play" />
      <Character mood={correct ? "happy" : "tip"} message={correct ? "Молодец!" : "Найди букву"} />
      <div className="task-title">Найди: {target.upper}</div>
      <div className="cards-row">
        {options.map((id, index) => {
          const letter = letters.find((item) => item.id === id)!;
          const isSelected = selected === id;
          const showHint = wrongCount >= 2 && id === target.id && !correct;
          const className = [
            "option-card",
            TONES[index % TONES.length],
            isSelected && id !== target.id ? "shake" : "",
            correct && id === target.id ? "correct pop" : "",
            showHint ? "hint" : ""
          ]
            .join(" ")
            .trim();
          return (
            <button key={id} className={className} onClick={(event) => handleChoose(id, event)}>
              {letter.upper}
              {correct && id === target.id ? <span className="card-sparkle">✨</span> : null}
            </button>
          );
        })}
      </div>
      <BottomNav onBack={onBack} onHome={onBack} />
    </div>
  );
}
