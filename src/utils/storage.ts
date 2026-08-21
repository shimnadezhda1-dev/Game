import { GameId, LetterStats, ProgressState } from "../types";
import { LETTER_GROUPS } from "../data/letters";
import { rewardsUnlockedByStars } from "./rewards";

const STORAGE_KEY = "happy-alphabet-progress-v1";

const DEFAULT_UNLOCKED: GameId[] = ["find", "picture", "listen"];

export const defaultProgress: ProgressState = {
  learnedLetterIds: [],
  currentLearnIndex: 0,
  correctAnswers: 0,
  stars: 0,
  unlockedGames: DEFAULT_UNLOCKED,
  mistakeCounts: {},
  letterStats: {},
  unlockedGroupIndex: 0,
  unlockedRewards: [],
  soundEnabled: true
};

function migrateStats(parsed: Partial<ProgressState>): Record<string, LetterStats> {
  if (parsed.letterStats && Object.keys(parsed.letterStats).length) {
    return parsed.letterStats;
  }
  const stats: Record<string, LetterStats> = {};
  Object.entries(parsed.mistakeCounts ?? {}).forEach(([id, wrongCount]) => {
    stats[id] = { correctCount: 0, wrongCount, lastPracticed: 0 };
  });
  return stats;
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultProgress;
    }
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    const stars = typeof parsed.stars === "number" ? parsed.stars : 0;
    const learned = parsed.learnedLetterIds ?? [];
    const inferredGroup = LETTER_GROUPS[0].every((id) => learned.includes(id)) ? 1 : 0;
    return {
      ...defaultProgress,
      ...parsed,
      stars,
      unlockedGames: DEFAULT_UNLOCKED,
      mistakeCounts: parsed.mistakeCounts ?? {},
      letterStats: migrateStats(parsed),
      unlockedGroupIndex: parsed.unlockedGroupIndex ?? inferredGroup,
      unlockedRewards: parsed.unlockedRewards?.length
        ? parsed.unlockedRewards
        : rewardsUnlockedByStars(stars),
      soundEnabled: parsed.soundEnabled !== false
    };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
