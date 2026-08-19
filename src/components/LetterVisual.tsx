import { useEffect, useState } from "react";
import { LetterItem } from "../types";
import { assetUrl } from "../utils/assets";

interface LetterVisualProps {
  letter: LetterItem;
  size?: "hero" | "card";
}

export function LetterVisual({ letter, size = "card" }: LetterVisualProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [letter.id, letter.imagePath]);

  if (failed) {
    return <div className={`letter-fallback letter-fallback-${size}`}>{letter.upper}</div>;
  }

  return (
    <img
      className={`letter-image letter-image-${size}`}
      src={assetUrl(letter.imagePath)}
      alt={letter.word}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
