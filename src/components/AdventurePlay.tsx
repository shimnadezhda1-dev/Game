import { useEffect, useMemo, useRef, useState } from "react";
import { LetterItem, LetterStats, OptionCount, PlayActivity, ProgressState } from "../types";
import type { Point } from "../utils/point";
import { FindLetterGame } from "./FindLetterGame";
import { PictureLetterGame } from "./PictureLetterGame";
import { GameStage } from "./GameStage";
import { GoldStar } from "./GoldStar";
import { LearnLetters } from "./LearnLetters";
import { ToyLetter } from "./ToyLetter";
import { glyphOptionPool, pictureContentBank } from "../utils/selectors";
import { findLetterPrompt } from "../utils/letterCopy";
import { letterVoiceKey } from "../audio/voiceCatalog";
import { audioManager } from "../audio/AudioManager";
import { assetUrl, ASSETS } from "../utils/assets";
import { preloadImages } from "../utils/preload";
import {
  indexForSavedLetterId,
  letterByIndex,
  nextLetterIndex,
  startPlayLetterIndex
} from "../utils/letterProgress";
import { advanceLetterDeck, shuffleLetterDeck } from "../utils/playSettings";

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
  optionCatalog: LetterItem[];
  optionCount: OptionCount;
  stats: Record<string, LetterStats>;
  progress: ProgressState;
  startActivity?: PlayActivity;
  studyOrder?: ProgressState["studyOrder"];
  selectedLetterId?: string;
  onCorrect: (letterId: string, origin?: Point) => void;
  onAfterSuccess?: () => Promise<void>;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string, options?: { key?: string; path?: string; onEnd?: () => void }) => void;
  onBack: () => void;
  onLetterMastered: (letterId: string) => void;
  onAlphabetLetterFinished?: (letterId: string) => boolean;
  onPlayActivityChange?: (value: PlayActivity) => void;
  audioEntryKey?: number;
  onCurrentLetterChange?: (id: string, activity: PlayActivity) => void;
  resumeLetterId?: string | null;
  resumeMode?: "fresh" | "continue";
  learnAdvanceSeconds?: number;
  onLearnAdvanceSecondsChange?: (value: number) => void;
  onRequestRestart?: () => void;
}

function activityToStep(activity: PlayActivity): Step {
  if (activity === "find") {
    return "findHint";
  }
  if (activity === "picture") {
    return "findPicture";
  }
  if (activity === "listen") {
    return "listenChoose";
  }
  return "learn";
}

function stepToActivity(step: Step): PlayActivity {
  if (step === "findHint" || step === "findLetter") {
    return "find";
  }
  if (step === "findPicture") {
    return "picture";
  }
  if (step === "listenChoose") {
    return "listen";
  }
  return "learn";
}

function buildPlayLetters(
  letters: LetterItem[],
  studyOrder: ProgressState["studyOrder"] | undefined,
  avoidId?: string
): LetterItem[] {
  if (studyOrder === "random") {
    return shuffleLetterDeck(letters, avoidId);
  }
  return letters;
}

function initialLetterIndex(
  letters: LetterItem[],
  studyOrder: ProgressState["studyOrder"] | undefined,
  selectedLetterId: string | undefined,
  resumeLetterId?: string | null,
  resumeMode?: "fresh" | "continue"
): number {
  if (resumeMode === "fresh") {
    if (studyOrder === "pick" && selectedLetterId) {
      const pickIndex = letters.findIndex((letter) => letter.id === selectedLetterId);
      if (pickIndex >= 0) {
        return pickIndex;
      }
    }
    return startPlayLetterIndex();
  }
  if (studyOrder === "pick" && selectedLetterId) {
    const index = letters.findIndex((letter) => letter.id === selectedLetterId);
    if (index >= 0) {
      return index;
    }
  }
  if (resumeLetterId) {
    const resumeIndex = letters.findIndex((letter) => letter.id === resumeLetterId);
    if (resumeIndex >= 0) {
      return resumeIndex;
    }
  }
  return startPlayLetterIndex();
}

