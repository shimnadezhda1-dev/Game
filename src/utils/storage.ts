import { GameId, LetterStats, OptionCount, PlayerPreference, ProgressState } from "../types";
import { LETTER_GROUPS } from "../data/letters";
import { isStickerRewardMilestone, stickerMilestonesUpTo } from "../data/rewardCatalog";
import { rewardsUnlockedByStars } from "./rewards";
import {
  validLetterCategory,
  validPlayActivity,
  validStudyOrder
} from "./playSettings";
import { clampLearnAdvanceSeconds, LEARN_ADVANCE_DEFAULT } from "./learnAdvance";
import { emptyActivityProgress, migrateActivityProgress } from "./activityProgress";
import { uniqueIds, uniqueNumbers } from "./stickerLogic";

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
  rewardedThresholds: [],
  unlockedStickerIds: [],
  claimedMilestonesThisCycle: [],
  favoriteStickerId: null,
  completedLettersThisCycle: [],
  completedAlphabetCycles: 0,
  alphabetCycleCompleted: false,
  unlockedAchievements: [],
  soundEnabled: true,
  optionCount: 3,
  playActivity: "learn",
  studyOrder: "alpha",
  letterCategory: "all",
  selectedLetterId: "A",
  playerPreference: null,
  learnAdvanceSeconds: LEARN_ADVANCE_DEFAULT,
  activityProgress: emptyActivityProgress()
};

function validPlayerPreference(value: unknown): value is PlayerPreference {
  return value === "boy" || value === "girl";
}

/** Legacy `surprise` is read but not kept: user must pick boy or girl again. */
function readPlayerPreference(value: unknown): PlayerPreference | null {
  if (validPlayerPreference(value)) {
    return value;
  }
  return null;
}

function validOptionCount(value: unknown): value is OptionCount {
  return value === 3 || value === 5 || value === 7;
}

function validSelectedLetterId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

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

export const STORAGE_KEYS = {
  progress: STORAGE_KEY,
  firstVisit: "happy-alphabet-first-visit-v1",
  music: "happy-alphabet-music-v1"
} as const;

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultProgress;
    }
    const parsed = JSON.parse(raw) as Partial<ProgressState> & {
      screen?: unknown;
      currentLetter?: unknown;
      currentLetterIndex?: unknown;
      selectedLetter?: unknown;
      activeLetter?: unknown;
    };
    const stars = typeof parsed.stars === "number" ? parsed.stars : 0;
    const rewardedThresholds = Array.isArray(parsed.rewardedThresholds)
      ? parsed.rewardedThresholds.filter(
          (threshold): threshold is number =>
            typeof threshold === "number" && isStickerRewardMilestone(threshold)
        )
      : stickerMilestonesUpTo(stars);
    const learned = Array.isArray(parsed.learnedLetterIds) ? parsed.learnedLetterIds : [];
    const inferredGroup = LETTER_GROUPS[0].every((id) => learned.includes(id)) ? 1 : 0;
    const {
      screen: _ignoredScreen,
      currentLetter: _ignoredCurrentLetter,
      currentLetterIndex: _ignoredLetterIndex,
      selectedLetter: _ignoredSelected,
      activeLetter: _ignoredActive,
      ...progressFields
    } = parsed;
    const learnIndex =
      typeof parsed.currentLearnIndex === "number" && parsed.currentLearnIndex >= 0
        ? parsed.currentLearnIndex
        : 0;
    const unlockedFromSave = uniqueIds(
      Array.isArray(parsed.unlockedStickerIds)
        ? parsed.unlockedStickerIds
        : Array.isArray(parsed.unlockedRewards)
          ? parsed.unlockedRewards
          : rewardsUnlockedByStars(stars)
    );
    const claimedMilestonesThisCycle = uniqueNumbers(
      Array.isArray(parsed.claimedMilestonesThisCycle)
        ? parsed.claimedMilestonesThisCycle
        : rewardedThresholds
    ).filter((threshold) => isStickerRewardMilestone(threshold));
    const favoriteRaw =
      typeof parsed.favoriteStickerId === "string" ? parsed.favoriteStickerId : null;
    const favoriteStickerId =
      favoriteRaw && unlockedFromSave.includes(favoriteRaw) ? favoriteRaw : null;
    const completedLettersThisCycle = uniqueIds(
      Array.isArray(parsed.completedLettersThisCycle) ? parsed.completedLettersThisCycle : []
    );
    const completedAlphabetCycles =
      typeof parsed.completedAlphabetCycles === "number" && parsed.completedAlphabetCycles >= 0
        ? Math.floor(parsed.completedAlphabetCycles)
        : 0;
    const alphabetCycleCompleted = parsed.alphabetCycleCompleted === true;
    const unlockedAchievements = uniqueIds(
      Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : []
    );
    return {
      ...defaultProgress,
      ...progressFields,
      stars,
      learnedLetterIds: learned,
      currentLearnIndex: learnIndex,
      unlockedGames: DEFAULT_UNLOCKED,
      mistakeCounts: parsed.mistakeCounts ?? {},
      letterStats: migrateStats(parsed),
      unlockedGroupIndex: parsed.unlockedGroupIndex ?? inferredGroup,
      unlockedRewards: unlockedFromSave,
      rewardedThresholds: claimedMilestonesThisCycle,
      unlockedStickerIds: unlockedFromSave,
      claimedMilestonesThisCycle,
      favoriteStickerId,
      completedLettersThisCycle,
      completedAlphabetCycles,
      alphabetCycleCompleted,
      unlockedAchievements,
      soundEnabled: parsed.soundEnabled !== false,
      optionCount: validOptionCount(parsed.optionCount) ? parsed.optionCount : 3,
      playActivity: validPlayActivity(parsed.playActivity) ? parsed.playActivity : "learn",
      studyOrder: validStudyOrder(parsed.studyOrder) ? parsed.studyOrder : "alpha",
      letterCategory: validLetterCategory(parsed.letterCategory) ? parsed.letterCategory : "all",
      selectedLetterId: validSelectedLetterId(parsed.selectedLetterId)
        ? parsed.selectedLetterId
        : "A",
      playerPreference: readPlayerPreference(parsed.playerPreference),
      learnAdvanceSeconds: clampLearnAdvanceSeconds(parsed.learnAdvanceSeconds),
      activityProgress: migrateActivityProgress({
        parsed,
        playActivity: validPlayActivity(parsed.playActivity) ? parsed.playActivity : "learn",
        selectedLetterId: validSelectedLetterId(parsed.selectedLetterId)
          ? parsed.selectedLetterId
          : "A"
      })
    };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
