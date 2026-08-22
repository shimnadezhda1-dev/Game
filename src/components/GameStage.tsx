import { ReactNode } from "react";
import { Character, FoxMood } from "./Character";
import { SpeakButton } from "./SpeakButton";
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
  onBack,
  onNext,
  showNext = false,
  children
}: GameStageProps) {
  return (
    <div className="screen game-stage-screen">
      <WorldBackground variant="play" />
      <div className="game-stage">
        <div className="stage-guide">
          <Character mood={foxMood} size="hero" message={bubble} />
          {onReplay ? (
            <SpeakButton onClick={onReplay} disabled={replayDisabled} hintKey={replayKey} />
          ) : null}
        </div>
        <div className="stage-main">{children}</div>
        <div className="stage-nav">
          {onBack ? (
            <button className="nav-arrow nav-back" onClick={onBack} aria-label="Назад">
              ←
            </button>
          ) : (
            <span className="nav-spacer" />
          )}
          {showNext && onNext ? (
            <button className="nav-arrow nav-next stage-next" onClick={onNext} aria-label="Дальше">
              →
            </button>
          ) : (
            <span className="nav-spacer" />
          )}
        </div>
      </div>
    </div>
  );
}
