import { LetterItem } from "../types";
import { letterTone } from "../utils/cardTones";

interface LetterTileProps {
  letter: LetterItem;
  index?: number;
  wrong?: boolean;
  correct?: boolean;
  hint?: boolean;
  onClick: (event: { currentTarget: EventTarget }) => void;
}

export function LetterTile({ letter, wrong, correct, hint, onClick }: LetterTileProps) {
  const className = [
    "letter-tile",
    letterTone(letter.id),
    wrong ? "shake" : "",
    correct ? "tile-correct" : "",
    hint ? "hint" : ""
  ]
    .join(" ")
    .trim();

  return (
    <button className={className} onClick={onClick} aria-label={letter.upper}>
      <span className="tile-face">
        <span className="tile-glyph">{letter.upper}</span>
      </span>
      {correct ? (
        <span className="tile-sparkles" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      ) : null}
    </button>
  );
}
