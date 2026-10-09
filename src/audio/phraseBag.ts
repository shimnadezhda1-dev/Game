import type { PlayerPreference } from "../types";
import {
  PRAISE_RECOVERY,
  PRAISE_STANDARD,
  PRAISE_STREAK,
  RETRY_SUPPORT,
  isPlayablePhrase,
  type PraisePool,
  type VoicePhrase
} from "./voicePhrases";

export interface VoiceLine {
  id: string;
  text: string;
  path: string;
  pool: PraisePool;
  filename: string;
  audioStatus: "existing" | "missing";
}

export const STREAK_MIN = 3;
export const STREAK_GAP = 4;
export const RECENT_MAX = 5;

let correctStreak = 0;
let hadMistakeInCurrentQuestion = false;
let lastStreakAt = -999;
let lastPlayedId = "";
let lastPlayedPath = "";
let lastPaceLong = false;
let playerPreference: PlayerPreference | null = null;

function shuffle<T>(items: T[]): T[] {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = next[i];
    next[i] = next[j];
    next[j] = temp;
  }
  return next;
}

class ShuffleBag {
  private readonly all: readonly VoicePhrase[];
  private order: VoicePhrase[] = [];
  private recent: string[] = [];

  constructor(phrases: readonly VoicePhrase[]) {
    this.all = phrases;
    this.refill(phrases.slice());
  }

  private recentLimit(poolSize: number): number {
    return Math.min(RECENT_MAX, Math.max(1, poolSize - 1));
  }

  private refill(pool: VoicePhrase[]): void {
    this.order = shuffle(pool);
  }

  next(preferShort = false): VoicePhrase {
    const pool = this.all.slice();
    if (!pool.length) {
      throw new Error("empty phrase pool");
    }
    const limit = this.recentLimit(pool.length);
    const avoid = new Set(this.recent.slice(-limit));
    if (lastPlayedId) {
      avoid.add(lastPlayedId);
    }
    let candidates = pool.filter((phrase) => !avoid.has(phrase.id));
    if (!candidates.length) {
      candidates = pool.filter((phrase) => phrase.id !== lastPlayedId);
    }
    if (!candidates.length) {
      candidates = pool.slice();
    }
    if (preferShort) {
      const shortOnes = candidates.filter((phrase) => phrase.pace === "short");
      if (shortOnes.length) {
        candidates = shortOnes;
      }
    }

    if (!this.order.length) {
      this.refill(candidates);
    }

    let index = this.order.findIndex((phrase) => candidates.includes(phrase));
    if (index < 0) {
      this.refill(candidates);
      index = 0;
    }
    const chosen = this.order.splice(index, 1)[0] ?? candidates[0];
    this.recent.push(chosen.id);
    if (this.recent.length > 8) {
      this.recent.shift();
    }
    return chosen;
  }
}

const standardBag = new ShuffleBag(PRAISE_STANDARD);
const streakBag = new ShuffleBag(PRAISE_STREAK);
const recoveryBag = new ShuffleBag(PRAISE_RECOVERY);
const retryBag = new ShuffleBag(RETRY_SUPPORT);
const praiseFallbackBag = new ShuffleBag(PRAISE_STANDARD.filter(isPlayablePhrase));
const retryFallbackBag = new ShuffleBag(RETRY_SUPPORT.filter(isPlayablePhrase));

function fallbackPhrase(kind: "praise" | "retry"): VoicePhrase {
  const bag = kind === "retry" ? retryFallbackBag : praiseFallbackBag;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const next = bag.next();
    if (next.path !== lastPlayedPath || attempt === 5) {
      return next;
    }
  }
  return (kind === "retry" ? RETRY_SUPPORT : PRAISE_STANDARD).find(isPlayablePhrase)!;
}

function resolvePlayable(phrase: VoicePhrase, kind: "praise" | "retry"): VoicePhrase {
  if (isPlayablePhrase(phrase) && phrase.path !== lastPlayedPath) {
    return phrase;
  }
  if (isPlayablePhrase(phrase) && kind === "retry") {
    const other = RETRY_SUPPORT.find(
      (item) => isPlayablePhrase(item) && item.path !== lastPlayedPath
    );
    return other ?? phrase;
  }
  if (isPlayablePhrase(phrase)) {
    const other = PRAISE_STANDARD.find(
      (item) => isPlayablePhrase(item) && item.path !== lastPlayedPath
    );
    return other ?? phrase;
  }
  return fallbackPhrase(kind);
}

export function setPraisePlayerPreference(value: PlayerPreference | null): void {
  playerPreference = value;
}

export function resolvePhraseForPlayer(
  phrase: VoicePhrase,
  preference: PlayerPreference | null = playerPreference
): VoicePhrase {
  if (preference === "girl" && phrase.girl) {
    return {
      ...phrase,
      text: phrase.girl.text,
      filename: phrase.girl.filename,
      path: phrase.girl.path,
      sourceFile: phrase.girl.filename
    };
  }
  return phrase;
}

function toLine(logical: VoicePhrase, playable: VoicePhrase): VoiceLine {
  lastPlayedId = logical.id;
  lastPlayedPath = playable.path;
  lastPaceLong = logical.pace === "long";
  return {
    id: logical.id,
    text: logical.text,
    path: playable.path,
    pool: logical.pool,
    filename: logical.filename,
    audioStatus: logical.audioStatus
  };
}

function shouldUseStreak(): boolean {
  if (correctStreak < STREAK_MIN) {
    return false;
  }
  return correctStreak - lastStreakAt >= STREAK_GAP;
}

export function noteWrongAnswer(): void {
  hadMistakeInCurrentQuestion = true;
  correctStreak = 0;
}

export function noteNewQuestion(): void {
  hadMistakeInCurrentQuestion = false;
}

export function resetPraiseSession(): void {
  correctStreak = 0;
  hadMistakeInCurrentQuestion = false;
  lastStreakAt = -999;
  lastPlayedId = "";
  lastPlayedPath = "";
  lastPaceLong = false;
}

export function getCorrectStreak(): number {
  return correctStreak;
}

export function takePraiseLine(recovered = hadMistakeInCurrentQuestion): VoiceLine {
  if (recovered) {
    hadMistakeInCurrentQuestion = false;
    correctStreak = 1;
    const logical = resolvePhraseForPlayer(recoveryBag.next(lastPaceLong));
    return toLine(logical, resolvePlayable(logical, "praise"));
  }
  correctStreak += 1;
  hadMistakeInCurrentQuestion = false;
  if (shouldUseStreak()) {
    lastStreakAt = correctStreak;
    const logical = resolvePhraseForPlayer(streakBag.next(lastPaceLong));
    return toLine(logical, resolvePlayable(logical, "praise"));
  }
  const logical = resolvePhraseForPlayer(standardBag.next(lastPaceLong));
  return toLine(logical, resolvePlayable(logical, "praise"));
}

export function takeRetryLine(): VoiceLine {
  const logical = resolvePhraseForPlayer(retryBag.next(lastPaceLong));
  return toLine(logical, resolvePlayable(logical, "retry"));
}
