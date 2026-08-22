import { useEffect, useState } from "react";
import { Character } from "./Character";
import { LetterItem, LetterStats, ProgressState } from "../types";
import type { Point } from "../utils/point";
import { LetterVisual } from "./LetterVisual";
import { FindLetterGame } from "./FindLetterGame";
import { PictureLetterGame } from "./PictureLetterGame";
import { ListenAndChooseGame } from "./ListenAndChooseGame";
import { WorldBackground } from "./WorldBackground";
import { SpeakButton } from "./SpeakButton";
import { BottomNav } from "./BottomNav";
import { isLetterMastered } from "../utils/selectors";

type Step =
  | "intro"
  | "learn"
  | "findLetter"
  | "findPicture"
  | "listenChoose"
  | "reward"
  | "nextLetter";

const STEPS: Step[] = ["intro", "findLetter", "findPicture", "listenChoose", "reward"];

interface AdventurePlayProps {
  letters: LetterItem[];
  stats: Record<string, LetterStats>;
  progress: ProgressState;
  onCorrect: (letterId: string, origin?: Point) => void;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string) => void;
  onBack: () => void;
  onLetterMastered: (letterId: string) => void;
}

function pickLetter(letters: LetterItem[], progress: ProgressState): LetterItem {
  return letters.find((letter) => !isLetterMastered(progress, letter.id)) ?? letters[0];
}

function pickNextLetter(
  letters: LetterItem[],
  progress: ProgressState,
  currentId: string
): LetterItem {
  const index = letters.findIndex((letter) => letter.id === currentId);
  const rotated = [...letters.slice(index + 1), ...letters.slice(0, Math.max(index, 0))];
  return rotated.find((letter) => !isLetterMastered(progress, letter.id)) ?? rotated[0] ?? letters[0];
}

export function AdventurePlay({
  letters,
  stats,
  progress,
  onCorrect,
  onMistake,
  onSpeak,
  onBack,
  onLetterMastered
}: AdventurePlayProps) {
  const [letter, setLetter] = useState<LetterItem>(() => pickLetter(letters, progress));
  const [step, setStep] = useState<Step>("intro");

  useEffect(() => {
    if (step === "intro" || step === "learn") {
      onSpeak(letter.voiceText);
    }
    if (step === "reward") {
      onSpeak(`Ура! Ты выучил букву ${letter.upper}!`);
    }
  }, [step, letter.id]);

  function goNextStep() {
    setStep((current) => {
      const normalized = current === "learn" ? "intro" : current;
      const index = STEPS.indexOf(normalized);
      return STEPS[Math.min(Math.max(index, 0) + 1, STEPS.length - 1)];
    });
  }

  function finishLetter() {
    setStep("nextLetter");
    onLetterMastered(letter.id);
    const next = pickNextLetter(letters, progress, letter.id);
    setLetter(next);
    setStep("intro");
  }

  if (step === "findLetter") {
    return (
      <FindLetterGame
        letters={letters}
        stats={stats}
        trailStep={1}
        lockTarget={letter}
        onCorrect={onCorrect}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onFinished={goNextStep}
      />
    );
  }

  if (step === "findPicture") {
    return (
      <PictureLetterGame
        letters={letters}
        stats={stats}
        trailStep={2}
        lockTarget={letter}
        onCorrect={onCorrect}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onFinished={goNextStep}
      />
    );
  }

  if (step === "listenChoose") {
    return (
      <ListenAndChooseGame
        letters={letters}
        stats={stats}
        trailStep={3}
        lockTarget={letter}
        onCorrect={onCorrect}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onFinished={goNextStep}
      />
    );
  }

  if (step === "reward") {
    return (
      <div className="screen game-screen has-bottom-nav">
        <WorldBackground variant="play" />
        <div className="confetti-layer" aria-hidden>
          {Array.from({ length: 14 }).map((_, index) => (
            <span key={index} className={`confetti-bit bit-${index % 6}`} />
          ))}
        </div>
        <Character mood="celebrate" size="hero" />
        <div className="adventure-star" aria-hidden="true">
          ★
        </div>
        <div className="hero-letter">{letter.upper}</div>
        <div className="hero-art compact-art">
          <LetterVisual letter={letter} size="hero" />
        </div>
        <SpeakButton onClick={() => onSpeak(`Ура! Ты выучил букву ${letter.upper}!`)} />
        <button className="nav-arrow nav-next adventure-go" onClick={finishLetter} aria-label="Дальше">
          →
        </button>
        <BottomNav onBack={onBack} onHome={onBack} />
      </div>
    );
  }

  return (
    <div className="screen learn-screen has-bottom-nav">
      <WorldBackground variant="play" />
      <Character mood="happy" />
      <div className="learn-stage">
        <div className="learn-letter-col">
          <div className="hero-letter">{letter.upper}</div>
          <div className="hero-lower">{letter.lower}</div>
        </div>
        <div className="hero-art">
          <LetterVisual letter={letter} size="hero" />
        </div>
      </div>
      <SpeakButton onClick={() => onSpeak(letter.voiceText)} />
      <button className="nav-arrow nav-next adventure-go pulse-hint" onClick={goNextStep} aria-label="Дальше">
        →
      </button>
      <BottomNav onBack={onBack} onHome={onBack} />
    </div>
  );
}
