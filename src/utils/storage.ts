import { GameId, ProgressState } from "../types";

const STORAGE_KEY = "happy-alphabet-progress-v1";

const DEFAULT_UNLOCKED: GameId[] = ["find"];

export const defaultProgress: ProgressState = {
  learnedLetterIds: [],
  currentLearnIndex: 0,
  correctAnswers: 0,
  stars: 0,
  unlockedGames: DEFAULT_UNLOCKED,
  mistakeCounts: {},
  soundEnabled: true
};

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultProgress;
    }
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      ...defaultProgress,
      ...parsed,
      unlockedGames: parsed.unlockedGames?.length ? parsed.unlockedGames : DEFAULT_UNLOCKED,
      mistakeCounts: parsed.mistakeCounts ?? {}
    };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
