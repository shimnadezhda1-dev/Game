import { useEffect, useRef, useState } from "react";
import { LetterItem } from "../types";
import { Character } from "./Character";
import { LetterVisual } from "./LetterVisual";
import { BottomNav } from "./BottomNav";
import { WorldBackground } from "./WorldBackground";
import { SpeakButton } from "./SpeakButton";

interface LearnLettersProps {
  letter: LetterItem;
  canGoPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSpeak: (text: string) => void;
  onBack: () => void;
  onHome: () => void;
}

export function LearnLetters({
  letter,
  canGoPrev,
  onNext,
  onPrev,
  onSpeak,
  onBack,
  onHome
}: LearnLettersProps) {
  const [speaking, setSpeaking] = useState(false);
  const timerRef = useRef<number | null>(null);

  function speakLetter() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setSpeaking(true);
    onSpeak(letter.voiceText);
    timerRef.current = window.setTimeout(() => setSpeaking(false), 1400);
  }

  useEffect(() => {
    speakLetter();
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [letter.id]);

  return (
    <div className="screen learn-screen has-bottom-nav">
      <WorldBackground variant="play" />
      <Character mood="neutral" message="Слушай и смотри!" />
      <div className="learn-stage">
        <div className="learn-letter-col">
          <div className={`hero-letter ${speaking ? "letter-bounce" : ""}`}>{letter.upper}</div>
          <div className="hero-lower">{letter.lower}</div>
        </div>
        <div className="hero-art">
          <LetterVisual letter={letter} size="hero" />
        </div>
      </div>
      <div className="caption">
        {letter.upper} — {letter.word}
      </div>
      <SpeakButton onClick={speakLetter} />
      <BottomNav
        onBack={canGoPrev ? onPrev : onBack}
        onNext={onNext}
        onHome={onHome}
      />
    </div>
  );
}
