import { LetterItem } from "../types";
import { letterTone } from "../utils/cardTones";
import { LetterVisual } from "./LetterVisual";

interface LearnSceneProps {
  letter: LetterItem;
}

export function LearnScene({ letter }: LearnSceneProps) {
  return (
    <div className="learn-scene">
      <div className={`scene-glyph ${letterTone(letter.id)}`}>{letter.upper}</div>
      <div className="scene-object">
        <LetterVisual letter={letter} size="hero" />
      </div>
    </div>
  );
}
