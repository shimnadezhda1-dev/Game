import { ruAssetPath } from "./letterFolders";

export type PhraseGroup = "basic" | "streak" | "recovered";

export interface VoicePhrase {
  id: string;
  text: string;
  path: string;
  /** True when the mp3 is already in the repo (Anastasia). */
  bundled: boolean;
  groups?: PhraseGroup[];
}

function common(file: string): string {
  return ruAssetPath(`common/${file}`);
}

/**
 * Full praise catalog. Only `bundled` clips play until new Anastasia files exist.
 * Do not use browser TTS for missing lines.
 */
export const PRAISE_PHRASES: readonly VoicePhrase[] = [
  { id: "praise-01", text: "Отлично!", path: common("praise-01.mp3"), bundled: false, groups: ["basic"] },
  {
    id: "praise-02",
    text: "Верно!",
    path: common("correct.mp3"),
    bundled: true,
    groups: ["basic"]
  },
  { id: "praise-03", text: "Замечательно!", path: common("praise-03.mp3"), bundled: false, groups: ["basic"] },
  { id: "praise-04", text: "Молодец!", path: common("praise-04.mp3"), bundled: false, groups: ["basic"] },
  { id: "praise-05", text: "Супер!", path: common("praise-05.mp3"), bundled: false, groups: ["basic"] },
  { id: "praise-06", text: "Здорово!", path: common("praise-06.mp3"), bundled: false, groups: ["basic"] },
  { id: "praise-07", text: "Прекрасно!", path: common("praise-07.mp3"), bundled: false, groups: ["basic"] },
  { id: "praise-08", text: "Вот это да!", path: common("praise-08.mp3"), bundled: false, groups: ["basic"] },
  {
    id: "praise-09",
    text: "Так держать!",
    path: common("praise-09.mp3"),
    bundled: false,
    groups: ["streak"]
  },
  {
    id: "praise-10",
    text: "У тебя получилось!",
    path: common("praise-10.mp3"),
    bundled: false,
    groups: ["recovered"]
  },
  {
    id: "praise-11",
    text: "Ты справился!",
    path: common("praise-11.mp3"),
    bundled: false,
    groups: ["recovered"]
  },
  { id: "praise-12", text: "Всё правильно!", path: common("praise-12.mp3"), bundled: false, groups: ["basic"] },
  {
    id: "praise-13",
    text: "Отличная работа!",
    path: common("praise-13.mp3"),
    bundled: false,
    groups: ["streak"]
  },
  {
    id: "praise-14",
    text: "Прекрасная работа!",
    path: common("praise-14.mp3"),
    bundled: false,
    groups: ["streak"]
  },
  {
    id: "praise-15",
    text: "У тебя здорово получается!",
    path: common("praise-15.mp3"),
    bundled: false,
    groups: ["streak"]
  },
  { id: "praise-16", text: "Как здорово!", path: common("praise-16.mp3"), bundled: false, groups: ["basic"] },
  { id: "praise-17", text: "Очень хорошо!", path: common("praise-17.mp3"), bundled: false, groups: ["basic"] },
  {
    id: "praise-18",
    text: "Правильно, молодец!",
    path: common("praise-18.mp3"),
    bundled: false,
    groups: ["basic"]
  },
  {
    id: "praise-19",
    text: "Замечательный ответ!",
    path: common("praise-19.mp3"),
    bundled: false,
    groups: ["basic"]
  },
  {
    id: "praise-20",
    text: "Какой внимательный ответ!",
    path: common("praise-20.mp3"),
    bundled: false,
    groups: ["basic"]
  },
  {
    id: "praise-21",
    text: "Отлично справляешься!",
    path: common("praise-21.mp3"),
    bundled: false,
    groups: ["streak"]
  },
  {
    id: "praise-22",
    text: "Продолжай в том же духе!",
    path: common("praise-22.mp3"),
    bundled: false,
    groups: ["streak"]
  },
  {
    id: "praise-23",
    text: "Супер! Продолжаем!",
    path: common("praise-23.mp3"),
    bundled: false,
    groups: ["streak"]
  },
  {
    id: "praise-24",
    text: "Молодец! Идём дальше!",
    path: common("next.mp3"),
    bundled: true,
    groups: ["basic", "streak"]
  },
  {
    id: "praise-25",
    text: "Отлично! Следующее задание!",
    path: common("praise-25.mp3"),
    bundled: false,
    groups: ["streak"]
  },
  {
    id: "praise-26",
    text: "Здорово! Продолжим!",
    path: common("praise-26.mp3"),
    bundled: false,
    groups: ["streak"]
  },
  {
    id: "praise-27",
    text: "Вот теперь правильно!",
    path: common("praise-27.mp3"),
    bundled: false,
    groups: ["recovered"]
  },
  {
    id: "praise-28",
    text: "Как хорошо получилось!",
    path: common("praise-28.mp3"),
    bundled: false,
    groups: ["recovered"]
  }
];

export const RETRY_PHRASES: readonly VoicePhrase[] = [
  {
    id: "retry-01",
    text: "Почти! Попробуй ещё раз.",
    path: common("almost.mp3"),
    bundled: true
  },
  { id: "retry-02", text: "Давай попробуем ещё раз.", path: common("retry-02.mp3"), bundled: false },
  { id: "retry-03", text: "Посмотри внимательнее.", path: common("retry-03.mp3"), bundled: false },
  {
    id: "retry-04",
    text: "Давай посмотрим внимательнее.",
    path: common("hint.mp3"),
    bundled: true
  },
  { id: "retry-05", text: "У тебя получится!", path: common("retry-05.mp3"), bundled: false },
  {
    id: "retry-06",
    text: "Попробуй ещё разок.",
    path: common("try-again.mp3"),
    bundled: true
  },
  { id: "retry-07", text: "Подумай ещё немного.", path: common("retry-07.mp3"), bundled: false },
  { id: "retry-08", text: "Давай найдём правильный ответ.", path: common("retry-08.mp3"), bundled: false },
  { id: "retry-09", text: "Ещё одна попытка!", path: common("retry-09.mp3"), bundled: false },
  { id: "retry-10", text: "Попробуем вместе ещё раз.", path: common("retry-10.mp3"), bundled: false },
  { id: "retry-11", text: "Не спеши, посмотри внимательно.", path: common("retry-11.mp3"), bundled: false },
  { id: "retry-12", text: "Хорошая попытка! Попробуй ещё раз.", path: common("retry-12.mp3"), bundled: false }
];

export function missingAnastasiaPhrases(): VoicePhrase[] {
  return [...PRAISE_PHRASES, ...RETRY_PHRASES].filter((phrase) => !phrase.bundled);
}
