import { LetterItem } from "../types";

interface LetterVisualProps {
  letter: LetterItem;
}

export function LetterVisual({ letter }: LetterVisualProps) {
  if (letter.imagePath) {
    return <img className="letter-image" src={letter.imagePath} alt={letter.word} draggable={false} />;
  }
  return <span className="emoji-big">{letter.emoji}</span>;
}
