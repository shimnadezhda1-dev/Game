import { useEffect, useState } from "react";
import { LetterItem } from "../types";
import { Character } from "./Character";
import { LetterVisual } from "./LetterVisual";
import { BottomNav } from "./BottomNav";
import { WorldBackground } from "./WorldBackground";

interface LearnLettersProps {
  letter: LetterItem;
  onNext: () => void;
  onSpeak: (text: string) => void;
  onBack: () => void;
  onHome: () => void;
}

export function LearnLetters({ letter, onNext, onSpeak, onBack, onHome }: LearnLettersProps) {
  const [speaking, setSpeaking] = useState(false);

  function speakLetter() {
    setSpeaking(true);
    onSpeak(letter.voiceText);
    window.setTimeout(() => setSpeaking(false), 1200);
  }

  useEffect(() => {
    setSpeaking(true);
    onSpeak(letter.voiceText);
    const timer = window.setTimeout(() => setSpeaking(false), 1200);
    return () => window.clearTimeout(timer);
  }, [letter.id, letter.voiceText, onSpeak]);

  return (
    <div className="screen learn-screen has-bottom-nav">
      <WorldBackground variant="play" />
      <Character mood="neutral" message="Слушай и повторяй!" />
      <div className={`hero-letter ${speaking ? "letter-bounce" : ""}`}>{letter.upper}</div>
      <div className="hero-lower">{letter.lower}</div>
      <div className="hero-art">
        <LetterVisual letter={letter} size="hero" />
      </div>
      <div className="caption">
        {letter.upper} — {letter.word}
      </div>
      <button className="listen-btn" onClick={speakLetter}>
        🔊 Послушать
      </button>
      <BottomNav onBack={onBack} onNext={onNext} onHome={onHome} />
    </div>
  );
}
