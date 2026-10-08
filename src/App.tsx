import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { LearnLetters } from "./components/LearnLetters";
import { FindLetterGame } from "./components/FindLetterGame";
import { PictureLetterGame } from "./components/PictureLetterGame";
import { Progress } from "./components/Progress";
import { RewardScreen } from "./components/RewardScreen";
import { FlyingStar } from "./components/FlyingStar";
import { StarsScreen } from "./components/StarsScreen";
import { AdventurePlay } from "./components/AdventurePlay";
import { GameControls } from "./components/GameControls";
import { LETTERS, contentReadyLetters } from "./data/letters";
import { audioManager, speakRussian, type SpeakOptions } from "./audio/AudioManager";
import { bumpPlayFlow, flowLog } from "./audio/playFlow";
import { resetListenInstruction } from "./audio/listenSession";
import { backgroundMusic } from "./audio/BackgroundMusicManager";
import type { MusicMode } from "./audio/musicSettings";
import {
  LetterCategory,
  OptionCount,
  PlayActivity,
  PlayerPreference,
  ProgressState,
  Screen,
  StudyOrder
} from "./types";
import { loadProgress, saveProgress } from "./utils/storage";
import { preloadImages } from "./utils/preload";
import { assetUrl } from "./utils/assets";
import type { Point } from "./utils/point";
import {
  availableOptionCounts,
  getLetterStats,
  glyphOptionPool,
  maybeUnlockNextGroup,
  pictureContentBank,
  unlockedLetters
} from "./utils/selectors";
import { unlockRewardAtThreshold } from "./utils/rewards";
import { RewardItem } from "./data/rewardCatalog";
import { ALPHABET_ACHIEVEMENT_ID, getStickerById, resolvedSticker } from "./data/stickerCatalog";
import { stickerAssetExists } from "./data/stickerAssets";
import {
  addCompletedCycleLetter,
  applyAlphabetAchievement,
  isAlphabetCycleComplete,
  startNewAlphabetAdventure,
  uniqueIds,
  uniqueNumbers
} from "./utils/stickerLogic";
import { StickersAlbumScreen } from "./components/StickersAlbumScreen";
import { meadowFavoriteIds, toggleFavoriteStickerId } from "./utils/favoriteStickers";
import { AlphabetCompleteScreen } from "./components/AlphabetCompleteScreen";
import { playLetterPool, letterAllowsActivity, filterLettersByCategory, validPlayActivity, PLAY_ACTIVITIES } from "./utils/playSettings";
import {
  activityLetterId,
  resetActivityLetter,
  startLetterIdForActivity,
  withActivityLetter
} from "./utils/activityProgress";
import { clampLearnAdvanceSeconds } from "./utils/learnAdvance";
import { PlayerChooser } from "./components/PlayerChooser";
import { RestartActivityConfirm } from "./components/RestartActivityConfirm";
import { MusicControlProvider } from "./components/MusicControlContext";
import { MusicSettingsPanel } from "./components/MusicSettingsPanel";

function VoiceDebugLine() {
  const [path, setPath] = useState("");
  const host = window.location.hostname;
  const visible =
    new URLSearchParams(window.location.search).has("voiceDebug") &&
    (host === "127.0.0.1" || host === "localhost");

  useEffect(() => {
    if (!visible) {
      return;
    }
    const timer = window.setInterval(() => {
      setPath(audioManager.lastPlayedPath());
    }, 250);
    return () => window.clearInterval(timer);
  }, [visible]);

  if (!visible) {
    return null;
  }
  return (
    <p className="voice-debug-line" aria-hidden="true">
      Current voice file: {path || "—"}
    </p>
  );
}

