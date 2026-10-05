import { useEffect, useMemo, useRef, useState } from "react";
import {
  LetterItem,
  LetterStats,
  OptionCount,
  PictureExampleEntry
} from "../types";
import type { Point } from "../utils/point";
import { letterVoiceKey } from "../audio/voiceCatalog";
import {
  letterListenLetterPath,
  listenSpecialPromptPath,
  listenYeryLetterPath,
  listenYeryPrefixPath,
  ruAssetPath
} from "../audio/ruVoiceBank";
import { audioManager } from "../audio/AudioManager";
import {
  hasListenInstructionPlayed,
  markListenInstructionPlayed
} from "../audio/listenSession";
import { showCorrectHint, useRound } from "../utils/useRound";
import { StageNav } from "./StageNav";
import { assetUrl, ASSETS } from "../utils/assets";
import { HomeButton } from "./HomeButton";
import { GameHudRight } from "./GameHudRight";
import { RestartActivityButton } from "./RestartActivityButton";
import { buildListenRoundOptions, buildPictureRoundOptions } from "../utils/selectors";

interface PictureLetterGameProps {
  letters: LetterItem[];
  stats: Record<string, LetterStats>;
  trailStep?: number;
  lockTarget?: LetterItem;
  optionCount?: OptionCount;
  pictureBank: readonly PictureExampleEntry[];
  pictureExampleHistory?: Map<string, string>;
  awaitNext?: boolean;
  stars?: number;
  onCorrect: (letterId: string, origin?: Point) => void;
  onAfterSuccess?: () => Promise<void>;
  onMistake: (letterId: string) => void;
  onSpeak: (text: string, options?: { key?: string; path?: string; onEnd?: () => void }) => void;
  onBack: () => void;
  onPrev?: () => void;
  onStageNext?: () => void;
  onFinished?: () => boolean | void;
  voiceMode?: "picture" | "listen";
  onRequestRestart?: () => void;
}

