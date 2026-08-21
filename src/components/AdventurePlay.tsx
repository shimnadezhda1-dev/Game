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
import { QuestTrail } from "./QuestTrail";
import { BottomNav } from "./BottomNav";
import { isLetterMastered } from "../utils/selectors";

type Step = "intro" | "find" | "picture" | "listen" | "reward";

const STEPS: Step[] = ["intro", "find", "picture", "listen", "reward"];

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
    if (step === "intro") {
      onSpeak(letter.voiceText);
    }
    if (step === "reward") {
      onSpeak(`Ура! Ты познакомился с буквой ${letter.upper}!`);
    }
  }, [step, letter.id]);

  function goNextStep() {
    setStep((current) => {
      const index = STEPS.indexOf(current);
      return STEPS[Math.min(index + 1, STEPS.length - 1)];
    });
  }

  function finishLetter() {
    onLetterMastered(letter.id);
    const remaining = letters.filter(
      (item) => item.id !== letter.id && !isLetterMastered(progress, item.id)
    );
    const next = remaining[0] ?? letters.find((item) => item.id !== letter.id) ?? letter;
    setLetter(next);
    setStep("intro");
  }

  if (step === "find") {
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

  if (step === "picture") {
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

  if (step === "listen") {
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
        <QuestTrail step={4} />
        <Character mood="celebrate" size="hero" message="Ура!" />
        <div className="hero-letter">{letter.upper}</div>
        <div className="hero-art compact-art">
          <LetterVisual letter={letter} size="hero" />
        </div>
        <div className="caption">Ты познакомился с буквой {letter.upper}!</div>
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
      <QuestTrail step={0} />
      <Character mood="happy" message="Пойдём искать буквы!" />
      <div className="learn-stage">
        <div className="learn-letter-col">
          <div className="hero-letter">{letter.upper}</div>
          <div className="hero-lower">{letter.lower}</div>
        </div>
        <div className="hero-art">
          <LetterVisual letter={letter} size="hero" />
        </div>
      </div>
      <div className="caption">
        {letter.upper} — {letter.word}
      </div>
      <SpeakButton onClick={() => onSpeak(letter.voiceText)} />
      <button className="nav-arrow nav-next adventure-go pulse-hint" onClick={goNextStep} aria-label="Дальше">
        →
      </button>
      <BottomNav onBack={onBack} onHome={onBack} />
    </div>
  );
}
