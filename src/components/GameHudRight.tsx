import { ReactNode } from "react";
import { GoldStar } from "./GoldStar";
import { MusicToggleButton } from "./MusicToggleButton";
import { useMusicControl } from "./MusicControlContext";

interface GameHudRightProps {
  stars: number;
  children?: ReactNode;
}

export function GameHudRight({ stars, children }: GameHudRightProps) {
  const { musicOn, onToggleMusic } = useMusicControl();

  return (
    <div className="learn-hud-right">
      <div className="learn-hud-pair">
        <MusicToggleButton musicOn={musicOn} onToggle={onToggleMusic} />
        <div className="learn-stars" aria-label={`Звёзды: ${stars}`}>
          <GoldStar size="tiny" />
          <span>{stars}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
