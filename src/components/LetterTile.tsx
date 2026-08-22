import { LetterItem } from "../types";
import { CARD_TONES } from "../utils/cardTones";

interface LetterTileProps {
  letter: LetterItem;
  index?: number;
  wrong?: boolean;
  correct?: boolean;
  hint?: boolean;
  onClick: (event: { currentTarget: EventTarget }) => void;
}

export function LetterTile({ letter, index = 0, wrong, correct, hint, onClick }: LetterTileProps) {
  const className = [
    "letter-tile",
    CARD_TONES[index % CARD_TONES.length],
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
