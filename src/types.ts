export type GameId = "find" | "picture" | "listen" | "match";

export type Screen =
  | "home"
  | "games"
  | "learn"
  | "find"
  | "picture"
  | "listen"
  | "match"
  | "stars"
  | "reward";

export interface LetterItem {
  id: string;
  upper: string;
  lower: string;
  word: string;
  imagePath: string;
  voiceText: string;
  difficulty: number;
}

export interface ProgressState {
  learnedLetterIds: string[];
  currentLearnIndex: number;
  correctAnswers: number;
  stars: number;
  unlockedGames: GameId[];
  mistakeCounts: Record<string, number>;
  soundEnabled: boolean;
}
