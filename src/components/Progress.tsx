import { ProgressState } from "../types";

interface ProgressProps {
  progress: ProgressState;
  onOpenStars: () => void;
  onToggleSound: () => void;
}

export function Progress({ progress, onOpenStars, onToggleSound }: ProgressProps) {
  return (
    <div className="top-bar">
      <button className="pill-btn" onClick={onOpenStars}>
        ⭐ {progress.stars}
      </button>
      <div className="pill-label">✅ {progress.correctAnswers}</div>
      <button className="pill-btn" onClick={onToggleSound}>
        {progress.soundEnabled ? "🔊" : "🔇"}
      </button>
    </div>
  );
}
