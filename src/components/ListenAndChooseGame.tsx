import { useEffect, useMemo, useState } from "react";
import { Character } from "./Character";
import { LetterItem } from "../types";
import { randomOptions, weightedLetterPick } from "../utils/selectors";

interface ListenAndChooseGameProps {
  letters: LetterItem[];
  mistakes: Record<string, number>;
  onCorrect: (letterId: string) => void;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string) => void;
  onBack: () => void;
}

export function ListenAndChooseGame({
  letters,
  mistakes,
  onCorrect,
  onMistake,
  onSpeak,
  onBack
}: ListenAndChooseGameProps) {
  const [target, setTarget] = useState<LetterItem>(() => weightedLetterPick(letters, mistakes));
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(false);

  const options = useMemo(
    () => randomOptions(target.id, letters.map((l) => l.id), 4),
    [target, letters]
  );

  const phrase = `Найди букву ${target.upper}`;

  useEffect(() => {
    onSpeak(phrase);
  }, [phrase, onSpeak]);

  function nextRound() {
    setTarget(weightedLetterPick(letters, mistakes));
    setSelected(null);
    setCorrect(false);
  }

  function choose(id: string) {
    if (correct) return;
    setSelected(id);
    if (id === target.id) {
      setCorrect(true);
      onCorrect(target.id);
      onSpeak("Молодец!");
      window.setTimeout(nextRound, 1000);
    } else {
      onMistake(target.id);
      onSpeak("Попробуй ещё!");
    }
  }

  return (
    <div className="screen">
      <Character mood={correct ? "happy" : "tip"} message="Слушай внимательно" />
      <button className="back-btn" onClick={onBack}>
        ←
      </button>
      <button className="menu-btn repeat-btn" onClick={() => onSpeak(phrase)}>
        🔊 Повторить
      </button>
      <div className="cards-row">
        {options.map((id) => {
          const letter = letters.find((item) => item.id === id)!;
          return (
            <button
              key={id}
              className={`option-card ${selected === id && id !== target.id ? "shake" : ""} ${
                correct && id === target.id ? "correct" : ""
              }`}
              onClick={() => choose(id)}
            >
              {letter.upper}
            </button>
          );
        })}
      </div>
    </div>
  );
}
