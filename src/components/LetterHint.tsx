import { LetterItem } from "../types";
import { LetterVisual } from "./LetterVisual";

interface LetterHintProps {
  letter: LetterItem;
  showImage?: boolean;
}

export function LetterHint({ letter, showImage = true }: LetterHintProps) {
  return (
    <div className={`letter-hint ${showImage ? "" : "letter-hint-only"}`}>
      <span className="hint-glyph">{letter.upper}</span>
      {showImage ? <LetterVisual letter={letter} size="card" /> : null}
    </div>
  );
}
