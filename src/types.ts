export type GameId = "find" | "picture" | "listen";

export type Screen =
  | "home"
  | "modeSelect"
  | "learn"
  | "adventure"
  | "find"
  | "picture"
  | "listen"
  | "stars"
  | "reward";

export type RoundPhase = "question" | "feedback";

export interface LetterItem {
  id: string;
  upper: string;
  lower: string;
  word: string;
  imagePath: string;
  voiceText: string;
  difficulty: number;
  group: number;
}

export interface LetterStats {
  correctCount: number;
  wrongCount: number;
  lastPracticed: number;
}

export interface ProgressState {
  learnedLetterIds: string[];
  currentLearnIndex: number;
  correctAnswers: number;
  stars: number;
  unlockedGames: GameId[];
  mistakeCounts: Record<string, number>;
  letterStats: Record<string, LetterStats>;
  unlockedGroupIndex: number;
  unlockedRewards: string[];
  soundEnabled: boolean;
}
