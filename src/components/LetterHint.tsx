import { LetterItem } from "../types";
import { LetterVisual } from "./LetterVisual";
import { ToyLetter } from "./ToyLetter";

interface LetterHintProps {
  letter: LetterItem;
  showImage?: boolean;
}

export function LetterHint({ letter, showImage = true }: LetterHintProps) {
  return (
    <div className={`letter-hint ${showImage ? "" : "letter-hint-only"}`}>
      <ToyLetter letterId={letter.id} glyph={letter.upper} size="hint" />
      {showImage ? <LetterVisual letter={letter} size="card" /> : null}
    </div>
  );
}
