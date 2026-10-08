import { assetUrl, ASSETS } from "../utils/assets";
import { useMusicControl } from "./MusicControlContext";

interface MusicToggleButtonProps {
  musicOn?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function MusicToggleButton({
  musicOn,
  className = ""
}: MusicToggleButtonProps) {
  const music = useMusicControl();
  const on = musicOn ?? music.musicOn;

  return (
    <button
      type="button"
      className={`music-toggle ${on ? "" : "is-off"} ${className}`.trim()}
      onClick={() => music.openMusicSettings()}
      aria-label={on ? "Настройки музыки" : "Музыка выключена. Настройки музыки"}
      aria-pressed={on}
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
