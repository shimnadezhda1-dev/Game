import { ProgressState } from "../types";
import { assetUrl, ASSETS } from "../utils/assets";

interface ProgressProps {
  progress: ProgressState;
  onOpenStars: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  musicOn: boolean;
  onHome?: () => void;
  bankPulse?: boolean;
}

export function Progress({
  progress,
  onOpenStars,
  onToggleSound,
  onToggleMusic,
  musicOn,
  onHome,
  bankPulse
}: ProgressProps) {
  return (
    <div className="top-bar">
      {onHome ? (
        <button className="icon-round home-btn" onClick={onHome} aria-label="Домой">
          <img src={assetUrl(ASSETS.ui.home)} alt="" draggable={false} />
        </button>
      ) : (
        <span />
      )}
      <div className="top-bar-right">
        <button
          id="star-bank"
          className={`icon-round star-bank ${bankPulse ? "star-bank-pulse" : ""}`}
          onClick={onOpenStars}
          aria-label="Мои награды"
        >
          <img src={assetUrl(ASSETS.ui.rewards)} alt="" draggable={false} />
          <span className="star-count">{progress.stars}</span>
        </button>
        <button
          className={`icon-round music-btn ${musicOn ? "" : "is-off"}`}
          onClick={onToggleMusic}
          aria-label={musicOn ? "Музыка включена" : "Музыка выключена"}
          title="Музыка"
        >
          {musicOn ? "♪" : "♩"}
        </button>
        <button
          className="icon-round sound-btn"
          onClick={onToggleSound}
          aria-label={progress.soundEnabled ? "Звук включён" : "Звук выключен"}
        >
          {progress.soundEnabled ? "🔊" : "🔇"}
        </button>
      </div>
    </div>
  );
}
