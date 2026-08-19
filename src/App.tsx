import { useCallback, useEffect, useMemo, useState } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { LearnLetters } from "./components/LearnLetters";
import { FindLetterGame } from "./components/FindLetterGame";
import { PictureLetterGame } from "./components/PictureLetterGame";
import { ListenAndChooseGame } from "./components/ListenAndChooseGame";
import { MatchGame } from "./components/MatchGame";
import { Progress } from "./components/Progress";
import { RewardScreen } from "./components/RewardScreen";
import { GameHubScreen } from "./components/GameHubScreen";
import { LETTERS } from "./data/letters";
import { audioManager } from "./audio/AudioManager";
import { GameId, ProgressState, Screen } from "./types";
import { loadProgress, saveProgress } from "./utils/storage";
import { preloadImages } from "./utils/preload";
import { assetUrl } from "./utils/assets";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());

  useEffect(() => {
    audioManager.setEnabled(progress.soundEnabled);
    preloadImages(
      LETTERS.map((letter) => letter.imagePath)
        .filter(Boolean)
        .map((path) => assetUrl(path as string))
    );
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const learnLetter = useMemo(() => LETTERS[progress.currentLearnIndex % LETTERS.length], [progress]);

  const speak = useCallback((text: string) => {
    audioManager.speak(text);
  }, []);

  function unlockGames(correctAnswers: number): GameId[] {
    const unlocked: GameId[] = ["find"];
    if (correctAnswers >= 3) unlocked.push("picture");
    if (correctAnswers >= 6) unlocked.push("listen");
    if (correctAnswers >= 10) unlocked.push("match");
    return unlocked;
  }

  function markCorrect(letterId: string) {
    setProgress((prev) => {
      const nextCorrect = prev.correctAnswers + 1;
      const nextStars = prev.stars + 1;
      const learnedLetterIds = letterId
        ? Array.from(new Set([...prev.learnedLetterIds, letterId]))
        : prev.learnedLetterIds;
      const next = {
        ...prev,
        correctAnswers: nextCorrect,
        stars: nextStars,
        unlockedGames: unlockGames(nextCorrect),
        learnedLetterIds
      };
      if (nextCorrect % 5 === 0) {
        setScreen("reward");
        speak("Ура! Ты заработал новую звёздочку!");
      }
      return next;
    });
  }

  function markMistake(letterId: string) {
    setProgress((prev) => ({
      ...prev,
      mistakeCounts: {
        ...prev.mistakeCounts,
        [letterId]: (prev.mistakeCounts[letterId] ?? 0) + 1
      }
    }));
  }

  function nextLearnLetter() {
    setProgress((prev) => {
      const nextIndex = (prev.currentLearnIndex + 1) % LETTERS.length;
      const learnedId = LETTERS[prev.currentLearnIndex]?.id;
      return {
        ...prev,
        currentLearnIndex: nextIndex,
        learnedLetterIds: learnedId
          ? Array.from(new Set([...prev.learnedLetterIds, learnedId]))
          : prev.learnedLetterIds
      };
    });
  }

  function openGame(game: GameId) {
    if (!progress.unlockedGames.includes(game)) {
      speak("Скоро откроется!");
      return;
    }
    setScreen(game);
  }

  function toggleSound() {
    setProgress((prev) => {
      const soundEnabled = !prev.soundEnabled;
      audioManager.setEnabled(soundEnabled);
      return { ...prev, soundEnabled };
    });
  }

  if (screen === "reward") {
    return <RewardScreen stars={progress.stars} onClose={() => setScreen("home")} />;
  }

  return (
    <div className="app-shell">
      <Progress progress={progress} onOpenStars={() => setScreen("stars")} onToggleSound={toggleSound} />
      {screen === "home" ? (
        <HomeScreen
          onGoLearn={() => setScreen("learn")}
          onPlayGames={() => setScreen("games")}
          onOpenStars={() => setScreen("stars")}
        />
      ) : null}
      {screen === "games" ? (
        <GameHubScreen
          unlockedGames={progress.unlockedGames}
          onOpenGame={openGame}
          onBack={() => setScreen("home")}
        />
      ) : null}
      {screen === "learn" ? (
        <LearnLetters
          letter={learnLetter}
          onNext={nextLearnLetter}
          onBack={() => setScreen("home")}
          onSpeak={speak}
        />
      ) : null}
      {screen === "find" ? (
        <FindLetterGame
          letters={LETTERS}
          mistakes={progress.mistakeCounts}
          onCorrect={markCorrect}
          onMistake={markMistake}
          onSpeak={speak}
          onBack={() => setScreen("home")}
        />
      ) : null}
      {screen === "picture" ? (
        <PictureLetterGame
          letters={LETTERS}
          mistakes={progress.mistakeCounts}
          onCorrect={markCorrect}
          onMistake={markMistake}
          onSpeak={speak}
          onBack={() => setScreen("home")}
        />
      ) : null}
      {screen === "listen" ? (
        <ListenAndChooseGame
          letters={LETTERS}
          mistakes={progress.mistakeCounts}
          onCorrect={markCorrect}
          onMistake={markMistake}
          onSpeak={speak}
          onBack={() => setScreen("home")}
        />
      ) : null}
      {screen === "match" ? (
        <MatchGame
          letters={LETTERS}
          mistakes={progress.mistakeCounts}
          onCorrect={markCorrect}
          onMistake={markMistake}
          onSpeak={speak}
          onBack={() => setScreen("home")}
        />
      ) : null}
      {screen === "stars" ? (
        <div className="screen">
          <div className="title">Мои звёздочки</div>
          <div className="stars-big">{progress.stars}</div>
          <div className="reward-text">Учено букв: {progress.learnedLetterIds.length}</div>
          <button className="play-btn" onClick={() => setScreen("home")}>
            Домой
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default App;
