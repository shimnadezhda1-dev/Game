import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { LearnLetters } from "./components/LearnLetters";
import { FindLetterGame } from "./components/FindLetterGame";
import { PictureLetterGame } from "./components/PictureLetterGame";
import { ListenAndChooseGame } from "./components/ListenAndChooseGame";
import { Progress } from "./components/Progress";
import { RewardScreen } from "./components/RewardScreen";
import { FlyingStar } from "./components/FlyingStar";
import { StarsScreen } from "./components/StarsScreen";
import { AdventurePlay } from "./components/AdventurePlay";
import { GameControls } from "./components/GameControls";
import { LETTERS, contentReadyLetters } from "./data/letters";
import { audioManager } from "./audio/AudioManager";
import { backgroundMusic } from "./audio/BackgroundMusicManager";
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
import { getRewardById, REWARD_THRESHOLDS, RewardItem } from "./data/rewardCatalog";
import { playLetterPool, letterAllowsActivity, filterLettersByCategory } from "./utils/playSettings";
import { PlayerChooser } from "./components/PlayerChooser";

interface Flight {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

function App() {
  const [screen, setScreen] = useState<Screen>("home"); // never restored from localStorage
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const [activeReward, setActiveReward] = useState<{
    item: RewardItem;
    threshold: number;
  } | null>(null);
  const [musicOn, setMusicOn] = useState(() => backgroundMusic.isEnabled());
  const [flight, setFlight] = useState<Flight | null>(null);
  const [bankPulse, setBankPulse] = useState(false);
  const [playEpoch, setPlayEpoch] = useState(0);
  const [playerChooserOpen, setPlayerChooserOpen] = useState(true);
  const previousUnlockedRewardsRef = useRef(progress.unlockedRewards);
  const starTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return backgroundMusic.subscribe(() => setMusicOn(backgroundMusic.isEnabled()));
  }, []);

  useEffect(() => {
    const unlock = () => backgroundMusic.startFromGesture();
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
    () => playLetterPool(contentReadyLetters(LETTERS), progress.letterCategory),
    [progress.letterCategory]
  );
  const supportedOptionCounts = useMemo(() => availableOptionCounts(LETTERS), []);
  const pickableLetters = useMemo(
    () =>
      filterLettersByCategory(contentReadyLetters(LETTERS), progress.letterCategory).filter(
        (letter) => letterAllowsActivity(letter, progress.playActivity)
      ),
    [progress.letterCategory, progress.playActivity]
  );
  const currentPlayLetter =
    adventureLetters.find((letter) => letter.id === progress.selectedLetterId) ??
    adventureLetters[0];
  const glyphOptions = useMemo(
    () => glyphOptionPool(LETTERS, progress.optionCount),
    [progress.optionCount]
  );
  const pictureExamples = useMemo(() => pictureContentBank(LETTERS), []);
  const learnLetter =
    playLetters[progress.currentLearnIndex % playLetters.length] ?? playLetters[0] ?? LETTERS[0];

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

  const speak = useCallback((text: string, options?: { key?: string; onEnd?: () => void }) => {
    audioManager.speak(text, options);
  }, []);

  useEffect(() => {
    const previous = previousUnlockedRewardsRef.current;
    previousUnlockedRewardsRef.current = progress.unlockedRewards;
    const newlyId = progress.unlockedRewards.find((id) => !previous.includes(id));
    if (!newlyId) {
      return;
    }
    const item = getRewardById(newlyId);
    if (!item) {
      return;
    }
    const threshold =
      REWARD_THRESHOLDS[Math.max(0, progress.unlockedRewards.length - 1)] ??
      REWARD_THRESHOLDS[0];
    setActiveReward({ item, threshold });
    speak("Ура! Новая наклейка!");
  }, [progress.unlockedRewards, speak]);

  function startAdventure() {
    if (progress.playerPreference === null) {
      return;
    }
    if (!supportedOptionCounts.includes(progress.optionCount)) {
      return;
    }
    backgroundMusic.startFromGesture();
    setPlayEpoch((epoch) => epoch + 1);
    go("adventure");
  }

  function go(next: Screen) {
    audioManager.stopSpeaking();
    setPlayerChooserOpen(false);
    setScreen(next);
  }

  function addStar(letterId: string) {
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
        prev.unlockedRewards,
        prev.stars,
        nextStars
      );
      const next: ProgressState = {
        ...prev,
        correctAnswers: prev.correctAnswers + 1,
        stars: nextStars,
        letterStats: nextStats,
        mistakeCounts: prev.mistakeCounts,
        learnedLetterIds,
        unlockedRewards: unlocked
          ? Array.from(new Set([...prev.unlockedRewards, unlocked.item.id]))
          : prev.unlockedRewards
      };
      next.unlockedGroupIndex = maybeUnlockNextGroup(next);
      return next;
    });
    setBankPulse(true);
    window.setTimeout(() => setBankPulse(false), 600);
  }

  function markCorrect(letterId: string, origin?: Point) {
    audioManager.playSuccess();
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
      addStar(letterId);
      setFlight(null);
    }, 850);
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
      return { ...prev, currentLearnIndex: (prev.currentLearnIndex + 1) % pool.length };
    });
  }

  function selectLearnLetter(id: string) {
    setProgress((prev) => {
      const pool = unlockedLetters(prev);
      const index = pool.findIndex((item) => item.id === id);
      return { ...prev, currentLearnIndex: index >= 0 ? index : prev.currentLearnIndex };
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
    if (!letterAllowsActivity(currentPlayLetter, playActivity)) {
      return;
    }
    setProgress((prev) => ({ ...prev, playActivity }));
    if (screen === "learn" || screen === "find" || screen === "picture" || screen === "listen") {
      setPlayEpoch((epoch) => epoch + 1);
      go("adventure");
    }
  }

  function setStudyOrder(studyOrder: StudyOrder) {
    setProgress((prev) => ({ ...prev, studyOrder }));
  }

  function setLetterCategory(letterCategory: LetterCategory) {
    setProgress((prev) => {
      const pool = playLetterPool(contentReadyLetters(LETTERS), letterCategory);
      const selectedLetterId = pool.some((letter) => letter.id === prev.selectedLetterId)
        ? prev.selectedLetterId
        : pool[0]?.id ?? prev.selectedLetterId;
      return { ...prev, letterCategory, selectedLetterId };
    });
  }

  const setCurrentLetterId = useCallback((selectedLetterId: string) => {
    setProgress((prev) =>
      prev.selectedLetterId === selectedLetterId ? prev : { ...prev, selectedLetterId }
    );
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

  const backToHub = () => go("modeSelect");
  const backHome = () => go("home");

  function renderScreen() {
    switch (screen) {
      case "home":
        return (
          <HomeScreen
            onGoLearn={() => go("learn")}
            onPlayGames={startAdventure}
            onOpenStars={() => go("stars")}
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
            playerPreference={progress.playerPreference}
            onOpenPlayerChooser={() => setPlayerChooserOpen(true)}
          />
        );
      case "modeSelect":
      case "adventure":
        return (
          <AdventurePlay
            key={playEpoch}
            letters={adventureLetters}
            optionCatalog={LETTERS}
            optionCount={progress.optionCount}
            stats={progress.letterStats}
            progress={progress}
            startActivity={progress.playActivity}
            studyOrder={progress.studyOrder}
            selectedLetterId={progress.selectedLetterId}
            onCorrect={markCorrect}
            onMistake={markMistake}
            onSpeak={speak}
            onBack={backHome}
            onLetterMastered={onLetterMastered}
            onPlayActivityChange={setPlayActivity}
            onCurrentLetterChange={setCurrentLetterId}
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
            onMistake={markMistake}
            onSpeak={speak}
            onBack={backToHub}
          />
        );
      case "picture":
        return (
          <PictureLetterGame
            letters={playLetters}
            optionCount={progress.optionCount}
            pictureBank={pictureExamples}
            stats={progress.letterStats}
            trailStep={progress.stars % 5}
            stars={progress.stars}
            onCorrect={markCorrect}
            onMistake={markMistake}
            onSpeak={speak}
            onBack={backToHub}
          />
        );
      case "listen":
        return (
          <ListenAndChooseGame
            letters={playLetters}
            optionCount={progress.optionCount}
            optionPool={glyphOptions}
            optionCatalog={LETTERS}
            stats={progress.letterStats}
            trailStep={progress.stars % 5}
            stars={progress.stars}
            onCorrect={markCorrect}
            onMistake={markMistake}
            onSpeak={speak}
            onBack={backToHub}
          />
        );
      case "stars":
        return (
          <StarsScreen progress={progress} letters={contentReadyLetters(LETTERS)} onBack={backHome} onSpeak={speak} />
        );
      default:
        return (
          <HomeScreen
            onGoLearn={() => go("learn")}
            onPlayGames={startAdventure}
            onOpenStars={() => go("stars")}
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
            playerPreference={progress.playerPreference}
            onOpenPlayerChooser={() => setPlayerChooserOpen(true)}
          />
        );
    }
  }

  return (
    <div
      className={`app-shell ${
        screen === "stars" ? "" : "home-fit"
      } ${screen === "home" ? "home-immersive" : ""}`}
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
      {playerChooserOpen ? (
        <PlayerChooser
          value={progress.playerPreference}
          onChoose={(playerPreference) => {
            setPlayerPreference(playerPreference);
            setPlayerChooserOpen(false);
          }}
        />
      ) : null}
      {!activeReward && ["modeSelect", "adventure", "learn", "find", "picture", "listen"].includes(screen) ? (
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
          onClose={() => setActiveReward(null)}
        />
      ) : null}
    </div>
  );
}

export default App;
