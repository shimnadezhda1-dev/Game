import { useEffect, useMemo, useState } from "react";
import { LetterItem, LetterStats, ProgressState } from "../types";
import type { Point } from "../utils/point";
import { FindLetterGame } from "./FindLetterGame";
import { ListenAndChooseGame } from "./ListenAndChooseGame";
import { PictureLetterGame } from "./PictureLetterGame";
import { GameStage } from "./GameStage";
import { GoldStar } from "./GoldStar";
import { LearnLetters } from "./LearnLetters";
import { ToyLetter } from "./ToyLetter";
import { isLetterMastered, shuffle } from "../utils/selectors";
import { letterVoiceKey } from "../audio/voiceCatalog";

type Step = "learn" | "findHint" | "findLetter" | "findPicture" | "listenChoose" | "reward";

const STAGE_FLOW = ["learn", "findHint", "findPicture", "listenChoose"] as const;
type FlowStep = (typeof STAGE_FLOW)[number];

function toFlowStep(step: Step): FlowStep {
  if (step === "findLetter") {
    return "findHint";
  }
  if (step === "reward") {
    return "listenChoose";
  }
  return step;
}

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
    if (step !== "reward") {
      return;
    }
    const timer = window.setTimeout(() => {
      onSpeak(`Ура! Ты выучил букву ${letter.upper}!`, {
        key: letterVoiceKey("reward", letter.id),
        onEnd: () => setNextReady(true)
      });
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

  const flowIndex = STAGE_FLOW.indexOf(toFlowStep(step));
  const prevStage = flowIndex > 0 ? STAGE_FLOW[flowIndex - 1] : undefined;
  const nextStage =
    flowIndex >= 0 && flowIndex < STAGE_FLOW.length - 1 ? STAGE_FLOW[flowIndex + 1] : undefined;
  const onStagePrev = prevStage ? () => setStep(prevStage) : undefined;
  const onStageNext = nextStage ? () => setStep(nextStage) : undefined;

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
        stars={progress.stars}
        onCorrect={onCorrect}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onPrev={onStagePrev}
        onStageNext={onStageNext}
        onFinished={() => setStep("findPicture")}
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
        hint="image"
        prompt={`Найди букву ${letter.upper}!`}
        awaitNext
        stars={progress.stars}
        onCorrect={onCorrect}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onPrev={onStagePrev}
        onStageNext={onStageNext}
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
        stars={progress.stars}
        onCorrect={onCorrect}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onPrev={onStagePrev}
        onStageNext={onStageNext}
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
        stars={progress.stars}
        onCorrect={onCorrect}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onPrev={onStagePrev}
        onStageNext={onStageNext}
        onFinished={finishLetter}
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
    <LearnLetters
      letter={letter}
      stars={progress.stars}
      onSpeak={onSpeak}
      onHome={onBack}
      onNext={() => setStep("findHint")}
      onStageNext={onStageNext}
    />
  );
}