interface Flight {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

function readLocalPreview(): { letterId: "E" | "Yo"; activity: PlayActivity } | null {
  const host = window.location.hostname;
  if (host !== "127.0.0.1" && host !== "localhost") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const letterId = params.get("previewLetter");
  const activity = params.get("previewActivity");
  if ((letterId !== "E" && letterId !== "Yo") || !validPlayActivity(activity)) {
    return null;
  }
  return { letterId, activity };
}

function App() {
  const preview = useMemo(() => readLocalPreview(), []);
  const previewLetter = preview ? LETTERS.find((letter) => letter.id === preview.letterId) : undefined;
  const [screen, setScreen] = useState<Screen>(preview ? "adventure" : "home"); // never restored from localStorage
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const [activeReward, setActiveReward] = useState<{
    item: RewardItem;
    threshold: number;
  } | null>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [musicOn, setMusicOn] = useState(() => backgroundMusic.isEnabled());
  const [musicMode, setMusicModeState] = useState<MusicMode>(() => backgroundMusic.getMode());
  const [musicVolume, setMusicVolumeState] = useState(() => backgroundMusic.getVolume());
  const [customFileName, setCustomFileName] = useState<string | null>(() => backgroundMusic.getCustomName());
  const [persistWarning, setPersistWarning] = useState<string | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [musicSettingsOpen, setMusicSettingsOpen] = useState(false);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [bankPulse, setBankPulse] = useState(false);
  const [playEpoch, setPlayEpoch] = useState(0);
  const [resumeMode, setResumeMode] = useState<"fresh" | "continue">("continue");
  const [restartConfirm, setRestartConfirm] = useState(false);
  const [playerChooserOpen, setPlayerChooserOpen] = useState(() => !preview);
  const pendingRewardRef = useRef<{
    item: RewardItem;
    threshold: number;
  } | null>(null);
  const rewardClosedRef = useRef<(() => void) | null>(null);
  const celebratingRef = useRef(false);
  const progressRef = useRef(progress);
  const starTimerRef = useRef<number | null>(null);
  progressRef.current = progress;

  useEffect(() => {
    return backgroundMusic.subscribe(() => {
      setMusicOn(backgroundMusic.isEnabled());
      setMusicModeState(backgroundMusic.getMode());
      setMusicVolumeState(backgroundMusic.getVolume());
      setCustomFileName(backgroundMusic.getCustomName());
      setPersistWarning(backgroundMusic.getPersistWarning());
      setFormatError(backgroundMusic.getFormatError());
    });
  }, []);

  useEffect(() => {
    const unlock = () => {
      backgroundMusic.startFromGesture();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const playLetters = useMemo(
    () => unlockedLetters(progress, LETTERS),
    [progress]
  );
  const adventureLetters = useMemo(
    () =>
      playLetterPool(contentReadyLetters(LETTERS), progress.letterCategory).filter((letter) =>
        letterAllowsActivity(letter, progress.playActivity)
      ),
    [progress.letterCategory, progress.playActivity]
  );
  const supportedOptionCounts = useMemo(() => availableOptionCounts(LETTERS), []);
  const pickableLetters = useMemo(
    () => filterLettersByCategory(LETTERS, progress.letterCategory),
    [progress.letterCategory]
  );
  const currentPlayLetter =
    adventureLetters.find(
      (letter) => letter.id === activityLetterId(progress, progress.playActivity)
    ) ??
    adventureLetters.find((letter) => letter.id === progress.selectedLetterId) ??
    adventureLetters[0];
  const glyphOptions = useMemo(
    () => glyphOptionPool(LETTERS, progress.optionCount),
    [progress.optionCount]
  );
  const pictureExamples = useMemo(() => pictureContentBank(LETTERS), []);
  const learnCursorId = activityLetterId(progress, "learn");
  const learnLetter =
    playLetters.find((letter) => letter.id === learnCursorId) ??
    playLetters[progress.currentLearnIndex % playLetters.length] ??
    playLetters[0] ??
    LETTERS[0];

  useEffect(() => {
    audioManager.setEnabled(progress.soundEnabled);
    preloadImages([
      assetUrl("/assets/home/home-meadow.webp"),
      assetUrl("/assets/home/fox-home.webp"),
      assetUrl("/assets/home/sun-smiling.webp"),
      assetUrl("/assets/home/letters-abv.webp")
    ]);
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    return () => {
      if (starTimerRef.current !== null) window.clearTimeout(starTimerRef.current);
    };
  }, []);

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    if (celebratingRef.current) {
      return;
    }
    speakRussian(text, options);
  }, []);

  const abortPlayFlow = useCallback(() => {
    bumpPlayFlow();
    audioManager.stopSpeaking();
    if (starTimerRef.current !== null) {
      window.clearTimeout(starTimerRef.current);
      starTimerRef.current = null;
    }
    pendingRewardRef.current = null;
    celebratingRef.current = false;
    setIsCelebrating(false);
    setActiveReward(null);
    const closeReward = rewardClosedRef.current;
    rewardClosedRef.current = null;
    closeReward?.();
  }, []);

  const waitForQueuedReward = useCallback(() => {
    return Promise.resolve().then(() => {
      const reward = pendingRewardRef.current;
      pendingRewardRef.current = null;
      if (!reward) {
        return;
      }
      flowLog("REWARD OPEN");
      celebratingRef.current = true;
      setIsCelebrating(true);
      setActiveReward(reward);
      return new Promise<void>((resolve) => {
        rewardClosedRef.current = () => {
          flowLog("REWARD CLOSE");
          celebratingRef.current = false;
          setIsCelebrating(false);
          setActiveReward(null);
          resolve();
        };
      });
    });
  }, []);

  function closeRewardOverlay() {
    audioManager.stopSpeaking();
    const closeReward = rewardClosedRef.current;
    rewardClosedRef.current = null;
    closeReward?.();
  }

  function enterAdventure() {
    backgroundMusic.startFromGesture();
    resetListenInstruction();
    setPlayEpoch((epoch) => epoch + 1);
    go("adventure");
  }

  function startAdventure() {
    if (progress.playerPreference === null) {
      return;
    }
    if (!supportedOptionCounts.includes(progress.optionCount)) {
      return;
    }
    setResumeMode("continue");
    enterAdventure();
  }

  function confirmRestartActivity() {
    const activity = progress.playActivity;
    if (activity === "learn") {
      setRestartConfirm(false);
      return;
    }
    const pool = playLetterPool(contentReadyLetters(LETTERS), progress.letterCategory).filter(
      (letter) => letterAllowsActivity(letter, activity)
    );
    const startId = startLetterIdForActivity({
      studyOrder: progress.studyOrder,
      pool,
      pickLetterId: progress.selectedLetterId
    });
    setProgress((prev) => resetActivityLetter(prev, activity, startId));
    setResumeMode("fresh");
    setRestartConfirm(false);
    enterAdventure();
  }

  function go(next: Screen) {
    abortPlayFlow();
    flowLog("NAV", next);
    setPlayerChooserOpen(false);
    setRestartConfirm(false);
    setScreen(next);
  }

  function addStar(letterId: string) {
    const snapshot = progressRef.current;
    const queued = unlockRewardAtThreshold(
      snapshot.playerPreference,
      snapshot.unlockedStickerIds,
      snapshot.claimedMilestonesThisCycle,
      snapshot.stars,
      snapshot.stars + 1
    );
    if (queued) {
      pendingRewardRef.current = {
        item: queued.item,
        threshold: queued.threshold
      };
    }
    setProgress((prev) => {
      const prevStats = getLetterStats(prev.letterStats, letterId);
      const nextStars = prev.stars + 1;
      const nextStats = {
        ...prev.letterStats,
        [letterId]: {
          correctCount: prevStats.correctCount + 1,
          wrongCount: prevStats.wrongCount,
          lastPracticed: Date.now()
        }
      };
      const learnedLetterIds =
        prevStats.correctCount + 1 >= 3
          ? Array.from(new Set([...prev.learnedLetterIds, letterId]))
          : prev.learnedLetterIds;
      const unlocked = unlockRewardAtThreshold(
        prev.playerPreference,
        prev.unlockedStickerIds,
        prev.claimedMilestonesThisCycle,
        prev.stars,
        nextStars
      );
      if (unlocked) {
        pendingRewardRef.current = {
          item: unlocked.item,
          threshold: unlocked.threshold
        };
      }
      const unlockedStickerIds = uniqueIds(
        unlocked ? [...prev.unlockedStickerIds, unlocked.item.id] : prev.unlockedStickerIds
      );
      const claimedMilestonesThisCycle = uniqueNumbers(
        unlocked ? [...prev.claimedMilestonesThisCycle, unlocked.threshold] : prev.claimedMilestonesThisCycle
      );
      const next: ProgressState = {
        ...prev,
        correctAnswers: prev.correctAnswers + 1,
        stars: nextStars,
        letterStats: nextStats,
        mistakeCounts: prev.mistakeCounts,
        learnedLetterIds,
        unlockedStickerIds,
        unlockedRewards: unlockedStickerIds,
        claimedMilestonesThisCycle,
        rewardedThresholds: claimedMilestonesThisCycle
      };
      next.unlockedGroupIndex = maybeUnlockNextGroup(next);
      return next;
    });
    setBankPulse(true);
    window.setTimeout(() => setBankPulse(false), 600);
  }

  function markCorrect(letterId: string, origin?: Point) {
    const bank = document.getElementById("star-bank")?.getBoundingClientRect();
    const fromX = origin?.x ?? window.innerWidth / 2;
    const fromY = origin?.y ?? window.innerHeight / 2;
    const toX = bank ? bank.left + bank.width / 2 : 48;
    const toY = bank ? bank.top + bank.height / 2 : 28;
    setFlight({ fromX, fromY, toX, toY });
    if (starTimerRef.current !== null) {
      window.clearTimeout(starTimerRef.current);
    }
    starTimerRef.current = window.setTimeout(() => {
      setFlight(null);
    }, 850);
    addStar(letterId);
  }

  function markMistake(letterId: string) {
    setProgress((prev) => {
      const prevStats = getLetterStats(prev.letterStats, letterId);
      return {
        ...prev,
        mistakeCounts: {
          ...prev.mistakeCounts,
          [letterId]: (prev.mistakeCounts[letterId] ?? 0) + 1
        },
        letterStats: {
          ...prev.letterStats,
          [letterId]: {
            ...prevStats,
            wrongCount: prevStats.wrongCount + 1,
            lastPracticed: Date.now()
          }
        }
      };
    });
  }

  function nextLearnLetter() {
    setProgress((prev) => {
      const pool = unlockedLetters(prev);
      const currentId = activityLetterId(prev, "learn");
      const currentIndex = Math.max(
        0,
        pool.findIndex((item) => item.id === currentId)
      );
      const nextIndex = (currentIndex + 1) % pool.length;
      const nextId = pool[nextIndex]?.id ?? pool[0]?.id ?? "A";
      return withActivityLetter(
        { ...prev, currentLearnIndex: nextIndex },
        "learn",
        nextId
      );
    });
  }

  function selectLearnLetter(id: string) {
    setProgress((prev) => {
      const pool = unlockedLetters(prev);
      const index = pool.findIndex((item) => item.id === id);
      const nextIndex = index >= 0 ? index : prev.currentLearnIndex;
      const nextId = pool[nextIndex]?.id ?? id;
      return withActivityLetter(
        { ...prev, currentLearnIndex: nextIndex },
        "learn",
        nextId
      );
    });
  }

  function toggleSound() {
    setProgress((prev) => {
      const soundEnabled = !prev.soundEnabled;
      audioManager.setEnabled(soundEnabled);
      return { ...prev, soundEnabled };
    });
  }

  function toggleMusic() {
    if (!musicOn) {
      backgroundMusic.setEnabled(true);
      backgroundMusic.startFromGesture();
      return;
    }
    backgroundMusic.setEnabled(false);
  }

  function setMusicMode(mode: MusicMode) {
    backgroundMusic.setMode(mode);
    if (mode !== "off") {
      backgroundMusic.startFromGesture();
    }
  }

  function setMusicVolume(volume: number) {
    backgroundMusic.setVolume(volume);
  }

  async function pickCustomMusic(file: File) {
    await backgroundMusic.setCustomFile(file);
    backgroundMusic.startFromGesture();
  }

  function setPlayerPreference(playerPreference: PlayerPreference) {
    setProgress((prev) => ({ ...prev, playerPreference }));
  }

  function setOptionCount(optionCount: OptionCount) {
    if (!supportedOptionCounts.includes(optionCount)) {
      return;
    }
    setProgress((prev) => ({ ...prev, optionCount }));
  }

  function setPlayActivity(playActivity: PlayActivity) {
    if (["adventure", "learn", "find", "picture", "listen"].includes(screen)) {
      const alreadyOnLearn =
        playActivity === "learn" && progress.playActivity === "learn" && screen === "adventure";
      if (playActivity === progress.playActivity && screen === "adventure" && !alreadyOnLearn) {
        return;
      }
      setResumeMode("continue");
      setProgress((prev) => ({ ...prev, playActivity }));
      enterAdventure();
      return;
    }
    setProgress((prev) => ({ ...prev, playActivity }));
  }

  function setPlayActivitySilent(playActivity: PlayActivity) {
    setProgress((prev) => ({ ...prev, playActivity }));
  }

  function setStudyOrder(studyOrder: StudyOrder) {
    setProgress((prev) => {
      if (prev.studyOrder === studyOrder) {
        return prev;
      }
      const next = { ...prev, studyOrder };
      if (studyOrder === "alpha") {
        let updated = next;
        for (const activity of PLAY_ACTIVITIES) {
          const pool = playLetterPool(contentReadyLetters(LETTERS), prev.letterCategory).filter((item) =>
            letterAllowsActivity(item, activity)
          );
          updated = withActivityLetter(updated, activity, pool[0]?.id ?? "A");
        }
        return updated;
      }
      return next;
    });
  }

  function setLetterCategory(letterCategory: LetterCategory) {
    setProgress((prev) => {
      const pool = playLetterPool(contentReadyLetters(LETTERS), letterCategory).filter((letter) =>
        letterAllowsActivity(letter, prev.playActivity)
      );
      const selectedLetterId = pool.some((letter) => letter.id === prev.selectedLetterId)
        ? prev.selectedLetterId
        : pool[0]?.id ?? prev.selectedLetterId;
      return { ...prev, letterCategory, selectedLetterId };
    });
  }

  function setLearnAdvanceSeconds(learnAdvanceSeconds: number) {
    setProgress((prev) => ({
      ...prev,
      learnAdvanceSeconds: clampLearnAdvanceSeconds(learnAdvanceSeconds)
    }));
  }

  const setCurrentLetterId = useCallback((letterId: string, activity?: PlayActivity) => {
    setProgress((prev) => withActivityLetter(prev, activity ?? prev.playActivity, letterId));
  }, []);

  function setSelectedLetter(selectedLetterId: string) {
    setProgress((prev) => ({ ...prev, selectedLetterId, studyOrder: "pick" }));
  }

  function onLetterMastered(letterId: string) {
    setProgress((prev) => {
      const next: ProgressState = {
        ...prev,
        learnedLetterIds: Array.from(new Set([...prev.learnedLetterIds, letterId]))
      };
      next.unlockedGroupIndex = maybeUnlockNextGroup(next);
      return next;
    });
  }

  function onAlphabetLetterFinished(letterId: string): boolean {
    const snapshot = progressRef.current;
    if (snapshot.studyOrder !== "alpha") {
      return false;
    }
    const nextLetters = addCompletedCycleLetter(snapshot.completedLettersThisCycle, letterId);
    const justCompleted = isAlphabetCycleComplete(nextLetters) && !snapshot.alphabetCycleCompleted;
    setProgress((prev) => {
      if (prev.studyOrder !== "alpha") {
        return prev;
      }
      const letters = addCompletedCycleLetter(prev.completedLettersThisCycle, letterId);
      const done = isAlphabetCycleComplete(letters) && !prev.alphabetCycleCompleted;
      const next = { ...prev, completedLettersThisCycle: letters };
      if (!done) {
        return next;
      }
      return applyAlphabetAchievement({
        ...next,
        alphabetCycleCompleted: true,
        completedAlphabetCycles: prev.completedAlphabetCycles + 1
      });
    });
    return justCompleted;
  }

  function setFavoriteSticker(id: string) {
    setProgress((prev) => {
      const favoriteStickerIds = toggleFavoriteStickerId(
        prev.favoriteStickerIds,
        id,
        prev.unlockedStickerIds
      );
      return {
        ...prev,
        favoriteStickerIds,
        favoriteStickerId: favoriteStickerIds[0] ?? null
      };
    });
  }

  function startNewAdventureFromComplete() {
    setProgress((prev) => startNewAlphabetAdventure(prev));
    go("home");
  }

  const backToHub = () => go("modeSelect");
  const backHome = () => go("home");
  const shownPlayerPreference = playerChooserOpen ? null : progress.playerPreference;
  const meadowFriends = useMemo(() => {
    const ids = meadowFavoriteIds(progress.favoriteStickerIds, activeReward?.item.id ?? null);
    return ids.flatMap((id) => {
      const item = getStickerById(id);
      if (!item) {
        return [];
      }
      const resolved = resolvedSticker(item);
      if (!stickerAssetExists(resolved.asset)) {
        return [];
      }
      return [{ id, src: assetUrl(resolved.asset ?? "") }];
    });
  }, [progress.favoriteStickerIds, activeReward]);

  function renderScreen() {
    switch (screen) {
      case "home":
        return (
          <HomeScreen
            onGoLearn={() => {
              setProgress((prev) => ({ ...prev, playActivity: "learn" }));
              setResumeMode("continue");
              enterAdventure();
            }}
            onPlayGames={startAdventure}
            onOpenStars={() => go("stars")}
            onOpenStickers={() => go("stickers")}
            onSpeak={speak}
            onToggleMusic={toggleMusic}
            musicOn={musicOn}
            optionCount={progress.optionCount}
            availableOptionCounts={supportedOptionCounts}
            onOptionCountChange={setOptionCount}
            playActivity={progress.playActivity}
            onPlayActivityChange={setPlayActivity}
            studyOrder={progress.studyOrder}
            onStudyOrderChange={setStudyOrder}
            letterCategory={progress.letterCategory}
            onLetterCategoryChange={setLetterCategory}
            selectedLetterId={progress.selectedLetterId}
            pickableLetters={pickableLetters}
            onSelectedLetterChange={setSelectedLetter}
            foxCelebrate={progress.stars >= 20}
            playerPreference={shownPlayerPreference}
            onOpenPlayerChooser={() => setPlayerChooserOpen(true)}
          />
        );
      case "modeSelect":
      case "adventure":
        return (
          <AdventurePlay
            key={playEpoch}
            letters={previewLetter ? [previewLetter] : adventureLetters}
            optionCatalog={LETTERS}
            optionCount={progress.optionCount}
            stats={progress.letterStats}
            progress={progress}
            startActivity={preview?.activity ?? progress.playActivity}
            studyOrder={previewLetter ? "pick" : progress.studyOrder}
            selectedLetterId={previewLetter?.id ?? progress.selectedLetterId}
            resumeLetterId={
              previewLetter?.id ??
              activityLetterId(progress, preview?.activity ?? progress.playActivity)
            }
            resumeMode={previewLetter ? "continue" : resumeMode}
            onCorrect={previewLetter ? () => undefined : markCorrect}
            onAfterSuccess={previewLetter ? undefined : waitForQueuedReward}
            onMistake={previewLetter ? () => undefined : markMistake}
            onSpeak={speak}
            audioEntryKey={playEpoch}
            onBack={backHome}
            onLetterMastered={previewLetter ? () => undefined : onLetterMastered}
            onAlphabetLetterFinished={previewLetter ? undefined : onAlphabetLetterFinished}
            onPlayActivityChange={previewLetter ? () => undefined : setPlayActivitySilent}
            onCurrentLetterChange={previewLetter ? () => undefined : setCurrentLetterId}
            learnAdvanceSeconds={progress.learnAdvanceSeconds}
            onLearnAdvanceSecondsChange={previewLetter ? undefined : setLearnAdvanceSeconds}
            onRequestRestart={
              previewLetter
                ? undefined
                : () => setRestartConfirm(true)
            }
          />
        );
      case "learn":
        return (
          <LearnLetters
            letter={learnLetter}
            letters={playLetters}
            stars={progress.stars}
            onSelectLetter={selectLearnLetter}
            onNext={nextLearnLetter}
            onBack={backHome}
            onHome={backHome}
            onSpeak={speak}
            autoAdvance={progress.studyOrder !== "pick"}
            advanceDelaySec={progress.learnAdvanceSeconds}
            onAdvanceSecondsChange={
              progress.studyOrder !== "pick" ? setLearnAdvanceSeconds : undefined
            }
            onGoNextActivity={() => {
              setPlayActivitySilent("find");
              enterAdventure();
            }}
            allowLetterSkip={progress.studyOrder !== "pick"}
          />
        );
      case "find":
        return (
          <FindLetterGame
            letters={playLetters}
            optionCount={progress.optionCount}
            optionPool={glyphOptions}
            optionCatalog={LETTERS}
            stats={progress.letterStats}
            onCorrect={markCorrect}
            onAfterSuccess={waitForQueuedReward}
            onMistake={markMistake}
            onSpeak={speak}
            onBack={backToHub}
            onRequestRestart={() => setRestartConfirm(true)}
          />
        );
      case "picture":
        return (
          <PictureLetterGame
            key="standalone-picture"
            letters={playLetters}
            optionCount={progress.optionCount}
            pictureBank={pictureExamples}
            stats={progress.letterStats}
            trailStep={progress.stars % 5}
            stars={progress.stars}
            onCorrect={markCorrect}
            onAfterSuccess={waitForQueuedReward}
            onMistake={markMistake}
            onSpeak={speak}
            onBack={backToHub}
            onRequestRestart={() => setRestartConfirm(true)}
          />
        );
      case "listen":
        return (
          <PictureLetterGame
            key="standalone-listen"
            letters={playLetters}
            optionCount={progress.optionCount}
            pictureBank={pictureExamples}
            stats={progress.letterStats}
            trailStep={progress.stars % 5}
            stars={progress.stars}
            voiceMode="listen"
            onCorrect={markCorrect}
            onAfterSuccess={waitForQueuedReward}
            onMistake={markMistake}
            onSpeak={speak}
            onBack={backToHub}
            onRequestRestart={() => setRestartConfirm(true)}
          />
        );
      case "stars":
        return (
          <StarsScreen progress={progress} letters={contentReadyLetters(LETTERS)} onBack={backHome} onSpeak={speak} />
        );
      case "stickers":
        return (
          <StickersAlbumScreen
            progress={progress}
            onBack={backHome}
            onSetFavorite={setFavoriteSticker}
          />
        );
      default:
        return (
          <HomeScreen
            onGoLearn={() => {
              setProgress((prev) => ({ ...prev, playActivity: "learn" }));
              setResumeMode("continue");
              enterAdventure();
            }}
            onPlayGames={startAdventure}
            onOpenStars={() => go("stars")}
            onOpenStickers={() => go("stickers")}
            onSpeak={speak}
            onToggleMusic={toggleMusic}
            musicOn={musicOn}
            optionCount={progress.optionCount}
            availableOptionCounts={supportedOptionCounts}
            onOptionCountChange={setOptionCount}
            playActivity={progress.playActivity}
            onPlayActivityChange={setPlayActivity}
            studyOrder={progress.studyOrder}
            onStudyOrderChange={setStudyOrder}
            letterCategory={progress.letterCategory}
            onLetterCategoryChange={setLetterCategory}
            selectedLetterId={progress.selectedLetterId}
            pickableLetters={pickableLetters}
            onSelectedLetterChange={setSelectedLetter}
            playerPreference={shownPlayerPreference}
            onOpenPlayerChooser={() => setPlayerChooserOpen(true)}
          />
        );
    }
  }

  return (
    <MusicControlProvider
      value={{
        musicOn,
        musicMode,
        musicVolume,
        customFileName,
        persistWarning,
        formatError,
        settingsOpen: musicSettingsOpen,
        openMusicSettings: () => setMusicSettingsOpen(true),
        closeMusicSettings: () => setMusicSettingsOpen(false),
        onToggleMusic: toggleMusic,
        setMusicMode,
        setMusicVolume,
        pickCustomMusic
      }}
    >
    <div
      className={`app-shell ${
        screen === "stars" || screen === "stickers" ? "" : "home-fit"
      } ${screen === "home" ? "home-immersive" : ""} ${
        ["modeSelect", "adventure", "learn", "find", "picture", "listen"].includes(screen)
          ? "play-hud"
          : ""
      } ${isCelebrating ? "app-shell--celebrating" : ""}`}
    >
      <Progress
        progress={progress}
        onOpenStars={() => go("stars")}
        onToggleSound={toggleSound}
        onToggleMusic={toggleMusic}
        musicOn={musicOn}
        onHome={screen === "home" ? undefined : backHome}
        bankPulse={bankPulse}
        homeMode={screen === "home"}
      />
      {flight ? <FlyingStar {...flight} /> : null}
      {renderScreen()}
      {restartConfirm && !preview ? (
        <RestartActivityConfirm
          onYes={confirmRestartActivity}
          onNo={() => setRestartConfirm(false)}
        />
      ) : null}
      <MusicSettingsPanel />
      {playerChooserOpen && !preview ? (
        <PlayerChooser
          value={progress.playerPreference}
          onChoose={(playerPreference) => {
            setPlayerPreference(playerPreference);
            setPlayerChooserOpen(false);
          }}
        />
      ) : null}
      {!preview && !activeReward && !progress.alphabetCycleCompleted && ["modeSelect", "adventure", "learn", "find", "picture", "listen"].includes(screen) ? (
        <GameControls
          key={screen}
          optionCount={progress.optionCount}
          availableCounts={supportedOptionCounts}
          onOptionCountChange={setOptionCount}
          playActivity={progress.playActivity}
          onPlayActivityChange={setPlayActivity}
          studyOrder={progress.studyOrder}
          onStudyOrderChange={setStudyOrder}
          letterCategory={progress.letterCategory}
          onLetterCategoryChange={setLetterCategory}
          selectedLetterId={progress.selectedLetterId}
          pickableLetters={pickableLetters}
          onSelectedLetterChange={setSelectedLetter}
          currentLetter={currentPlayLetter}
        />
      ) : null}
      {activeReward ? (
        <RewardScreen
          threshold={activeReward.threshold}
          title="Ура! Новая наклейка!"
          reward={activeReward.item}
          onClose={closeRewardOverlay}
          onOpenAlbum={() => go("stickers")}
          meadowFriends={meadowFriends}
        />
      ) : null}
      {progress.alphabetCycleCompleted && !preview ? (
        <AlphabetCompleteScreen
          isNewAchievement={progress.unlockedStickerIds.includes(ALPHABET_ACHIEVEMENT_ID)}
          onStartNewAdventure={startNewAdventureFromComplete}
        />
      ) : null}
      <VoiceDebugLine />
    </div>
    </MusicControlProvider>
  );
}

export default App;
