import { useEffect, useMemo, useState } from "react";
import { Character } from "./Character";
import { LetterItem } from "../types";
import { audioManager } from "../audio/AudioManager";
import { randomOptions, weightedLetterPick } from "../utils/selectors";
import { LetterVisual } from "./LetterVisual";
import { BottomNav } from "./BottomNav";
import { Point, pointFromEvent } from "../utils/point";

interface PictureLetterGameProps {
  letters: LetterItem[];
  mistakes: Record<string, number>;
  onCorrect: (letterId: string, origin?: Point) => void;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string) => void;
  onBack: () => void;
}

export function PictureLetterGame({
  letters,
  mistakes,
  onCorrect,
  onMistake,
  onSpeak,
  onBack
}: PictureLetterGameProps) {
  const [target, setTarget] = useState<LetterItem>(() => weightedLetterPick(letters, mistakes));
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(false);

  const options = useMemo(() => {
    const ids = randomOptions(target.id, letters.map((l) => l.id), 3);
    return ids.map((id) => letters.find((l) => l.id === id)!);
  }, [target.id, letters]);

  useEffect(() => {
    onSpeak(`Что начинается на ${target.upper}?`);
  }, [target.id, onSpeak, target.upper]);

  function nextRound() {
    setTarget((current) => weightedLetterPick(letters, mistakes, current.id));
    setSelected(null);
    setCorrect(false);
  }

  function choose(id: string, event: { currentTarget: EventTarget }) {
    if (correct) return;
    setSelected(id);
    if (id === target.id) {
      setCorrect(true);
      onCorrect(target.id, pointFromEvent(event));
      window.setTimeout(nextRound, 1700);
    } else {
      audioManager.playTryAgain();
      onMistake(target.id);
      onSpeak("Попробуй ещё разок!");
    }
  }

  return (
    <div className="screen has-bottom-nav">
      <Character mood={correct ? "happy" : "tip"} message={correct ? "Молодец!" : "Что начинается на эту букву?"} />
      <div className="task-title letter-task">{target.upper}</div>
      <div className="cards-row picture-row">
        {options.map((item) => (
          <button
            key={item.id}
            className={`option-card picture-option ${
              selected === item.id && item.id !== target.id ? "shake" : ""
            } ${correct && item.id === target.id ? "correct" : ""}`}
            onClick={(event) => choose(item.id, event)}
          >
            <LetterVisual letter={item} />
            <span className="word">{item.word}</span>
          </button>
        ))}
      </div>
      <BottomNav onBack={onBack} />
    </div>
  );
}
