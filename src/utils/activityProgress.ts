import { LetterItem, PlayActivity, ProgressState, StudyOrder } from "../types";
import { PLAY_ACTIVITIES } from "./playSettings";

export type ActivityCursor = { letterId: string | null };

export function emptyActivityProgress(): Record<PlayActivity, ActivityCursor> {
  return {
    learn: { letterId: null },
    find: { letterId: null },
    picture: { letterId: null },
    listen: { letterId: null }
  };
}

function validCursor(value: unknown): value is ActivityCursor {
  if (!value || typeof value !== "object") {
    return false;
  }
  const letterId = (value as ActivityCursor).letterId;
  return letterId === null || (typeof letterId === "string" && letterId.length > 0);
}

export function readActivityProgress(parsed: unknown): Record<PlayActivity, ActivityCursor> {
  const next = emptyActivityProgress();
  if (!parsed || typeof parsed !== "object") {
    return next;
  }
  const source = parsed as Partial<Record<PlayActivity, unknown>>;
  for (const activity of PLAY_ACTIVITIES) {
    if (validCursor(source[activity])) {
      next[activity] = { letterId: source[activity].letterId };
    }
  }
  return next;
}

export function migrateActivityProgress(args: {
  parsed: unknown;
  playActivity: PlayActivity;
  selectedLetterId: string;
}): Record<PlayActivity, ActivityCursor> {
  const fromSave = readActivityProgress(
    args.parsed && typeof args.parsed === "object"
      ? (args.parsed as { activityProgress?: unknown }).activityProgress
      : undefined
  );
  const hasAny = PLAY_ACTIVITIES.some((activity) => fromSave[activity].letterId);
  if (hasAny) {
    return fromSave;
  }
  fromSave[args.playActivity] = { letterId: args.selectedLetterId || "A" };
  return fromSave;
}

export function activityLetterId(
  progress: Pick<ProgressState, "activityProgress">,
  activity: PlayActivity
): string | null {
  return progress.activityProgress[activity]?.letterId ?? null;
}

export function withActivityLetter(
  progress: ProgressState,
  activity: PlayActivity,
  letterId: string | null
): ProgressState {
  if (progress.activityProgress[activity]?.letterId === letterId) {
    return progress;
  }
  return {
    ...progress,
    activityProgress: {
      ...progress.activityProgress,
      [activity]: { letterId }
    }
  };
}

export function resetActivityLetter(
  progress: ProgressState,
  activity: PlayActivity,
  startLetterId: string
): ProgressState {
  return withActivityLetter(progress, activity, startLetterId);
}

export function startLetterIdForActivity(args: {
  studyOrder: StudyOrder;
  pool: readonly LetterItem[];
  pickLetterId?: string;
}): string {
  if (args.studyOrder === "pick" && args.pickLetterId) {
    const picked = args.pool.find((letter) => letter.id === args.pickLetterId);
    if (picked) {
      return picked.id;
    }
  }
  return args.pool[0]?.id ?? "A";
}
