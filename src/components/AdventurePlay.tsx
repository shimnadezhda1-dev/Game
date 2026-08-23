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
import { randomOptions, shuffle } from "../utils/selectors";
import { findLetterPrompt } from "../utils/letterCopy";
import { letterVoiceKey } from "../audio/voiceCatalog";
import { contentReadyLetters } from "../data/letters";
import {
  letterByIndex,
  nextLetterIndex,
  optionPoolIds,
  startPlayLetterIndex
} from "../utils/letterProgress";

type Step = "learn" | "findHint" | "findLetter" | "findPicture" | "listenChoose" | "reward" | "complete";

/** Letter-study stages: 1 learn, 2 find letter, 3 find picture, 4 listen (last). */
const STAGE_FLOW = ["learn", "findHint", "findPicture", "listenChoose"] as const;
type FlowStep = (typeof STAGE_FLOW)[number];

function toFlowStep(step: Step): FlowStep | null {
  if (step === "findLetter") {
    return "findHint";
  }
  if (step === "reward") {
    return "listenChoose";
  }
  if (step === "complete") {
    return null;
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

function lessonOptions(targetId: string, allIds: string[]): string[] {
  return randomOptions(targetId, allIds, 3);
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
  const assetReadyIds = contentReadyLetters(letters).map((item) => item.id);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(() => startPlayLetterIndex(progress));
  const [step, setStep] = useState<Step>("learn");
  const [nextReady, setNextReady] = useState(false);
  const letter = letterByIndex(letters, currentLetterIndex);
  const currentStageIndex = STAGE_FLOW.indexOf(toFlowStep(step) ?? "learn");
  const optionPool = optionPoolIds(letter.id, assetReadyIds);
  const optionIds = useMemo(
    () => lessonOptions(letter.id, optionPool),
    [letter.id, optionPool.join(",")]
  );
  const listenIds = useMemo(
    () => listenOptions(letter.id, optionPool),
    [letter.id, optionPool.join(",")]
  );
  const hasNextLesson = nextLetterIndex(currentLetterIndex, letters.length) !== null;

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
    const next = nextLetterIndex(currentLetterIndex, letters.length);
    if (next === null) {
      setStep("complete");
      return;
    }
    setCurrentLetterIndex(next);
    setStep("learn");
    setNextReady(false);
  }

  function goStagePrev() {
    setStep((current) => {
      const index = STAGE_FLOW.indexOf(toFlowStep(current) ?? "learn");
      if (index <= 0) {
        return current;
      }
      return STAGE_FLOW[index - 1];
    });
  }

  function goStageNext() {
    setStep((current) => {
      const flow = toFlowStep(current);
      if (!flow) {
        return current;
      }
      const index = STAGE_FLOW.indexOf(flow);
      if (index < 0 || index >= STAGE_FLOW.length - 1) {
        return current;
      }
      return STAGE_FLOW[index + 1];
    });
  }

  const showStagePrev = currentStageIndex > 0 && step !== "complete";
  const showStageNext = currentStageIndex >= 0 && currentStageIndex < STAGE_FLOW.length - 1;
  const onStagePrev = showStagePrev ? goStagePrev : undefined;
  const onStageNext = showStageNext ? goStageNext : undefined;

  if (step === "complete") {
    return (
      <GameStage foxMood="celebrate" bubble="Ура! Ты выучил все буквы!">
        <div className="reward-scene">
          <GoldStar size="hero" />
        </div>
      </GameStage>
    );
  }

  if (step === "findHint") {
    return (
      <FindLetterGame
        letters={letters}
        stats={stats}
        lockTarget={letter}
        optionIds={optionIds}
        hint="image"
        prompt={findLetterPrompt(letter)}
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
        prompt={findLetterPrompt(letter)}
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
        onCorrect={(id, origin) => {
          onCorrect(id, origin);
          if (!hasNextLesson) {
            onLetterMastered(letter.id);
          }
        }}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onPrev={onStagePrev}
        onStageNext={onStageNext}
        onFinished={finishLetter}
        showInternalNext={hasNextLesson}
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
