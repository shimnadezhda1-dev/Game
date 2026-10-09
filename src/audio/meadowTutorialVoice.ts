import { ruAssetPath } from "./letterFolders";

export const MEADOW_TUTORIAL_CLIPS = {
  nightHint: {
    text: "Хочешь увидеть волшебную ночь? Нажми на солнышко!",
    path: ruAssetPath("common/meadow-night-hint.mp3")
  },
  nightReminder: {
    text: "Нажми на солнышко — и увидишь ночь!",
    path: ruAssetPath("common/meadow-night-reminder.mp3")
  },
  nightWow: {
    text: "Ух ты! Наступила ночь! Посмотри, как светятся твои наклейки!",
    path: ruAssetPath("common/meadow-night-wow.mp3")
  },
  dayHint: {
    text: "Чтобы вернуть день, нажми на луну!",
    path: ruAssetPath("common/meadow-day-hint.mp3")
  }
} as const;

export type MeadowTutorialClipId = keyof typeof MEADOW_TUTORIAL_CLIPS;
