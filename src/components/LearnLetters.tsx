import { useEffect, useState } from "react";
import { LetterItem } from "../types";
import { GameStage } from "./GameStage";
import { LearnScene } from "./LearnScene";
import { letterVoiceKey } from "../audio/voiceCatalog";
import { letterTone } from "../utils/cardTones";

interface LearnLettersProps {
  letter: LetterItem;
  letters: LetterItem[];
  onSelectLetter: (id: string) => void;
  onNext: () => void;
  onSpeak: (text: string, options?: { key?: string; onEnd?: () => void }) => void;
  onBack: () => void;
  onHome: () => void;
}

export function LearnLetters({ letter, letters, onSelectLetter, onNext, onSpeak }: LearnLettersProps) {
  const [ready, setReady] = useState(false);

  function speakLetter() {
    onSpeak(letter.voiceText, {
      key: letterVoiceKey("letter", letter.id),
      onEnd: () => setReady(true)
    });
  }

  useEffect(() => {
    setReady(false);
    const timer = window.setTimeout(speakLetter, 500);
    return () => window.clearTimeout(timer);
  }, [letter.id]);

  return (
    <GameStage
      foxMood="happy"
      bubble={`Это буква ${letter.upper}!\n${letter.upper}-а-а!\n${letter.upper} — ${letter.word.toLowerCase()}!`}
      onReplay={speakLetter}
      replayKey={letter.id}
      onNext={onNext}
      showNext={ready}
    >
      <LearnScene letter={letter} />
      <div className="browse-letters">
        {letters.map((item) => (
          <button
            key={item.id}
            className={`toy-cube ${letterTone(item.id)} ${item.id === letter.id ? "is-current" : ""}`}
            onClick={() => onSelectLetter(item.id)}
            aria-label={item.upper}
          >
            {item.upper}
          </button>
        ))}
      </div>
    </GameStage>
  );
}
