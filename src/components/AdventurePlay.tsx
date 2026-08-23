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
import { isLetterMastered, randomOptions, shuffle } from "../utils/selectors";
import { findLetterPrompt } from "../utils/letterCopy";
import { letterVoiceKey } from "../audio/voiceCatalog";
import { contentReadyLetters, isContentReady, nextContentReadyLetter } from "../data/letters";

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

function pickLetter(letters: LetterItem[], progress: ProgressState): LetterItem | null {
  const playable = contentReadyLetters(letters);
  if (!playable.length) {
    return null;
  }
  const unmastered = playable.find((item) => !isLetterMastered(progress, item.id));
  if (unmastered) {
    return unmastered;
  }
  return playable[playable.length - 1];
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
  const startLetter = pickLetter(letters, progress);
  const playable = contentReadyLetters(letters);
  const [letter, setLetter] = useState<LetterItem>(() => startLetter ?? playable[0] ?? letters[0]);
  const [step, setStep] = useState<Step>("learn");
  const [nextReady, setNextReady] = useState(false);
  const playableIds = playable.map((item) => item.id);
  const optionIds = useMemo(() => lessonOptions(letter.id, playableIds), [letter.id, playableIds.join(",")]);
  const listenIds = useMemo(() => listenOptions(letter.id, playableIds), [letter.id, playableIds.join(",")]);
  const hasNextLesson = Boolean(nextContentReadyLetter(letters, letter.id));

  useEffect(() => {
    if (isContentReady(letter)) {
      return;
    }
    if (import.meta.env.DEV) {
      console.warn(`[alphabet] Skipped incomplete letter ${letter.upper}`);
    }
    const fallback = pickLetter(letters, progress);
    if (fallback) {
      setLetter(fallback);
      setStep("learn");
    }
  }, [letter, letters, progress]);

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
    const next = nextContentReadyLetter(letters, letter.id);
    if (!next) {
      if (import.meta.env.DEV) {
        const following = letters.find((item) => item.id === letter.id);
        console.warn(
          `[alphabet] Stopped after ${letter.upper}: next letter is not content-ready.`,
          following
        );
      }
      return;
    }
    setLetter(next);
    setStep("learn");
    setNextReady(false);
  }

  function goStagePrev() {
    setStep((current) => {
      const flow = toFlowStep(current);
      if (!flow) {
        return current;
      }
      const index = STAGE_FLOW.indexOf(flow);
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

  const flowStep = toFlowStep(step);
  const flowIndex = flowStep ? STAGE_FLOW.indexOf(flowStep) : -1;
  const showStagePrev = flowIndex > 0;
  const showStageNext = flowIndex >= 0 && flowIndex < STAGE_FLOW.length - 1;
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
        letters={playable}
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
        letters={playable}
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
        letters={playable}
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
        letters={playable}
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
