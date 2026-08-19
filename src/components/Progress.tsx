import { ProgressState } from "../types";

interface ProgressProps {
  progress: ProgressState;
  onOpenStars: () => void;
  onToggleSound: () => void;
  bankPulse?: boolean;
}

export function Progress({ progress, onOpenStars, onToggleSound, bankPulse }: ProgressProps) {
  return (
    <div className="top-bar">
      <button
        id="star-bank"
        className={`pill-btn star-bank ${bankPulse ? "star-bank-pulse" : ""}`}
        onClick={onOpenStars}
      >
        ★ {progress.stars}
      </button>
      <div className="pill-label">✔ {progress.correctAnswers}</div>
      <button className="pill-btn" onClick={onToggleSound}>
        {progress.soundEnabled ? "🔊" : "🔇"}
      </button>
    </div>
  );
}
