import { ProgressState } from "../types";

interface ProgressProps {
  progress: ProgressState;
  onOpenStars: () => void;
  onToggleSound: () => void;
  onHome?: () => void;
  bankPulse?: boolean;
}

export function Progress({ progress, onOpenStars, onToggleSound, onHome, bankPulse }: ProgressProps) {
  return (
    <div className="top-bar">
      {onHome ? (
        <button className="pill-btn home-btn" onClick={onHome} aria-label="Домой">
          ⌂ Домой
        </button>
      ) : (
        <span />
      )}
      <div className="top-bar-right">
        <button
          id="star-bank"
          className={`pill-btn star-bank ${bankPulse ? "star-bank-pulse" : ""}`}
          onClick={onOpenStars}
        >
          ★ {progress.stars}
        </button>
        <button className="pill-btn" onClick={onToggleSound}>
          {progress.soundEnabled ? "🔊" : "🔇"}
        </button>
      </div>
    </div>
  );
}
