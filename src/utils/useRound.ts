import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LetterItem, LetterStats, RoundPhase } from "../types";
import { audioManager } from "../audio/AudioManager";
import { pointFromEvent, type Point } from "./point";
import { randomOptions, weightedLetterPick } from "./selectors";

interface UseRoundArgs {
  letters: LetterItem[];
  stats: Record<string, LetterStats>;
  optionCount?: number;
  lockTarget?: LetterItem;
  speakPrompt: (letter: LetterItem) => string;
  praise: (letter: LetterItem) => string;
  onCorrect: (letterId: string, origin?: Point) => void;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string) => void;
  onFinished?: () => void;
}

const FEEDBACK_MS = 900;

export function useRound({
  letters,
  stats,
  optionCount = 3,
  lockTarget,
  speakPrompt,
  praise,
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
  const praiseRef = useRef(praise);
  const onFinishedRef = useRef(onFinished);

  statsRef.current = stats;
  lettersRef.current = letters;
  onSpeakRef.current = onSpeak;
  speakPromptRef.current = speakPrompt;
  praiseRef.current = praise;
  onFinishedRef.current = onFinished;

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
    () => randomOptions(
      target.id,
      lettersRef.current.map((letter) => letter.id),
      optionCount
    ),
    [target.id, optionCount]
  );

  useEffect(() => {
    if (phase !== "question") {
      return;
    }
    onSpeakRef.current(speakPromptRef.current(target));
  }, [target, phase]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const replay = useCallback(() => {
    if (lockedRef.current) {
      return;
    }
    onSpeakRef.current(speakPromptRef.current(target));
  }, [target]);

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
      onSpeakRef.current(praiseRef.current(target));
      onCorrect(target.id, pointFromEvent(event));
      clearTimer();
      timerRef.current = window.setTimeout(finishRound, FEEDBACK_MS);
      return;
    }
    setSelected(id);
    setShakeNonce((value) => value + 1);
    setWrongCount((value) => value + 1);
    audioManager.playTryAgain();
    onMistake(target.id);
    onSpeakRef.current("Попробуй ещё!");
  }

  return {
    target,
    options,
    phase,
    selected,
    wrongCount,
    shakeNonce,
    replay,
    choose
  };
}
