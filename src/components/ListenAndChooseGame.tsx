import { useEffect, useMemo, useState } from "react";
import { Character } from "./Character";
import { LetterItem } from "../types";
import { audioManager } from "../audio/AudioManager";
import { randomOptions, weightedLetterPick } from "../utils/selectors";
import { BottomNav } from "./BottomNav";
import { Point, pointFromEvent } from "../utils/point";
import { WorldBackground } from "./WorldBackground";
import { CARD_TONES } from "../utils/cardTones";

interface ListenAndChooseGameProps {
  letters: LetterItem[];
  mistakes: Record<string, number>;
  onCorrect: (letterId: string, origin?: Point) => void;
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
    [target.id, letters]
  );

  const phrase = `Найди букву ${target.upper}`;

  useEffect(() => {
    onSpeak(phrase);
  }, [phrase, onSpeak]);

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
      <WorldBackground variant="play" />
      <Character mood={correct ? "happy" : "tip"} message={correct ? "Молодец!" : "Слушай внимательно"} />
      <button className="menu-btn repeat-btn" onClick={() => onSpeak(phrase)}>
        🔊 Повторить
      </button>
      <div className="cards-row cards-row-4">
        {options.map((id, index) => {
          const letter = letters.find((item) => item.id === id)!;
          return (
            <button
              key={id}
              className={`option-card ${CARD_TONES[index % CARD_TONES.length]} ${
                selected === id && id !== target.id ? "shake" : ""
              } ${correct && id === target.id ? "correct pop" : ""}`}
              onClick={(event) => choose(id, event)}
            >
              {letter.upper}
            </button>
          );
        })}
      </div>
      <BottomNav onBack={onBack} onHome={onBack} />
    </div>
  );
}
