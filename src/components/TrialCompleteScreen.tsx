import { useEffect } from "react";
import { audioManager } from "../audio/AudioManager";
import { TRIAL_VOICE_CLIPS } from "../audio/trialVoice";
import { PlayActivity } from "../types";
import { Character } from "./Character";
import { WorldBackground } from "./WorldBackground";

export const TRIAL_COMPLETE_TITLES: Record<PlayActivity, string> = {
  learn: "Ура! Первые 5 букв уже знакомы!",
  find: "Отлично! Все 5 букв найдены!",
  picture: "Здорово! Все задания с картинками пройдены!",
  listen: "Ура! Пробная часть пройдена!"
};

interface TrialCompleteScreenProps {
  activity: PlayActivity;
  /** Present only when a next activity exists; the last one ends the trial. */
  onNext?: () => void;
  onRepeat: () => void;
  onHome: () => void;
  onCallAdult: () => void;
}

export function TrialCompleteScreen({
  activity,
  onNext,
  onRepeat,
  onHome,
  onCallAdult
}: TrialCompleteScreenProps) {
  const isFinal = !onNext;

  useEffect(() => {
    const clip = isFinal ? TRIAL_VOICE_CLIPS.trialFinished : TRIAL_VOICE_CLIPS.nextActivity;
    audioManager.playVoice(clip.path);
  }, [activity, isFinal]);

  return (
    <div
      className={`screen alphabet-complete trial-complete${isFinal ? " trial-complete--final" : ""}`}
      role="dialog"
      aria-modal="true"
    >
      <WorldBackground variant="play" />
      <div className="confetti-layer reward-confetti" aria-hidden>
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index} className={`confetti-bit bit-${index % 6}`} />
        ))}
      </div>
      <Character mood="celebrate" size="hero" />
      <section className="alphabet-complete__card trial-complete__card">
        <h1>{TRIAL_COMPLETE_TITLES[activity]}</h1>
        <div className="trial-complete__actions">
          {onNext ? (
            <button type="button" className="alphabet-complete__start trial-complete__next" onClick={onNext}>
              <span className="trial-complete__next-label">СЛЕДУЮЩЕЕ ЗАНЯТИЕ</span>
              <span className="trial-complete__next-arrow" aria-hidden="true">
                ➜
              </span>
            </button>
          ) : null}
          <div className="trial-complete__row">
            <button type="button" className="trial-complete__secondary" onClick={onRepeat}>
              <span aria-hidden="true">↻ </span>ПОВТОРИТЬ
            </button>
            <button type="button" className="trial-complete__secondary" onClick={onHome}>
              <span aria-hidden="true">🏠 </span>НА ГЛАВНУЮ
            </button>
          </div>
          {isFinal ? (
            <button
              type="button"
              className="trial-complete__adult"
              onClick={() => {
                audioManager.stopSpeaking();
                onCallAdult();
              }}
            >
              <span className="trial-complete__adult-icon" aria-hidden="true">
                👪
              </span>
              ПОЗВАТЬ ВЗРОСЛОГО
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
