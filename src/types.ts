export type GameId = "find" | "picture" | "listen";

export type OptionCount = 3 | 5 | 7;

export type StudyOrder = "alpha" | "random" | "pick";

export type LetterCategory = "all" | "vowels" | "consonants";

export type PlayerPreference = "boy" | "girl";

export type Screen =
  | "home"
  | "modeSelect"
  | "learn"
  | "adventure"
  | "find"
  | "picture"
  | "listen"
  | "stars"
  | "stickers"
  | "meadow"
  | "reward";

export type RoundPhase = "question" | "feedback";

export type EligibleActivity = "learn" | "find" | "picture" | "listen";

export type PlayActivity = EligibleActivity;

export type LetterVoiceKind =
  | "letter"
  | "find"
  | "picture"
  | "correct"
  | "listen"
  | "reward";

export interface LetterAudioClip {
  key: string;
  path: string;
}

export type LetterAudio = Partial<Record<LetterVoiceKind, LetterAudioClip>>;

export interface LetterImages {
  card?: string;
  glyph?: string;
  object?: string;
  findObject?: string;
  picture?: string;
  choice?: string;
}

export interface PictureExample {
  id: string;
  word: string;
  image: string;
  pictureEligible: boolean;
  allowedAsTarget: boolean;
  allowedAsDistractor: boolean;
}

export interface SpecialExample {
  id: string;
  word: string;
  image: string;
  targetLetter: string;
  targetIndex: number;
}

export interface PictureExampleEntry extends PictureExample {
  letterId: string;
  letterUpper: string;
  letterContentReady: boolean;
}

export interface ToyLetterPalette {
  light: string;
  mid: string;
  dark: string;
  shade: string;
}

export interface ToyLetterTheme {
  palette: ToyLetterPalette;
  path?: string;
  fillRule?: "evenodd" | "nonzero";
}

export interface LetterTheme {
  toy?: ToyLetterTheme;
  cardTone?: string;
  findNativeHue?: number;
  listenTone?: string;
}

export interface LetterContent {
  id: string;
  upper: string;
  lower: string;
  word: string;
  needsContent?: boolean;
  contentReady: boolean;
  difficulty: number;
  group: number;
  eligibleActivities?: EligibleActivity[];
  images?: LetterImages;
  pictureExamples?: PictureExample[];
  specialExamples?: SpecialExample[];
  audio?: LetterAudio;
  theme?: LetterTheme;
  pronunciation?: string;
}

export interface LetterItem extends LetterContent {
  imagePath: string;
  letterImage?: string;
  objectImage?: string;
  findObjectImage?: string;
  pictureImage?: string;
  choiceImage?: string;
  voiceText: string;
  successText?: string;
}

export interface LetterStats {
  correctCount: number;
  wrongCount: number;
  lastPracticed: number;
}

export type MeadowLayoutKind = "desktop" | "mobile";

export type MeadowTheme = "day" | "night";

export interface FavoriteStickerPosition {
  /** Center X in the sticker playground, 0 = left, 1 = right. */
  x: number;
  /** Center Y in the sticker playground, 0 = top, 1 = bottom. */
  y: number;
  z: number;
  /** Missing or "meadow" = legacy lower meadow coords; "scene" = full playground. */
  space?: "meadow" | "scene";
  /** Missing or "manual" = child-placed, never auto-reflowed. */
  source?: "auto" | "manual";
}

export interface FavoriteStickerLayouts {
  desktop: Record<string, FavoriteStickerPosition>;
  mobile: Record<string, FavoriteStickerPosition>;
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
  rewardedThresholds: number[];
  unlockedStickerIds: string[];
  claimedMilestonesThisCycle: number[];
  favoriteStickerId: string | null;
  favoriteStickerIds: string[];
  favoriteStickerPositions: Record<string, FavoriteStickerPosition>;
  favoriteStickerLayouts: FavoriteStickerLayouts;
  meadowTheme: MeadowTheme;
  /** Full day/night meadow tutorial finished (sun → night → moon → day). */
  meadowDayNightTutorialSeen: boolean;
  /** Child already reached night during the tutorial (wow + moon hint). */
  meadowDayNightNightUnlocked: boolean;
  /** First sun hint already played at least once (use short reminder next time). */
  meadowDayNightSunHintHeard: boolean;
  completedLettersThisCycle: string[];
  completedAlphabetCycles: number;
  alphabetCycleCompleted: boolean;
  unlockedAchievements: string[];
  soundEnabled: boolean;
  optionCount: OptionCount;
  playActivity: PlayActivity;
  studyOrder: StudyOrder;
  letterCategory: LetterCategory;
  selectedLetterId: string;
  playerPreference: PlayerPreference | null;
  learnAdvanceSeconds: number;
  activityProgress: Record<PlayActivity, { letterId: string | null }>;
}
