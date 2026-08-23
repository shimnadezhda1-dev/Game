import { LetterItem } from "../types";

interface LetterPlaceholderProps {
  letter: LetterItem;
  className?: string;
}

export function LetterPlaceholder({ letter, className = "" }: LetterPlaceholderProps) {
  return (
    <div
      className={`letter-asset-placeholder ${className}`.trim()}
      data-asset-status="placeholder"
      aria-label={letter.word || `Буква ${letter.upper}`}
    >
      <span className="letter-asset-placeholder__glyph">{letter.upper}</span>
      {letter.word ? (
        <span className="letter-asset-placeholder__word">{letter.word}</span>
      ) : (
        <span className="letter-asset-placeholder__status">Нужен отдельный контент</span>
      )}
    </div>
  );
}
