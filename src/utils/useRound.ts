import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LetterItem, LetterStats, OptionCount, RoundPhase } from "../types";
import { audioManager, RESUME_AFTER_BACKGROUND_DELAY_MS } from "../audio/AudioManager";
import {
  noteNewQuestion,
  noteWrongAnswer,
  takePraiseLine,
  takeRetryLine
} from "../audio/phraseBag";
import { flowLog, isPlayFlowCurrent, playFlowGeneration } from "../audio/playFlow";
import { isAppInBackground, subscribeAppLifecycle } from "./appLifecycle";
import { pointFromEvent, type Point } from "./point";
import {
  avoidRepeatedCorrectPosition,
  buildRoundOptions,
  weightedLetterPick
} from "./selectors";

interface SpeakFollowUp {
  text: string;
  key?: string;
}

interface CustomRoundOptionsSuccess {
  ok: true;
  options: string[];
  correctOptionId: string;
}

interface CustomRoundOptionsFailure {
  ok: false;
  requested: number;
  available: number;
}

type CustomRoundOptionsResult =
  | CustomRoundOptionsSuccess
  | CustomRoundOptionsFailure;

interface UseRoundArgs {
  letters: LetterItem[];
  stats: Record<string, LetterStats>;
  optionCount?: OptionCount;
  optionPool?: LetterItem[];
  optionBuilder?: (
    target: LetterItem,
    optionCount: OptionCount
  ) => CustomRoundOptionsResult;
  lockTarget?: LetterItem;
  speakPrompt: (letter: LetterItem) => string;
  speakKey?: (letter: LetterItem, correctOptionId: string) => string | undefined;
  speakPath?: (letter: LetterItem, correctOptionId: string) => string | undefined;
  speakFollowUp?: (letter: LetterItem) => SpeakFollowUp | null;
  /** Voices the current question from the start; defaults to speakPrompt/speakKey/speakPath. */
  playQuestion?: () => void;
  /** Cancels an in-flight multi-part question (pauses between clips). */
  stopQuestion?: () => void;
  /** Activities sharing a key share the "no same correct slot twice in a row" memory. */
  positionKey?: string;
  praise: (letter: LetterItem, correctOptionId: string) => string;
  praiseKey?: (letter: LetterItem) => string;
  tryAgainText?: string;
  playWrongSound?: boolean;
  autoSpeak?: boolean;
  awaitNext?: boolean;
  onCorrect: (letterId: string, origin?: Point) => void;
  onAfterSuccess?: () => Promise<void>;
  onMistake: (letterId: string) => void;
  onSpeak: (
    text: string,
    options?: { key?: string; path?: string; onEnd?: () => void }
  ) => void;
  onFinished?: () => boolean | void;
}

export const CORRECT_HINT_AFTER_MISTAKES = 2;
export const RETRY_QUESTION_PAUSE_MS = 450;

/** Outlives remounts: picture/listen games remount for every adventure letter. */
const lastCorrectPosition = new Map<string, number>();

export function showCorrectHint(wrongCount: number, phase: RoundPhase): boolean {
  return phase === "question" && wrongCount >= CORRECT_HINT_AFTER_MISTAKES;
}

