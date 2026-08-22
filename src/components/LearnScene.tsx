import { LetterItem } from "../types";
import { LetterVisual } from "./LetterVisual";
import { ToyLetter } from "./ToyLetter";

interface LearnSceneProps {
  letter: LetterItem;
}

export function LearnScene({ letter }: LearnSceneProps) {
  return (
    <div className="learn-scene">
      <ToyLetter letterId={letter.id} glyph={letter.upper} size="hero" />
      <div className="scene-object">
        <LetterVisual letter={letter} size="hero" />
      </div>
    </div>
  );
}
