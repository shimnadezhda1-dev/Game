import { useEffect, useMemo, useState } from "react";
import { LetterItem, LetterStats, ProgressState } from "../types";
import type { Point } from "../utils/point";
import { FindLetterGame } from "./FindLetterGame";
import { ListenAndChooseGame } from "./ListenAndChooseGame";
import { PictureLetterGame } from "./PictureLetterGame";
import { GameStage } from "./GameStage";
import { GoldStar } from "./GoldStar";
import { LearnScene } from "./LearnScene";
import { ToyLetter } from "./ToyLetter";
import { isLetterMastered, shuffle } from "../utils/selectors";
import { letterVoiceKey } from "../audio/voiceCatalog";

type Step = "learn" | "findHint" | "findLetter" | "findPicture" | "listenChoose" | "reward";

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

function listenOptions(targetId: string, allIds: string[]): string[] {
  const first = allIds.slice(0, 3);
  if (first.includes(targetId) && first.length === 3) {
    return shuffle(first);
  }
  return lessonOptions(targetId, allIds);
}

function learnBubble(letter: LetterItem): string {
  return `Это буква ${letter.upper}!\n${letter.upper}-а-а!\n${letter.upper} — ${letter.word.toLowerCase()}!`;
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
  const allIds = letters.map((item) => item.id);
  const optionIds = useMemo(() => lessonOptions(letter.id, allIds), [letter.id]);
  const listenIds = useMemo(() => listenOptions(letter.id, allIds), [letter.id]);

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
        prompt={`Найди букву ${letter.upper}!`}
        awaitNext
        onCorrect={onCorrect}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onFinished={() => setStep("findLetter")}
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
        onFinished={() => setStep("findPicture")}
      />
    );
  }

  if (step === "findPicture") {
    return (
      <PictureLetterGame
        letters={letters}
        stats={stats}
        lockTarget={letter}
        optionIds={optionIds}
        awaitNext
        onCorrect={onCorrect}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onFinished={() => setStep("listenChoose")}
      />
    );
  }

  if (step === "listenChoose") {
    return (
      <ListenAndChooseGame
        letters={letters}
        stats={stats}
        lockTarget={letter}
        optionIds={listenIds}
        awaitNext
        onCorrect={onCorrect}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onFinished={() => setStep("reward")}
      />
    );
  }

  if (step === "reward") {
    return (
      <GameStage
        foxMood="celebrate"
        bubble={`Ура! Ты выучил букву ${letter.upper}!`}
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
          <div className="confetti-layer reward-confetti" aria-hidden>
            {Array.from({ length: 8 }).map((_, index) => (
              <span key={index} className={`confetti-bit bit-${index % 6}`} />
            ))}
          </div>
          <GoldStar size="hero" />
          <ToyLetter letterId={letter.id} glyph={letter.upper} size="hint" />
        </div>
      </GameStage>
    );
  }

  return (
    <GameStage
      foxMood="happy"
      bubble={learnBubble(letter)}
      onReplay={() =>
        onSpeak(letter.voiceText, {
          key: letterVoiceKey("letter", letter.id),
          onEnd: () => setNextReady(true)
        })
      }
      replayKey={letter.id}
      onBack={onBack}
      onNext={() => setStep("findHint")}
      showNext={nextReady}
    >
      <LearnScene letter={letter} />
    </GameStage>
  );
}
