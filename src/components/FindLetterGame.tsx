import { useEffect, useMemo, useState } from "react";
import { Character } from "./Character";
import { LetterItem } from "../types";
import { audioManager } from "../audio/AudioManager";
import { randomOptions, weightedLetterPick } from "../utils/selectors";

const praises = ["Правильно!", "Молодец!", "У тебя получилось!"];

interface FindLetterGameProps {
  letters: LetterItem[];
  mistakes: Record<string, number>;
  onCorrect: (letterId: string) => void;
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

  function handleChoose(id: string) {
    if (correct) return;
    setSelected(id);
    if (id === target.id) {
      setCorrect(true);
      audioManager.playSuccess();
      onCorrect(target.id);
      onSpeak(praises[Math.floor(Math.random() * praises.length)]);
      window.setTimeout(nextRound, 1400);
    } else {
      audioManager.playTryAgain();
      onMistake(target.id);
      setWrongCount((prev) => prev + 1);
      onSpeak("Попробуй ещё разок!");
    }
  }

  return (
    <div className="screen">
      <Character mood={correct ? "happy" : "tip"} message={correct ? "Ура!" : "Найди букву"} />
      <button className="back-btn" onClick={onBack}>
        ←
      </button>
      <div className="task-title">Найди: {target.upper}</div>
      <div className="cards-row">
        {options.map((id) => {
          const letter = letters.find((item) => item.id === id)!;
          const isSelected = selected === id;
          const showHint = wrongCount >= 2 && id === target.id && !correct;
          const className = [
            "option-card",
            isSelected && id !== target.id ? "shake" : "",
            correct && id === target.id ? "correct" : "",
            showHint ? "hint" : ""
          ]
            .join(" ")
            .trim();
          return (
            <button key={id} className={className} onClick={() => handleChoose(id)}>
              {letter.upper}
            </button>
          );
        })}
      </div>
    </div>
  );
}
