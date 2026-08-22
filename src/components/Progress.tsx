import { ProgressState } from "../types";
import { assetUrl, ASSETS } from "../utils/assets";
import { GoldStarIcon, MusicNoteIcon, SpeakerMuteIcon } from "./ToyIcons";

interface ProgressProps {
  progress: ProgressState;
  onOpenStars: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  musicOn: boolean;
  onHome?: () => void;
  bankPulse?: boolean;
  homeMode?: boolean;
}

export function Progress({
  progress,
  onOpenStars,
  onToggleSound,
  onToggleMusic,
  musicOn,
  onHome,
  bankPulse,
  homeMode = false
}: ProgressProps) {
  return (
    <div className={`top-bar ${homeMode ? "top-bar-home" : ""}`}>
      {onHome ? (
        <button className="icon-round home-btn" onClick={onHome} aria-label="Домой">
          <img src={assetUrl(ASSETS.ui.home)} alt="" draggable={false} />
        </button>
      ) : (
        <span />
      )}
      <div className="top-bar-right">
        {homeMode ? null : (
          <button
            id="star-bank"
            className={`icon-round star-bank ${bankPulse ? "star-bank-pulse" : ""}`}
            onClick={onOpenStars}
            aria-label="Мои награды"
          >
            <GoldStarIcon />
            <span className="star-count">{progress.stars}</span>
          </button>
        )}
        <button
          className={`icon-round music-btn ${musicOn ? "" : "is-off"}`}
          onClick={onToggleMusic}
          aria-label={musicOn ? "Музыка включена" : "Музыка выключена"}
          title="Музыка"
        >
          <MusicNoteIcon />
        </button>
        {homeMode ? null : (
          <button
            className={`icon-round sound-btn ${progress.soundEnabled ? "" : "is-off"}`}
            onClick={onToggleSound}
            aria-label={progress.soundEnabled ? "Звук включён" : "Звук выключен"}
          >
            <SpeakerMuteIcon muted={!progress.soundEnabled} />
          </button>
        )}
      </div>
    </div>
  );
}
