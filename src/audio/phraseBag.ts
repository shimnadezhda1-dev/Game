import {
  PRAISE_PHRASES,
  RETRY_PHRASES,
  type PhraseGroup,
  type VoicePhrase
} from "./voicePhrases";

export interface VoiceLine {
  id: string;
  text: string;
  path: string;
}

let consecutiveCorrect = 0;
let recoveredPending = false;

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
    this.refill(phrases.filter(isPlayable));
  }

  private recentLimit(poolSize: number): number {
    return Math.min(5, Math.max(1, poolSize - 1));
  }

  private refill(pool: VoicePhrase[]): void {
    this.order = shuffle(pool);
  }

  next(prefer?: (phrase: VoicePhrase) => boolean): VoicePhrase {
    const playable = this.all.filter(isPlayable);
    const preferred = prefer ? playable.filter(prefer) : playable;
    const pool = preferred.length ? preferred : playable;
    if (!pool.length) {
      return this.all[0];
    }
    const limit = this.recentLimit(pool.length);
    const avoid = new Set(this.recent.slice(-limit));
    const fresh = pool.filter((phrase) => !avoid.has(phrase.id));
    const candidates = fresh.length ? fresh : pool;

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

function isPlayable(phrase: VoicePhrase): boolean {
  return phrase.bundled;
}

const praiseBag = new ShuffleBag(PRAISE_PHRASES);
const retryBag = new ShuffleBag(RETRY_PHRASES);

export function noteCorrectAnswer(recovered: boolean): void {
  recoveredPending = recovered;
  consecutiveCorrect += 1;
}

export function noteWrongAnswer(): void {
  consecutiveCorrect = 0;
  recoveredPending = false;
}

export function currentPraiseGroup(): PhraseGroup {
  if (recoveredPending) {
    return "recovered";
  }
  if (consecutiveCorrect >= 3) {
    return "streak";
  }
  return "basic";
}

function toLine(phrase: VoicePhrase): VoiceLine {
  return { id: phrase.id, text: phrase.text, path: phrase.path };
}

export function takePraiseLine(): VoiceLine {
  const group = currentPraiseGroup();
  return toLine(praiseBag.next((phrase) => (phrase.groups ?? ["basic"]).includes(group)));
}

export function takeRetryLine(): VoiceLine {
  return toLine(retryBag.next());
}

