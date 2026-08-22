import { ReactNode } from "react";
import { Character, FoxMood } from "./Character";
import { SpeakButton } from "./SpeakButton";
import { NextArrowIcon } from "./ToyIcons";
import { WorldBackground } from "./WorldBackground";

interface GameStageProps {
  foxMood?: FoxMood;
  bubble?: string;
  onReplay?: () => void;
  replayKey?: string;
  replayDisabled?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  showNext?: boolean;
  children: ReactNode;
}

export function GameStage({
  foxMood = "happy",
  bubble,
  onReplay,
  replayKey,
  replayDisabled,
  onNext,
  showNext = false,
  children
}: GameStageProps) {
  return (
    <div className="screen game-stage-screen">
      <WorldBackground variant="play" />
      <div className="game-stage">
        <div className="stage-guide">
          <Character mood={foxMood} size="guide" message={bubble} />
        </div>
        {onReplay ? (
          <div className="stage-replay">
            <SpeakButton onClick={onReplay} disabled={replayDisabled} hintKey={replayKey} />
          </div>
        ) : null}
        <div className="stage-main">{children}</div>
        {showNext && onNext ? (
          <button className="nav-arrow nav-next stage-next" onClick={onNext} aria-label="Дальше">
            <NextArrowIcon />
          </button>
        ) : (
          <span className="stage-next-slot" />
        )}
      </div>
    </div>
  );
}
