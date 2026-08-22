import { useEffect, useState } from "react";
import { LetterItem } from "../types";
import { GameStage } from "./GameStage";
import { LearnScene } from "./LearnScene";
import { letterVoiceKey } from "../audio/voiceCatalog";

interface LearnLettersProps {
  letter: LetterItem;
  canGoPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSpeak: (text: string, options?: { key?: string; onEnd?: () => void }) => void;
  onBack: () => void;
  onHome: () => void;
}

export function LearnLetters({
  letter,
  canGoPrev,
  onNext,
  onPrev,
  onSpeak,
  onBack
}: LearnLettersProps) {
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
      bubble={`Это буква ${letter.upper}!`}
      onReplay={speakLetter}
      replayKey={letter.id}
      onBack={canGoPrev ? onPrev : onBack}
      onNext={onNext}
      showNext={ready}
    >
      <LearnScene letter={letter} />
    </GameStage>
  );
}