export function useRound({
  letters,
  stats,
  optionCount = 3,
  optionPool,
  optionBuilder,
  lockTarget,
  speakPrompt,
  speakKey,
  speakPath,
  speakFollowUp,
  playQuestion,
  stopQuestion,
  positionKey = "round",
  praise,
  praiseKey,
  tryAgainText = "Попробуй ещё!",
  playWrongSound = true,
  autoSpeak = true,
  awaitNext = false,
  onCorrect,
  onAfterSuccess,
  onMistake,
  onSpeak,
  onFinished
}: UseRoundArgs) {
  const [target, setTarget] = useState<LetterItem>(
    () => lockTarget ?? weightedLetterPick(letters, stats)
  );
  const [phase, setPhase] = useState<RoundPhase>("question");
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [shakeNonce, setShakeNonce] = useState(0);
  const [activeOptionCount, setActiveOptionCount] = useState<OptionCount>(optionCount);
  const lockedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const statsRef = useRef(stats);
  const lettersRef = useRef(letters);
  const optionPoolRef = useRef(optionPool ?? letters);
  const optionBuilderRef = useRef(optionBuilder);
  const requestedOptionCountRef = useRef(optionCount);
  const onSpeakRef = useRef(onSpeak);
  const speakPromptRef = useRef(speakPrompt);
  const speakKeyRef = useRef(speakKey);
  const speakPathRef = useRef(speakPath);
  const speakFollowUpRef = useRef(speakFollowUp);
  const playQuestionRef = useRef(playQuestion);
  const stopQuestionRef = useRef(stopQuestion);
  const praiseRef = useRef(praise);
  const praiseKeyRef = useRef(praiseKey);
  const tryAgainTextRef = useRef(tryAgainText);
  const playWrongSoundRef = useRef(playWrongSound);
  const autoSpeakRef = useRef(autoSpeak);
  const awaitNextRef = useRef(awaitNext);
  const onFinishedRef = useRef(onFinished);
  const onAfterSuccessRef = useRef(onAfterSuccess);
  const phaseRef = useRef(phase);
  const settledRef = useRef(false);
  const targetRef = useRef(target);
  const retryTokenRef = useRef(0);
  const retryActiveRef = useRef(false);
  const retryTimerRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const optionsReadyRef = useRef(true);

  statsRef.current = stats;
  lettersRef.current = letters;
  optionPoolRef.current = optionPool ?? letters;
  optionBuilderRef.current = optionBuilder;
  requestedOptionCountRef.current = optionCount;
  onSpeakRef.current = onSpeak;
  speakPromptRef.current = speakPrompt;
  speakKeyRef.current = speakKey;
  speakPathRef.current = speakPath;
  speakFollowUpRef.current = speakFollowUp;
  playQuestionRef.current = playQuestion;
  stopQuestionRef.current = stopQuestion;
  praiseRef.current = praise;
  praiseKeyRef.current = praiseKey;
  tryAgainTextRef.current = tryAgainText;
  playWrongSoundRef.current = playWrongSound;
  autoSpeakRef.current = autoSpeak;
  awaitNextRef.current = awaitNext;
  onFinishedRef.current = onFinished;
  onAfterSuccessRef.current = onAfterSuccess;
  phaseRef.current = phase;
  targetRef.current = target;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancelRetrySequence = useCallback(() => {
    retryTokenRef.current += 1;
    retryActiveRef.current = false;
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const cancelResumeReplay = useCallback(() => {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  /** Support line or its follow-up question is still running. */
  const retrySequenceBusy = useCallback(
    () =>
      retryTimerRef.current !== null ||
      (retryActiveRef.current && audioManager.isVoiceBusy()),
    []
  );

  useEffect(() => {
    if (lockTarget && lockTarget.id !== target.id) {
      if (lockedRef.current) {
        return;
      }
      lockedRef.current = false;
      settledRef.current = false;
      noteNewQuestion();
      clearTimer();
      cancelRetrySequence();
      cancelResumeReplay();
      setTarget(lockTarget);
      setPhase("question");
      setSelected(null);
      setWrongCount(0);
      setActiveOptionCount(requestedOptionCountRef.current);
    }
  }, [lockTarget, target.id, clearTimer, cancelRetrySequence, cancelResumeReplay]);

  const positionSlot = `${positionKey}:${activeOptionCount}`;
  const optionResult = useMemo((): CustomRoundOptionsResult => {
    const built = (): CustomRoundOptionsResult => {
      const customResult = optionBuilderRef.current?.(target, activeOptionCount);
      if (customResult) {
        return customResult;
      }
      const defaultResult = buildRoundOptions(
        target.id,
        optionPoolRef.current.map((letter) => letter.id),
        activeOptionCount
      );
      return defaultResult.ok
        ? { ...defaultResult, correctOptionId: target.id }
        : defaultResult;
    };
    const result = built();
    if (!result.ok) {
      return result;
    }
    return {
      ...result,
      options: avoidRepeatedCorrectPosition(
        result.options,
        result.correctOptionId,
        lastCorrectPosition.get(positionSlot)
      )
    };
  }, [target.id, activeOptionCount, positionSlot]);

  useEffect(() => {
    if (!optionResult.ok) {
      return;
    }
    lastCorrectPosition.set(
      positionSlot,
      optionResult.options.indexOf(optionResult.correctOptionId)
    );
  }, [optionResult, positionSlot]);

  const options = optionResult.ok ? optionResult.options : [];
  const correctOptionId = optionResult.ok
    ? optionResult.correctOptionId
    : target.id;
  const correctOptionIdRef = useRef(correctOptionId);
  correctOptionIdRef.current = correctOptionId;
  optionsReadyRef.current = optionResult.ok;

  const speakQuestion = useCallback(
    (letter: LetterItem) => {
      const follow = speakFollowUpRef.current?.(letter) ?? null;
      const optionId = correctOptionIdRef.current;
      onSpeakRef.current(speakPromptRef.current(letter), {
        key: speakKeyRef.current?.(letter, optionId),
        path: speakPathRef.current?.(letter, optionId),
        onEnd: follow
          ? () => {
              if (phaseRef.current !== "question") {
                return;
              }
              onSpeakRef.current(follow.text, { key: follow.key });
            }
          : undefined
      });
    },
    []
  );

  useEffect(() => {
    if (phase !== "question") {
      return;
    }
    if (!autoSpeakRef.current) {
      return;
    }
    speakQuestion(target);
  }, [target, phase, speakQuestion, correctOptionId]);

  const playCurrentQuestion = useCallback(() => {
    if (playQuestionRef.current) {
      playQuestionRef.current();
      return;
    }
    speakQuestion(targetRef.current);
  }, [speakQuestion]);

  const questionStillOpen = useCallback(
    () =>
      !lockedRef.current &&
      phaseRef.current === "question" &&
      optionsReadyRef.current &&
      !isAppInBackground(),
    []
  );

  useEffect(
    () => () => {
      clearTimer();
      cancelRetrySequence();
      cancelResumeReplay();
    },
    [clearTimer, cancelRetrySequence, cancelResumeReplay]
  );

  useEffect(
    () =>
      subscribeAppLifecycle((state) => {
        cancelRetrySequence();
        cancelResumeReplay();
        if (state === "background") {
          stopQuestionRef.current?.();
          return;
        }
        if (lockedRef.current || phaseRef.current !== "question") {
          return;
        }
        audioManager.discardBackgroundDebt();
        resumeTimerRef.current = window.setTimeout(() => {
          resumeTimerRef.current = null;
          if (!questionStillOpen()) {
            return;
          }
          flowLog("QUESTION REPLAY (resume)");
          playCurrentQuestion();
        }, RESUME_AFTER_BACKGROUND_DELAY_MS);
      }),
    [cancelRetrySequence, cancelResumeReplay, playCurrentQuestion, questionStillOpen]
  );

  const replay = useCallback(() => {
    if (lockedRef.current) {
      return;
    }
    cancelRetrySequence();
    cancelResumeReplay();
    playCurrentQuestion();
  }, [cancelRetrySequence, cancelResumeReplay, playCurrentQuestion]);

  const startRetrySequence = useCallback(() => {
    cancelRetrySequence();
    cancelResumeReplay();
    stopQuestionRef.current?.();
    const token = retryTokenRef.current;
    retryActiveRef.current = true;
    const retryLine = takeRetryLine();
    onSpeakRef.current(retryLine.text, {
      path: retryLine.path,
      onEnd: () => {
        if (token !== retryTokenRef.current || !questionStillOpen()) {
          return;
        }
        retryTimerRef.current = window.setTimeout(() => {
          retryTimerRef.current = null;
          if (token !== retryTokenRef.current || !questionStillOpen()) {
            return;
          }
          flowLog("QUESTION REPLAY (after retry)");
          playCurrentQuestion();
        }, RETRY_QUESTION_PAUSE_MS);
      }
    });
  }, [cancelRetrySequence, cancelResumeReplay, playCurrentQuestion, questionStillOpen]);

  const finishRound = useCallback(() => {
    if (onFinishedRef.current) {
      const advanced = onFinishedRef.current();
      if (advanced === false) {
        return;
      }
    }
    lockedRef.current = false;
    settledRef.current = false;
    cancelRetrySequence();
    cancelResumeReplay();
    noteNewQuestion();
    flowLog("INPUT UNLOCK");
    setSelected(null);
    setWrongCount(0);
    setActiveOptionCount(requestedOptionCountRef.current);
    setPhase("question");
    if (!onFinishedRef.current) {
      setTarget((current) =>
        weightedLetterPick(lettersRef.current, statsRef.current, current.id)
      );
    }
  }, [cancelRetrySequence, cancelResumeReplay]);

  function choose(id: string, event: { currentTarget: EventTarget }) {
    if (lockedRef.current || phase === "feedback") {
      return;
    }
    if (id === correctOptionId) {
      const startedAt = playFlowGeneration();
      lockedRef.current = true;
      settledRef.current = false;
      cancelRetrySequence();
      cancelResumeReplay();
      stopQuestionRef.current?.();
      flowLog("INPUT LOCK");
      setSelected(id);
      setPhase("feedback");
      onCorrect(target.id, pointFromEvent(event));
      const praiseLine = takePraiseLine(wrongCount > 0);
      audioManager.speak(praiseLine.text, {
        path: praiseLine.path,
        onEnd: () => {
          void (async () => {
            if (!isPlayFlowCurrent(startedAt)) {
              return;
            }
            if (!lockedRef.current || phaseRef.current !== "feedback") {
              return;
            }
            try {
              await onAfterSuccessRef.current?.();
            } catch {
              // Reward/audio failure must not freeze the round.
            }
            if (!isPlayFlowCurrent(startedAt)) {
              return;
            }
            if (!lockedRef.current || phaseRef.current !== "feedback") {
              return;
            }
            settledRef.current = true;
            if (!awaitNextRef.current) {
              finishRound();
            }
          })();
        }
      });
      return;
    }
    setSelected(id);
    setShakeNonce((value) => value + 1);
    const nextWrong = wrongCount + 1;
    setWrongCount(nextWrong);
    if (playWrongSoundRef.current) {
      audioManager.playTryAgain();
    }
    onMistake(target.id);
    noteWrongAnswer();
    if (retrySequenceBusy()) {
      flowLog("RETRY SKIP (support/question still playing)");
      return;
    }
    startRetrySequence();
  }

  const continueRound = useCallback(() => {
    if (!settledRef.current && awaitNextRef.current) {
      return;
    }
    finishRound();
  }, [finishRound]);

  return {
    target,
    options,
    correctOptionId,
    optionError: optionResult.ok ? null : optionResult,
    phase,
    selected,
    wrongCount,
    shakeNonce,
    replay,
    continueRound,
    choose
  };
}
