import { useEffect, useMemo, useState } from "react";
import { LetterItem, LetterStats, ProgressState } from "../types";
import type { Point } from "../utils/point";
import { FindLetterGame } from "./FindLetterGame";
import { ListenAndChooseGame } from "./ListenAndChooseGame";
import { GameStage } from "./GameStage";
import { LearnScene } from "./LearnScene";
import { isLetterMastered, shuffle } from "../utils/selectors";
import { letterVoiceKey } from "../audio/voiceCatalog";

type Step = "learn" | "findHint" | "findLetter" | "listenChoose" | "reward";

interface AdventurePlayProps {
  letters: LetterItem[];
  stats: Record<string, LetterStats>;
  progress: ProgressState;
  onCorrect: (letterId: string, origin?: Point) => void;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string, options?: { key?: string; onEnd?: () => void }) => void;
  onBack: () => void;
  onLetterMastered: (letterId: string) => void;
}

function pickLetter(letters: LetterItem[], progress: ProgressState): LetterItem {
  return letters.find((item) => !isLetterMastered(progress, item.id)) ?? letters[0];
}

function pickNextLetter(
  letters: LetterItem[],
  progress: ProgressState,
  currentId: string
): LetterItem {
  const index = letters.findIndex((item) => item.id === currentId);
  const rotated = [...letters.slice(index + 1), ...letters.slice(0, Math.max(index, 0))];
  return rotated.find((item) => !isLetterMastered(progress, item.id)) ?? rotated[0] ?? letters[0];
}

function lessonOptions(targetId: string, allIds: string[]): string[] {
  const others = allIds.filter((id) => id !== targetId);
  return shuffle([targetId, ...others.slice(-2)]);
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
  const [step, setStep] = useState<Step>("learn");
  const [nextReady, setNextReady] = useState(false);
  const optionIds = useMemo(
    () => lessonOptions(letter.id, letters.map((item) => item.id)),
    [letter.id]
  );

  useEffect(() => {
    setNextReady(false);
    if (step !== "learn" && step !== "reward") {
      return;
    }
    const timer = window.setTimeout(() => {
      if (step === "learn") {
        onSpeak(letter.voiceText, {
          key: letterVoiceKey("letter", letter.id),
          onEnd: () => setNextReady(true)
        });
      }
      if (step === "reward") {
        onSpeak(`Ура! Ты выучил букву ${letter.upper}!`, {
          key: letterVoiceKey("reward", letter.id),
          onEnd: () => setNextReady(true)
        });
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [step, letter.id]);

  function goFindHint() {
    setStep("findHint");
  }

  function goFindLetter() {
    setStep("findLetter");
  }

  function goListen() {
    setStep("listenChoose");
  }

  function goReward() {
    setStep("reward");
    setNextReady(false);
  }

  function finishLetter() {
    onLetterMastered(letter.id);
    const next = pickNextLetter(letters, progress, letter.id);
    setLetter(next);
    setStep("learn");
    setNextReady(false);
  }

  if (step === "findHint") {
    return (
      <FindLetterGame
        letters={letters}
        stats={stats}
        lockTarget={letter}
        optionIds={optionIds}
        hint="image"
        prompt={`А теперь найди букву ${letter.upper}!`}
        awaitNext
        onCorrect={onCorrect}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onFinished={goFindLetter}
      />
    );
  }

  if (step === "findLetter") {
    return (
      <FindLetterGame
        letters={letters}
        stats={stats}
        lockTarget={letter}
        optionIds={optionIds}
        hint="letter"
        prompt={`Найди букву ${letter.upper}!`}
        awaitNext
        onCorrect={onCorrect}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onFinished={goListen}
      />
    );
  }

  if (step === "listenChoose") {
    return (
      <ListenAndChooseGame
        letters={letters}
        stats={stats}
        lockTarget={letter}
        optionIds={optionIds}
        awaitNext
        onCorrect={onCorrect}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onFinished={goReward}
      />
    );
  }

  if (step === "reward") {
    return (
      <GameStage
        foxMood="celebrate"
        bubble="Ура!"
        onReplay={() =>
          onSpeak(`Ура! Ты выучил букву ${letter.upper}!`, {
            key: letterVoiceKey("reward", letter.id)
          })
        }
        onBack={onBack}
        onNext={finishLetter}
        showNext={nextReady}
      >
        <div className="reward-scene">
          <div className="adventure-star" aria-hidden="true">
            ★
          </div>
          <LearnScene letter={letter} />
        </div>
      </GameStage>
    );
  }

  return (
    <GameStage
      foxMood="happy"
      bubble={`Это буква ${letter.upper}!`}
      onReplay={() =>
        onSpeak(letter.voiceText, {
          key: letterVoiceKey("letter", letter.id),
          onEnd: () => setNextReady(true)
        })
      }
      replayKey={letter.id}
      onBack={onBack}
      onNext={goFindHint}
      showNext={nextReady}
    >
      <LearnScene letter={letter} />
    </GameStage>
  );
}
