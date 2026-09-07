import { assetUrl, ASSETS } from "../utils/assets";

interface MusicToggleButtonProps {
  musicOn: boolean;
  onToggle: () => void;
  className?: string;
}

export function MusicToggleButton({
  musicOn,
  onToggle,
  className = ""
}: MusicToggleButtonProps) {
  return (
    <button
      type="button"
      className={`music-toggle ${musicOn ? "" : "is-off"} ${className}`.trim()}
      onClick={onToggle}
      aria-label={musicOn ? "Музыка включена" : "Музыка выключена"}
      aria-pressed={musicOn}
      title="Музыка"
    >
      <img
        src={assetUrl(ASSETS.ui.musicButton)}
        alt=""
        draggable={false}
      />
    </button>
  );
}
