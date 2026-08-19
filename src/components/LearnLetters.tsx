import { useEffect } from "react";
import { LetterItem } from "../types";
import { Character } from "./Character";
import { LetterVisual } from "./LetterVisual";

interface LearnLettersProps {
  letter: LetterItem;
  onNext: () => void;
  onSpeak: (text: string) => void;
  onBack: () => void;
}

export function LearnLetters({ letter, onNext, onSpeak, onBack }: LearnLettersProps) {
  useEffect(() => {
    onSpeak(letter.voiceText);
  }, [letter.id, letter.voiceText, onSpeak]);

  return (
    <div className="screen">
      <Character mood="neutral" message="Слушай и повторяй!" />
      <button className="back-btn" onClick={onBack}>
        ←
      </button>
      <div className="letter-card">
        <div className="main-letter">
          {letter.upper} {letter.lower}
        </div>
        <button className="speak-btn" onClick={() => onSpeak(letter.voiceText)}>
          🔊
        </button>
      </div>
      <div className="picture-card bounce">
        <LetterVisual letter={letter} />
        <div className="word">{letter.word}</div>
      </div>
      <button className="next-btn" onClick={onNext}>
        →
      </button>
    </div>
  );
}
