import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LetterItem, LetterStats, RoundPhase } from "../types";
import { audioManager } from "../audio/AudioManager";
import { pointFromEvent, type Point } from "./point";
import { randomOptions, weightedLetterPick } from "./selectors";

interface SpeakFollowUp {
  text: string;
  key?: string;
}

interface UseRoundArgs {
  letters: LetterItem[];
  stats: Record<string, LetterStats>;
  optionCount?: number;
  optionIds?: string[];
  lockTarget?: LetterItem;
  speakPrompt: (letter: LetterItem) => string;
  speakKey?: (letter: LetterItem) => string;
  speakFollowUp?: (letter: LetterItem) => SpeakFollowUp | null;
  praise: (letter: LetterItem) => string;
  praiseKey?: (letter: LetterItem) => string;
  awaitNext?: boolean;
  onCorrect: (letterId: string, origin?: Point) => void;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string, options?: { key?: string; onEnd?: () => void }) => void;
  onFinished?: () => void;
}

const FEEDBACK_MS = 900;

export function useRound({
  letters,
  stats,
  optionCount = 3,
  optionIds,
  lockTarget,
  speakPrompt,
  speakKey,
  speakFollowUp,
  praise,
  praiseKey,
  awaitNext = false,
  onCorrect,
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
  const lockedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const statsRef = useRef(stats);
  const lettersRef = useRef(letters);
  const onSpeakRef = useRef(onSpeak);
  const speakPromptRef = useRef(speakPrompt);
  const speakKeyRef = useRef(speakKey);
  const speakFollowUpRef = useRef(speakFollowUp);
  const praiseRef = useRef(praise);
  const praiseKeyRef = useRef(praiseKey);
  const awaitNextRef = useRef(awaitNext);
  const onFinishedRef = useRef(onFinished);
  const phaseRef = useRef(phase);

  statsRef.current = stats;
  lettersRef.current = letters;
  onSpeakRef.current = onSpeak;
  speakPromptRef.current = speakPrompt;
  speakKeyRef.current = speakKey;
  speakFollowUpRef.current = speakFollowUp;
  praiseRef.current = praise;
  praiseKeyRef.current = praiseKey;
  awaitNextRef.current = awaitNext;
  onFinishedRef.current = onFinished;
  phaseRef.current = phase;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (lockTarget && lockTarget.id !== target.id) {
      lockedRef.current = false;
      clearTimer();
      setTarget(lockTarget);
      setPhase("question");
      setSelected(null);
      setWrongCount(0);
    }
  }, [lockTarget, target.id, clearTimer]);

  const options = useMemo(
    () =>
      optionIds?.length
        ? optionIds
        : randomOptions(
            target.id,
            lettersRef.current.map((letter) => letter.id),
            optionCount
          ),
    [target.id, optionCount, optionIds]
  );

  const speakQuestion = useCallback(
    (letter: LetterItem) => {
      const follow = speakFollowUpRef.current?.(letter) ?? null;
      onSpeakRef.current(speakPromptRef.current(letter), {
        key: speakKeyRef.current?.(letter),
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
    speakQuestion(target);
  }, [target, phase, speakQuestion]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const replay = useCallback(() => {
    if (lockedRef.current) {
      return;
    }
    speakQuestion(target);
  }, [target, speakQuestion]);

  const finishRound = useCallback(() => {
    lockedRef.current = false;
    setSelected(null);
    setWrongCount(0);
    if (onFinishedRef.current) {
      setPhase("question");
      onFinishedRef.current();
      return;
    }
    setPhase("question");
    setTarget((current) =>
      weightedLetterPick(lettersRef.current, statsRef.current, current.id)
    );
  }, []);

  function choose(id: string, event: { currentTarget: EventTarget }) {
    if (lockedRef.current || phase === "feedback") {
      return;
    }
    if (id === target.id) {
      lockedRef.current = true;
      setSelected(id);
      setPhase("feedback");
      onSpeakRef.current(praiseRef.current(target), {
        key: praiseKeyRef.current?.(target)
      });
      onCorrect(target.id, pointFromEvent(event));
      if (!awaitNextRef.current) {
        clearTimer();
        timerRef.current = window.setTimeout(finishRound, FEEDBACK_MS);
      }
      return;
    }
    setSelected(id);
    setShakeNonce((value) => value + 1);
    setWrongCount((value) => value + 1);
    audioManager.playTryAgain();
    onMistake(target.id);
    onSpeakRef.current("Попробуй ещё!", { key: "try-again" });
  }

  return {
    target,
    options,
    phase,
    selected,
    wrongCount,
    shakeNonce,
    replay,
    continueRound: finishRound,
    choose
  };
}
