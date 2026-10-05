import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LetterItem, LetterStats, OptionCount, RoundPhase } from "../types";
import { audioManager } from "../audio/AudioManager";
import { flowLog, isPlayFlowCurrent, playFlowGeneration } from "../audio/playFlow";
import { pointFromEvent, type Point } from "./point";
import { buildRoundOptions, weightedLetterPick } from "./selectors";

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
  praiseRef.current = praise;
  praiseKeyRef.current = praiseKey;
  tryAgainTextRef.current = tryAgainText;
  playWrongSoundRef.current = playWrongSound;
  autoSpeakRef.current = autoSpeak;
  awaitNextRef.current = awaitNext;
  onFinishedRef.current = onFinished;
  onAfterSuccessRef.current = onAfterSuccess;
  phaseRef.current = phase;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (lockTarget && lockTarget.id !== target.id) {
      if (lockedRef.current) {
        return;
      }
      lockedRef.current = false;
      settledRef.current = false;
      clearTimer();
      setTarget(lockTarget);
      setPhase("question");
      setSelected(null);
      setWrongCount(0);
      setActiveOptionCount(requestedOptionCountRef.current);
    }
  }, [lockTarget, target.id, clearTimer]);

  const optionResult = useMemo((): CustomRoundOptionsResult => {
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
  }, [target.id, activeOptionCount]);
  const options = optionResult.ok ? optionResult.options : [];
  const correctOptionId = optionResult.ok
    ? optionResult.correctOptionId
    : target.id;
  const correctOptionIdRef = useRef(correctOptionId);
  correctOptionIdRef.current = correctOptionId;

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

  useEffect(() => () => clearTimer(), [clearTimer]);

  const replay = useCallback(() => {
    if (lockedRef.current) {
      return;
    }
    speakQuestion(target);
  }, [target, speakQuestion]);

  const finishRound = useCallback(() => {
    if (onFinishedRef.current) {
      const advanced = onFinishedRef.current();
      if (advanced === false) {
        return;
      }
    }
    lockedRef.current = false;
    settledRef.current = false;
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
  }, []);

  function choose(id: string, event: { currentTarget: EventTarget }) {
    if (lockedRef.current || phase === "feedback") {
      return;
    }
    if (id === correctOptionId) {
      const startedAt = playFlowGeneration();
      lockedRef.current = true;
      settledRef.current = false;
      flowLog("INPUT LOCK");
      setSelected(id);
      setPhase("feedback");
      onCorrect(target.id, pointFromEvent(event));
      audioManager.speak(praiseRef.current(target, correctOptionId), {
        key: praiseKeyRef.current?.(target),
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
    if (nextWrong === 1) {
      onSpeakRef.current(tryAgainTextRef.current, { key: "try-again" });
    } else if (nextWrong === CORRECT_HINT_AFTER_MISTAKES) {
      onSpeakRef.current("Давай, немного помогу.", { key: "hint" });
    } else {
      onSpeakRef.current("Почти получилось!", { key: "almost" });
    }
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