export function AdventurePlay({
  letters,
  optionCatalog,
  optionCount,
  stats,
  progress,
  startActivity = "learn",
  studyOrder = "alpha",
  selectedLetterId,
  onCorrect,
  onAfterSuccess,
  onMistake,
  onSpeak,
  onBack,
  onLetterMastered,
  onAlphabetLetterFinished,
  onPlayActivityChange,
  audioEntryKey = 0,
  onCurrentLetterChange,
  resumeLetterId = null,
  resumeMode = "continue",
  learnAdvanceSeconds = 3,
  onLearnAdvanceSecondsChange,
  onRequestRestart
}: AdventurePlayProps) {
  const [playLetters, setPlayLetters] = useState(() =>
    buildPlayLetters(letters, studyOrder)
  );
  const [currentLetterIndex, setCurrentLetterIndex] = useState(() =>
    initialLetterIndex(playLetters, studyOrder, selectedLetterId, resumeLetterId, resumeMode)
  );
  const [step, setStep] = useState<Step>(() => activityToStep(startActivity));
  const [nextReady, setNextReady] = useState(false);
  const pictureExampleHistoryRef = useRef(new Map<string, string>());
  const skipDeckSyncRef = useRef(true);
  const poolKey = letters.map((item) => item.id).join(",");
  const poolKeyRef = useRef(poolKey);
  const studyOrderRef = useRef(studyOrder);
  const letter = letterByIndex(playLetters, currentLetterIndex);
  const currentActivity = stepToActivity(step);
  const currentStageIndex = STAGE_FLOW.indexOf(toFlowStep(step) ?? "learn");

  function savedIndexForActivity(activity: PlayActivity): number {
    if (studyOrder === "pick" && selectedLetterId) {
      const pickIndex = playLetters.findIndex((item) => item.id === selectedLetterId);
      if (pickIndex >= 0) {
        return pickIndex;
      }
    }
    return indexForSavedLetterId(playLetters, progress.activityProgress[activity]?.letterId);
  }
  const glyphPool = useMemo(
    () => glyphOptionPool(optionCatalog, optionCount),
    [optionCatalog, optionCount]
  );
  const pictureBank = useMemo(() => pictureContentBank(optionCatalog), [optionCatalog]);

  useEffect(() => {
    onCurrentLetterChange?.(letter.id, currentActivity);
  }, [letter.id, currentActivity, onCurrentLetterChange]);

  useEffect(() => {
    return () => {
      audioManager.stopSpeaking();
    };
  }, []);

  useEffect(() => {
    const nextStep = activityToStep(startActivity);
    setStep(nextStep);
    if (studyOrder !== "pick") {
      setCurrentLetterIndex(indexForSavedLetterId(playLetters, progress.activityProgress[startActivity]?.letterId));
    }
  }, [startActivity]);

  useEffect(() => {
    if (skipDeckSyncRef.current) {
      skipDeckSyncRef.current = false;
      poolKeyRef.current = poolKey;
      studyOrderRef.current = studyOrder;
      return;
    }
    const poolChanged = poolKeyRef.current !== poolKey;
    const orderChanged = studyOrderRef.current !== studyOrder;
    poolKeyRef.current = poolKey;
    studyOrderRef.current = studyOrder;
    if (poolChanged || orderChanged) {
      const nextDeck = buildPlayLetters(letters, studyOrder, letter.id);
      setPlayLetters(nextDeck);
      let nextIndex = 0;
      if (studyOrder === "pick") {
        const pickIndex = selectedLetterId
          ? nextDeck.findIndex((item) => item.id === selectedLetterId)
          : -1;
        nextIndex = pickIndex >= 0 ? pickIndex : 0;
      } else if (orderChanged && (studyOrder === "alpha" || studyOrder === "random")) {
        nextIndex = 0;
      } else {
        const keepId = letter.id;
        const found = nextDeck.findIndex((item) => item.id === keepId);
        nextIndex = found >= 0 ? found : 0;
      }
      setCurrentLetterIndex(nextIndex);
      return;
    }
    if (studyOrder !== "pick" || !selectedLetterId) {
      return;
    }
    setCurrentLetterIndex((index) => {
      const nextIndex = playLetters.findIndex((item) => item.id === selectedLetterId);
      return nextIndex >= 0 ? nextIndex : index;
    });
  }, [letters, poolKey, selectedLetterId, studyOrder, resumeLetterId]);

  useEffect(() => {
    const paths = [
      letter.letterImage,
      letter.objectImage,
      letter.findObjectImage,
      letter.pictureImage,
      letter.choiceImage
    ].filter((path): path is string => Boolean(path));
    const nextStagePreview =
      step === "learn"
        ? ASSETS.find.meadow
        : step === "findHint" || step === "findLetter"
          ? ASSETS.picture.meadow
          : step === "findPicture"
            ? ASSETS.listen.meadow
            : null;
    if (nextStagePreview) {
      paths.push(nextStagePreview);
    }
    preloadImages(paths.map((path) => assetUrl(path)));
  }, [letter.id, step]);

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
    audioManager.stopSpeaking();
    onLetterMastered(letter.id);
    if (studyOrder === "random") {
      const advanced = advanceLetterDeck(playLetters, currentLetterIndex, letters);
      if (!advanced) {
        setStep("complete");
        return;
      }
      setPlayLetters(advanced.deck);
      setCurrentLetterIndex(advanced.index);
      onCurrentLetterChange?.(advanced.deck[advanced.index]?.id, "learn");
      onPlayActivityChange?.("learn");
      setStep("learn");
      setNextReady(false);
      return;
    }
    const next = nextLetterIndex(currentLetterIndex, playLetters.length);
    if (next === null) {
      setStep("complete");
      return;
    }
    setCurrentLetterIndex(next);
    onCurrentLetterChange?.(playLetters[next]?.id, "learn");
    onPlayActivityChange?.("learn");
    setStep("learn");
    setNextReady(false);
  }

  function switchToFlow(next: FlowStep) {
    const nextActivity = stepToActivity(next);
    onCurrentLetterChange?.(letter.id, currentActivity);
    if (nextActivity !== currentActivity && studyOrder !== "pick") {
      setCurrentLetterIndex(savedIndexForActivity(nextActivity));
    }
    onPlayActivityChange?.(nextActivity);
    setStep(next);
  }

  function goStagePrev() {
    audioManager.stopSpeaking();
    const flow = toFlowStep(step);
    if (!flow) {
      return;
    }
    const index = STAGE_FLOW.indexOf(flow);
    if (index <= 0) {
      return;
    }
    switchToFlow(STAGE_FLOW[index - 1]);
  }

  function goLearnSameLetter() {
    audioManager.stopSpeaking();
    switchToFlow("learn");
  }

  function goStageNext() {
    audioManager.stopSpeaking();
    const flow = toFlowStep(step);
    if (!flow) {
      return;
    }
    const index = STAGE_FLOW.indexOf(flow);
    if (index < 0 || index >= STAGE_FLOW.length - 1) {
      return;
    }
    switchToFlow(STAGE_FLOW[index + 1]);
  }

  const showStagePrev = currentStageIndex > 0 && step !== "complete";
  const showStageNext = currentStageIndex >= 0 && currentStageIndex < STAGE_FLOW.length - 1;
  const standaloneLearn = startActivity === "learn";
  const autoNextPracticeLetter = studyOrder !== "pick";
  const autoAdvanceLearn =
    standaloneLearn && studyOrder !== "pick" && step === "learn";
  const onStagePrev = showStagePrev ? goStagePrev : undefined;
  const onStageNext =
    standaloneLearn && step === "learn" ? undefined : showStageNext ? goStageNext : undefined;

  function goToNextLetterInCurrentActivity(wrapAtEnd = true): boolean {
    audioManager.stopSpeaking();
    if (studyOrder === "pick") {
      return false;
    }
    if (studyOrder === "alpha" && step === "learn" && onAlphabetLetterFinished?.(letter.id)) {
      return false;
    }
    if (studyOrder === "random") {
      const advanced = advanceLetterDeck(playLetters, currentLetterIndex, letters);
      if (!advanced) {
        return false;
      }
      setPlayLetters(advanced.deck);
      setCurrentLetterIndex(advanced.index);
      return true;
    }
    const next = nextLetterIndex(currentLetterIndex, playLetters.length);
    if (next === null) {
      if (wrapAtEnd && playLetters.length > 0) {
        setCurrentLetterIndex(0);
        return true;
      }
      return false;
    }
    setCurrentLetterIndex(next);
    return true;
  }

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
        letters={playLetters}
        stats={stats}
        lockTarget={letter}
        optionCount={optionCount}
        optionPool={glyphPool}
        optionCatalog={optionCatalog}
        hint="image"
        prompt={findLetterPrompt(letter)}
        awaitNext={!autoNextPracticeLetter}
        stars={progress.stars}
        onCorrect={onCorrect}
        onAfterSuccess={onAfterSuccess}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onPrev={onStagePrev}
        onStageNext={onStageNext}
        onRequestRestart={onRequestRestart}
        onFinished={
          autoNextPracticeLetter
            ? () => goToNextLetterInCurrentActivity(false)
            : undefined
        }
      />
    );
  }

  if (step === "findLetter") {
    return (
      <FindLetterGame
        letters={playLetters}
        stats={stats}
        lockTarget={letter}
        optionCount={optionCount}
        optionPool={glyphPool}
        optionCatalog={optionCatalog}
        hint="image"
        prompt={findLetterPrompt(letter)}
        awaitNext={!autoNextPracticeLetter}
        stars={progress.stars}
        onCorrect={onCorrect}
        onAfterSuccess={onAfterSuccess}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onPrev={onStagePrev}
        onStageNext={onStageNext}
        onRequestRestart={onRequestRestart}
        onFinished={
          autoNextPracticeLetter
            ? () => goToNextLetterInCurrentActivity(false)
            : undefined
        }
      />
    );
  }

  if (step === "findPicture") {
    return (
      <PictureLetterGame
        key={`picture-${letter.id}`}
        letters={playLetters}
        stats={stats}
        lockTarget={letter}
        optionCount={optionCount}
        pictureBank={pictureBank}
        pictureExampleHistory={pictureExampleHistoryRef.current}
        awaitNext={!autoNextPracticeLetter}
        stars={progress.stars}
        onCorrect={onCorrect}
        onAfterSuccess={onAfterSuccess}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onPrev={onStagePrev}
        onStageNext={onStageNext}
        onRequestRestart={onRequestRestart}
        onFinished={
          autoNextPracticeLetter
            ? () => goToNextLetterInCurrentActivity(false)
            : undefined
        }
      />
    );
  }

  if (step === "listenChoose") {
    return (
      <PictureLetterGame
        key={`listen-${letter.id}`}
        letters={playLetters}
        stats={stats}
        lockTarget={letter}
        optionCount={optionCount}
        pictureBank={pictureBank}
        pictureExampleHistory={pictureExampleHistoryRef.current}
        awaitNext={!autoNextPracticeLetter}
        stars={progress.stars}
        voiceMode="listen"
        onCorrect={onCorrect}
        onAfterSuccess={onAfterSuccess}
        onMistake={onMistake}
        onSpeak={onSpeak}
        onBack={onBack}
        onPrev={onStagePrev}
        onStageNext={goLearnSameLetter}
        onRequestRestart={onRequestRestart}
        onFinished={
          autoNextPracticeLetter ? () => goToNextLetterInCurrentActivity(false) : undefined
        }
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
      audioEntryKey={audioEntryKey}
      onSpeak={onSpeak}
      onHome={onBack}
      onNext={standaloneLearn ? () => goToNextLetterInCurrentActivity(true) : () => setStep("findHint")}
      autoAdvance={autoAdvanceLearn}
      advanceDelaySec={learnAdvanceSeconds}
      onAdvanceSecondsChange={
        autoAdvanceLearn ? onLearnAdvanceSecondsChange : undefined
      }
      onGoNextActivity={goStageNext}
      allowLetterSkip={standaloneLearn && studyOrder !== "pick"}
    />
  );
}
