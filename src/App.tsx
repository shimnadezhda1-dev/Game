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
import { QuickSettings } from "./components/QuickSettings";
import { LETTERS, contentReadyLetters } from "./data/letters";
import { audioManager } from "./audio/AudioManager";
import { backgroundMusic } from "./audio/BackgroundMusicManager";
import { OptionCount, ProgressState, Screen } from "./types";
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
import { rewardJustUnlocked, STAR_REWARDS, StarReward } from "./utils/rewards";

interface Flight {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

function App() {
  const [screen, setScreen] = useState<Screen>("home"); // never restored from localStorage
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const [activeReward, setActiveReward] = useState<StarReward | null>(null);
  const [musicOn, setMusicOn] = useState(() => backgroundMusic.isEnabled());
  const [flight, setFlight] = useState<Flight | null>(null);
  const [bankPulse, setBankPulse] = useState(false);
  const [playEpoch, setPlayEpoch] = useState(0);
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
  const adventureLetters = useMemo(() => contentReadyLetters(LETTERS), []);
  const supportedOptionCounts = useMemo(() => availableOptionCounts(LETTERS), []);
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
    const newlyUnlocked = STAR_REWARDS.find(
      (reward) =>
        progress.unlockedRewards.includes(reward.id) &&
        !previous.includes(reward.id)
    );
    if (!newlyUnlocked) {
      return;
    }

    setActiveReward(newlyUnlocked);
    speak("Ура! Новая наклейка!");
  }, [progress.unlockedRewards, speak]);

  function startAdventure() {
    if (!supportedOptionCounts.includes(progress.optionCount)) {
      return;
    }
    backgroundMusic.startFromGesture();
    setPlayEpoch((epoch) => epoch + 1);
    go("adventure");
  }

  function go(next: Screen) {
    audioManager.stopSpeaking();
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
      const thresholdReward = rewardJustUnlocked(prev.stars, nextStars);
      const unlocked =
        thresholdReward && !prev.unlockedRewards.includes(thresholdReward.id)
          ? thresholdReward
          : null;
      const next: ProgressState = {
        ...prev,
        correctAnswers: prev.correctAnswers + 1,
        stars: nextStars,
        letterStats: nextStats,
        mistakeCounts: prev.mistakeCounts,
        learnedLetterIds,
        unlockedRewards: unlocked
          ? Array.from(new Set([...prev.unlockedRewards, unlocked.id]))
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

  function setOptionCount(optionCount: OptionCount) {
    if (!supportedOptionCounts.includes(optionCount)) {
      return;
    }
    setProgress((prev) => ({ ...prev, optionCount }));
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
            foxCelebrate={progress.stars >= 20}
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
            onCorrect={markCorrect}
            onMistake={markMistake}
            onSpeak={speak}
            onBack={backHome}
            onLetterMastered={onLetterMastered}
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
      {!activeReward && ["modeSelect", "adventure", "learn", "find", "picture", "listen"].includes(screen) ? (
        <QuickSettings
          optionCount={progress.optionCount}
          availableCounts={supportedOptionCounts}
          onOptionCountChange={setOptionCount}
        />
      ) : null}
      {activeReward ? (
        <RewardScreen
          stars={progress.stars}
          title="Ура! Новая наклейка!"
          rewardName={activeReward.title}
          rewardId={activeReward.id}
          onClose={() => setActiveReward(null)}
        />
      ) : null}
    </div>
  );
}

export default App;
