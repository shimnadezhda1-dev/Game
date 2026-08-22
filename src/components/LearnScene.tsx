import { LetterItem } from "../types";
import { LetterVisual } from "./LetterVisual";

interface LearnSceneProps {
  letter: LetterItem;
}

export function LearnScene({ letter }: LearnSceneProps) {
  return (
    <div className="learn-scene">
      <div className="scene-letter-stack">
        <div className="scene-glyph">{letter.upper}</div>
        <div className="scene-lower">{letter.lower}</div>
      </div>
      <div className="scene-object">
        <LetterVisual letter={letter} size="hero" />
      </div>
    </div>
  );
}
