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
import { LETTERS } from "./data/letters";
import { audioManager } from "./audio/AudioManager";
import { backgroundMusic } from "./audio/BackgroundMusicManager";
import { ProgressState, Screen } from "./types";
import { loadProgress, saveProgress } from "./utils/storage";
import { preloadImages } from "./utils/preload";
import { assetUrl, ASSETS } from "./utils/assets";
import type { Point } from "./utils/point";
import {
  getLetterStats,
  maybeUnlockNextGroup,
  unlockedLetters
} from "./utils/selectors";
import { rewardJustUnlocked, StarReward } from "./utils/rewards";

interface Flight {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [returnScreen, setReturnScreen] = useState<Screen>("home");
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const [musicOn, setMusicOn] = useState(() => backgroundMusic.isEnabled());
  const [flight, setFlight] = useState<Flight | null>(null);
  const [bankPulse, setBankPulse] = useState(false);
  const [rewardCopy, setRewardCopy] = useState({ title: "УРА!", text: "Ты заработал звёздочку!" });
  const pendingRewardRef = useRef<StarReward | null>(null);
  const starTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return backgroundMusic.subscribe(() => setMusicOn(backgroundMusic.isEnabled()));
  }, []);

  const playLetters = useMemo(
    () => LETTERS.filter((letter) => letter.group <= progress.unlockedGroupIndex),
    [progress.unlockedGroupIndex]
  );
  const learnLetter =
    playLetters[progress.currentLearnIndex % playLetters.length] ?? playLetters[0] ?? LETTERS[0];

  useEffect(() => {
    audioManager.setEnabled(progress.soundEnabled);
    preloadImages([
      ...LETTERS.map((letter) => assetUrl(letter.imagePath)),
      assetUrl(ASSETS.fox.idle),
      assetUrl(ASSETS.fox.happy),
      assetUrl(ASSETS.fox.tip),
      assetUrl(ASSETS.fox.celebrate),
      assetUrl(ASSETS.ui.cubes),
      assetUrl(ASSETS.ui.play),
      assetUrl(ASSETS.ui.stars),
      assetUrl(ASSETS.ui.rewards),
      assetUrl(ASSETS.ui.home)
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

  function startAdventure() {
    backgroundMusic.startFromGesture();
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
      const unlocked = rewardJustUnlocked(prev.stars, nextStars);
      if (unlocked) {
        pendingRewardRef.current = unlocked;
      }
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
      const pending = pendingRewardRef.current;
      if (pending) {
        speak(`Ура! Ты открыл ${pending.title}!`);
      }
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
    backgroundMusic.toggle();
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

  function celebrateIfNeeded(fallback: Screen) {
    const pending = pendingRewardRef.current;
    if (pending) {
      pendingRewardRef.current = null;
      setRewardCopy({
        title: pending.title,
        text: `Новая награда: ${pending.hint}!`
      });
      setReturnScreen(fallback);
      go("reward");
      speak(`Ура! Ты открыл ${pending.title}!`);
      return;
    }
    go(fallback);
  }

  const backToHub = () => celebrateIfNeeded("modeSelect");
  const backHome = () => celebrateIfNeeded("home");

  function renderScreen() {
    switch (screen) {
      case "home":
        return (
          <HomeScreen
            onGoLearn={() => go("learn")}
            onPlayGames={startAdventure}
            onOpenStars={() => go("stars")}
            onSpeak={speak}
            foxCelebrate={progress.stars >= 20}
          />
        );
      case "modeSelect":
      case "adventure":
        return (
          <AdventurePlay
            letters={LETTERS}
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
            stats={progress.letterStats}
            trailStep={progress.stars % 5}
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
            stats={progress.letterStats}
            trailStep={progress.stars % 5}
            onCorrect={markCorrect}
            onMistake={markMistake}
            onSpeak={speak}
            onBack={backToHub}
          />
        );
      case "stars":
        return (
          <StarsScreen progress={progress} letters={LETTERS} onBack={backHome} onSpeak={speak} />
        );
      case "reward":
        return (
          <RewardScreen
            stars={progress.stars}
            title={rewardCopy.title}
            text={rewardCopy.text}
            onClose={() => go(returnScreen === "reward" ? "home" : returnScreen)}
          />
        );
      default:
        return (
          <HomeScreen
            onGoLearn={() => go("learn")}
            onPlayGames={startAdventure}
            onOpenStars={() => go("stars")}
            onSpeak={speak}
          />
        );
    }
  }

  return (
    <div
      className={`app-shell ${
        screen === "stars" ? "" : "home-fit"
      }`}
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
    </div>
  );
}

export default App;