export function PictureLetterGame({
  letters,
  stats,
  lockTarget,
  optionCount = 3,
  pictureBank,
  pictureExampleHistory,
  awaitNext = false,
  stars = 0,
  onCorrect,
  onAfterSuccess,
  onMistake,
  onSpeak,
  onBack,
  onPrev,
  onStageNext,
  onFinished,
  voiceMode = "picture",
  onRequestRestart
}: PictureLetterGameProps) {
  const localExampleHistoryRef = useRef(new Map<string, string>());
  const exampleHistory = pictureExampleHistory ?? localExampleHistoryRef.current;
  const examplesById = useMemo(() => {
    const map = new Map(pictureBank.map((example) => [example.id, example]));
    if (voiceMode === "listen") {
      letters.forEach((letter) => {
        (letter.specialExamples ?? []).forEach((example) => {
          if (map.has(example.id) || !example.word.trim() || !example.image.trim()) {
            return;
          }
          map.set(example.id, {
            id: example.id,
            word: example.word,
            image: example.image,
            pictureEligible: true,
            allowedAsTarget: true,
            allowedAsDistractor: false,
            letterId: letter.id,
            letterUpper: letter.upper,
            letterContentReady: letter.contentReady
          });
        });
      });
    }
    return map;
  }, [letters, pictureBank, voiceMode]);
  const round = useRound({
    letters,
    stats,
    lockTarget,
    optionCount,
    optionBuilder: (target, count) =>
      voiceMode === "listen"
        ? buildListenRoundOptions(
            target,
            pictureBank,
            letters,
            count,
            exampleHistory.get(target.id)
          )
        : buildPictureRoundOptions(
            target.id,
            target.upper,
            pictureBank,
            count,
            exampleHistory.get(target.id)
          ),
    awaitNext,
    onCorrect,
    onAfterSuccess,
    onMistake,
    onSpeak,
    onFinished,
    speakPrompt: (letter) =>
      voiceMode === "listen"
        ? "Послушай и выбери картинку!"
        : `Что начинается на букву ${letter.upper}?`,
    speakKey: (letter) =>
      voiceMode === "listen" ? undefined : letterVoiceKey("picture", letter.id),
    speakPath: (letter) =>
      voiceMode === "listen" ? letterListenLetterPath(letter.id) : undefined,
    praise: (letter, correctOptionId) => {
      const example = examplesById.get(correctOptionId);
      return example?.word
        ? `Молодец! Это ${example.word.toLowerCase()}!`
        : letter.word
          ? `Молодец! Это ${letter.word.toLowerCase()}!`
          : `Молодец! Это буква ${letter.upper}!`;
    },
    praiseKey: (letter) => letterVoiceKey("correct", letter.id),
    tryAgainText: "Попробуй ещё раз!",
    playWrongSound: false,
    autoSpeak: voiceMode !== "listen"
  });

  const replayRef = useRef(round.replay);
  replayRef.current = round.replay;
  const targetRef = useRef(round.target);
  targetRef.current = round.target;
  const correctOptionIdRef = useRef(round.correctOptionId);
  correctOptionIdRef.current = round.correctOptionId;
  const phaseRef = useRef(round.phase);
  phaseRef.current = round.phase;
  const [instructionBusy, setInstructionBusy] = useState(false);
  const pauseTimerRef = useRef<number | null>(null);
  const listenGenRef = useRef(0);

  function clearListenPause() {
    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }

  function pauseMs(ms: number): Promise<void> {
    return new Promise((resolve) => {
      pauseTimerRef.current = window.setTimeout(() => {
        pauseTimerRef.current = null;
        resolve();
      }, ms);
    });
  }

  async function playListenTargetAudio(generation: number) {
    const stillCurrent = () =>
      generation === listenGenRef.current && phaseRef.current === "question";
    const letterId = targetRef.current.id;

    if (letterId === "Yery") {
      await audioManager.playVoiceAndWait(listenYeryPrefixPath());
      if (!stillCurrent()) {
        return;
      }
      await pauseMs(150);
      if (!stillCurrent()) {
        return;
      }
      audioManager.playVoice(listenYeryLetterPath());
      return;
    }

    const path = listenSpecialPromptPath(letterId) ?? letterListenLetterPath(letterId);
    if (!path) {
      return;
    }
    audioManager.playVoice(path);
  }

  function playListenVoice() {
    if (phaseRef.current !== "question") {
      return;
    }
    clearListenPause();
    audioManager.stopSpeaking();
    const generation = ++listenGenRef.current;
    void playListenTargetAudio(generation);
  }

  async function playListenRound() {
    if (phaseRef.current !== "question") {
      return;
    }
    if (document.querySelector(".app-shell--celebrating")) {
      return;
    }
    const generation = ++listenGenRef.current;
    clearListenPause();
    audioManager.stopSpeaking();

    const stillCurrent = () =>
      generation === listenGenRef.current && phaseRef.current === "question";
    const letterId = targetRef.current.id;
    const specialPath = listenSpecialPromptPath(letterId);

    if (letterId === "Yery" || specialPath) {
      if (!stillCurrent()) {
        return;
      }
      await playListenTargetAudio(generation);
      return;
    }

    if (!hasListenInstructionPlayed()) {
      setInstructionBusy(true);
      await audioManager.playVoiceAndWait(ruAssetPath("common/listen-instruction.mp3"));
      if (!stillCurrent()) {
        setInstructionBusy(false);
        return;
      }
      markListenInstructionPlayed();
      await pauseMs(650);
      if (!stillCurrent()) {
        setInstructionBusy(false);
        return;
      }
      setInstructionBusy(false);
    }

    if (!stillCurrent()) {
      return;
    }
    await playListenTargetAudio(generation);
  }

  useEffect(() => {
    if (!round.optionError) {
      exampleHistory.set(round.target.id, round.correctOptionId);
    }
  }, [
    exampleHistory,
    round.correctOptionId,
    round.optionError,
    round.target.id
  ]);

  useEffect(() => {
    if (voiceMode !== "listen" || round.phase !== "question" || round.optionError) {
      return;
    }
    const timer = window.setTimeout(() => {
      playListenRound();
    }, 50);
    return () => {
      window.clearTimeout(timer);
      listenGenRef.current += 1;
      clearListenPause();
      if (phaseRef.current === "question") {
        audioManager.stopSpeaking();
      }
    };
  }, [voiceMode, round.target.id, round.correctOptionId, round.phase, round.optionError]);

  useEffect(() => {
    return () => {
      audioManager.stopSpeaking();
    };
  }, []);

  const letterMark = round.target.upper;
  const isListen = voiceMode === "listen";

  return (
    <div className={`screen ${isListen ? "listen-screen" : "picture-screen"}`}>
      <div className={isListen ? "listen-backdrop" : "picture-backdrop"} aria-hidden="true">
        <img
          className={isListen ? "listen-meadow" : "picture-meadow"}
          src={assetUrl(isListen ? ASSETS.listen.meadow : ASSETS.picture.meadow)}
          alt=""
          draggable={false}
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <HomeButton onClick={onBack} />

      <GameHudRight stars={stars}>
        <button
          className="learn-sound"
          onClick={() => {
            if (isListen) {
              if (instructionBusy) {
                return;
              }
              playListenVoice();
              return;
            }
            round.replay();
          }}
          disabled={round.phase === "feedback" || (isListen && instructionBusy)}
          aria-label="Прослушать"
        >
          <span aria-hidden="true">🔊</span>
        </button>
      </GameHudRight>

      <div className="picture-board">
        <h1 className={isListen ? "listen-title" : "picture-title"}>
          {isListen ? (
            "Послушай и выбери картинку!"
          ) : (
            <>
              <span className="picture-title-text">Что начинается на букву </span>
              <span className="picture-title-letter">{letterMark}</span>
              <span className="picture-title-text">?</span>
            </>
          )}
        </h1>

        <div className="picture-choices" data-option-count={round.options.length}>
          {round.optionError ? (
            <p className="option-unavailable">Этот уровень пока недоступен</p>
          ) : null}
          {round.options.map((id) => {
            const example = examplesById.get(id);
            if (!example) {
              return null;
            }
            const isChosenCorrect =
              round.phase === "feedback" && id === round.correctOptionId;
            const isCorrectHinted =
              showCorrectHint(round.wrongCount, round.phase) &&
              id === round.correctOptionId;
            return (
              <button
                key={id}
                className={`picture-choice ${isChosenCorrect ? "is-chosen" : ""} ${
                  isCorrectHinted ? "is-hint" : ""
                }`}
                onClick={(event) => round.choose(id, event)}
                aria-label={example.word}
              >
                <img
                  src={assetUrl(example.image)}
                  alt={example.word}
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
        {onRequestRestart ? <RestartActivityButton onClick={onRequestRestart} /> : null}
      </div>

      <StageNav
        onPrev={onPrev}
        onNext={onStageNext}
        prevDest={isListen ? "picture" : "find"}
        nextDest={isListen ? "learn" : "listen"}
      />
    </div>
  );
}
