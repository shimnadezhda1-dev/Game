import { audioManager } from "./AudioManager";
import { ruAssetPath } from "./letterFolders";

export const TRIAL_VOICE_CLIPS = {
  nextActivity: {
    text: "Отлично! Теперь попробуем следующее занятие!",
    path: ruAssetPath("common/trial-next-activity.mp3")
  },
  trialFinished: {
    text: "Ура! Пробная часть пройдена! Хочешь продолжить игру? Позови взрослого.",
    path: ruAssetPath("common/trial-finished.mp3")
  },
  lockedFeature: {
    text: "Эта возможность откроется в полной версии. Позови взрослого.",
    path: ruAssetPath("common/trial-locked-feature.mp3")
  }
} as const;

export type TrialVoiceClipId = keyof typeof TRIAL_VOICE_CLIPS;

/** Repeated taps on locked items within this window do not restart the hint. */
export const LOCKED_HINT_COOLDOWN_MS = 4000;

let lockedHintStartedAt = Number.NEGATIVE_INFINITY;

export function speakLockedFeatureHint(now: number = Date.now()): boolean {
  const clip = TRIAL_VOICE_CLIPS.lockedFeature;
  const stillPlaying = audioManager.isVoiceBusy() && audioManager.lastPlayedPath() === clip.path;
  if (stillPlaying || now - lockedHintStartedAt < LOCKED_HINT_COOLDOWN_MS) {
    return false;
  }
  lockedHintStartedAt = now;
  audioManager.playVoice(clip.path);
  return true;
}
