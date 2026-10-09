import { ruAssetPath } from "./letterFolders";

export type PraisePool = "standard" | "streak" | "recovery" | "retry";
export type AudioStatus = "existing" | "missing";
export type PhrasePace = "short" | "long";

export interface GenderedAudio {
  text: string;
  filename: string;
  path: string;
}

export interface VoicePhrase {
  id: string;
  text: string;
  filename: string;
  /** Canonical future path under common/. Never fetch this when audioStatus is missing. */
  path: string;
  audioStatus: AudioStatus;
  /** Actual bundled Anastasia file, if already in the repo. */
  sourceFile?: string;
  pool: PraisePool;
  pace: PhrasePace;
  /** Feminine spoken form when playerPreference is girl. */
  girl?: GenderedAudio;
}

function common(file: string): string {
  return ruAssetPath(`common/${file}`);
}

function phrase(
  pool: PraisePool,
  index: number,
  text: string,
  pace: PhrasePace,
  existingSource?: string
): VoicePhrase {
  const prefix =
    pool === "standard"
      ? "praise-standard"
      : pool === "streak"
        ? "praise-streak"
        : pool === "recovery"
          ? "praise-recovery"
          : "retry-support";
  const n = String(index).padStart(2, "0");
  const filename = `${prefix}-${n}.mp3`;
  const id = `${prefix.split("-").join("_")}_${n}`;
  const diskFile = existingSource ?? filename;
  return {
    id,
    text,
    filename,
    path: common(diskFile),
    audioStatus: "existing",
    sourceFile: diskFile,
    pool,
    pace
  };
}

function withGirl(base: VoicePhrase, text: string, filename: string): VoicePhrase {
  return {
    ...base,
    girl: {
      text,
      filename,
      path: common(filename)
    }
  };
}

export const PRAISE_STANDARD: readonly VoicePhrase[] = [
  phrase("standard", 1, "Отлично!", "short"),
  phrase("standard", 2, "Верно!", "short", "correct.mp3"),
  phrase("standard", 3, "Замечательно!", "short"),
  phrase("standard", 4, "Молодец!", "short"),
  phrase("standard", 5, "Супер!", "short"),
  phrase("standard", 6, "Здорово!", "short"),
  phrase("standard", 7, "Прекрасно!", "short"),
  phrase("standard", 8, "Вот это да!", "short"),
  phrase("standard", 9, "Так держать!", "short"),
  phrase("standard", 10, "У тебя получилось!", "long"),
  phrase("standard", 11, "Всё правильно!", "short"),
  phrase("standard", 12, "Отличная работа!", "long"),
  phrase("standard", 13, "Очень хорошо!", "short"),
  phrase("standard", 14, "Правильно, молодец!", "long"),
  phrase("standard", 15, "Замечательный ответ!", "long"),
  phrase("standard", 16, "Отлично справляешься!", "long"),
  phrase("standard", 17, "Супер! Продолжаем!", "long"),
  phrase("standard", 18, "Молодец! Идём дальше!", "long", "next.mp3")
];

export const PRAISE_STREAK: readonly VoicePhrase[] = [
  phrase("streak", 1, "У тебя здорово получается!", "long"),
  phrase("streak", 2, "Так держать!", "short"),
  phrase("streak", 3, "Отлично справляешься!", "long"),
  phrase("streak", 4, "Здорово! Продолжай!", "long"),
  phrase("streak", 5, "Вот это да! Сколько правильных ответов!", "long"),
  phrase("streak", 6, "Ты очень внимательно играешь!", "long")
];

export const PRAISE_RECOVERY: readonly VoicePhrase[] = [
  phrase("recovery", 1, "У тебя получилось!", "long"),
  phrase("recovery", 2, "Вот теперь правильно!", "long"),
  withGirl(
    phrase("recovery", 3, "Здорово! Ты справился!", "long"),
    "Здорово! Ты справилась!",
    "praise-recovery-03-girl.mp3"
  ),
  withGirl(
    phrase("recovery", 4, "Отлично! Ты нашёл правильный ответ!", "long"),
    "Отлично! Ты нашла правильный ответ!",
    "praise-recovery-04-girl.mp3"
  ),
  phrase("recovery", 5, "Молодец! Получилось!", "long")
];

export const RETRY_SUPPORT: readonly VoicePhrase[] = [
  phrase("retry", 1, "Почти! Попробуй ещё раз.", "long", "almost.mp3"),
  phrase("retry", 2, "Давай попробуем ещё раз.", "long"),
  phrase("retry", 3, "Посмотри внимательнее.", "short"),
  phrase("retry", 4, "Давай посмотрим внимательнее.", "long", "hint.mp3"),
  phrase("retry", 5, "У тебя получится!", "short"),
  phrase("retry", 6, "Попробуй ещё разок.", "short", "try-again.mp3"),
  phrase("retry", 7, "Подумай ещё немного.", "short"),
  phrase("retry", 8, "Давай найдём правильный ответ.", "long"),
  phrase("retry", 10, "Не спеши, посмотри внимательно.", "long"),
  phrase("retry", 11, "Хорошая попытка! Попробуй ещё раз.", "long"),
  phrase("retry", 12, "Давай попробуем ещё!", "short")
];

/** @deprecated Use the four pool exports. Kept as a combined catalog for inventory. */
export const PRAISE_PHRASES: readonly VoicePhrase[] = [
  ...PRAISE_STANDARD,
  ...PRAISE_STREAK,
  ...PRAISE_RECOVERY
];

export const RETRY_PHRASES: readonly VoicePhrase[] = RETRY_SUPPORT;

export const ALL_VOICE_PHRASES: readonly VoicePhrase[] = [
  ...PRAISE_STANDARD,
  ...PRAISE_STREAK,
  ...PRAISE_RECOVERY,
  ...RETRY_SUPPORT
];

export function isPlayablePhrase(phrase: VoicePhrase): boolean {
  return phrase.audioStatus === "existing";
}

export function missingAnastasiaPhrases(): VoicePhrase[] {
  return ALL_VOICE_PHRASES.filter((phrase) => phrase.audioStatus === "missing");
}

export function girlAudioFiles(): string[] {
  return ALL_VOICE_PHRASES.flatMap((phrase) => (phrase.girl ? [phrase.girl.filename] : []));
}
