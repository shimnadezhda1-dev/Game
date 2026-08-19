import { useEffect, useState } from "react";
import { LetterItem } from "../types";
import { assetUrl } from "../utils/assets";

interface LetterVisualProps {
  letter: LetterItem;
}

export function LetterVisual({ letter }: LetterVisualProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [letter.id, letter.imagePath]);

  if (!letter.imagePath || failed) {
    return <span className="emoji-big">{letter.emoji}</span>;
  }

  return (
    <img
      className="letter-image"
      src={assetUrl(letter.imagePath)}
      alt={letter.word}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
