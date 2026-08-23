import { LetterItem } from "../types";
import { assetUrl, ASSETS } from "../utils/assets";
import { ToyLetter } from "./ToyLetter";

interface LearnSceneProps {
  letter: LetterItem;
}

function bubbleLines(letter: LetterItem): string[] {
  const lines = letter.voiceText
    .split(/(?<=[!?])\s+/u)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length >= 3) {
    return lines.slice(0, 3);
  }
  return [
    `Это буква ${letter.upper}!`,
    `${letter.upper}-а-а!`,
    `${letter.upper} — ${letter.word.toLowerCase()}!`
  ];
}

export function LearnScene({ letter }: LearnSceneProps) {
  const letterSrc = letter.letterImage;
  const objectSrc = letter.objectImage ?? letter.imagePath;

  return (
    <div className="learn-stage">
      <div className="learn-scene-content">
        <div className="learn-fox-area">
          <div className="learn-bubble" aria-live="polite">
            {bubbleLines(letter).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <img
            className="learn-fox-art"
            src={assetUrl(ASSETS.fox.teacher)}
            alt=""
            draggable={false}
          />
        </div>

        <div className="learn-letter-area">
          {letterSrc ? (
            <img
              className="learn-letter-art"
              src={assetUrl(letterSrc)}
              alt={letter.upper}
              draggable={false}
            />
          ) : (
            <ToyLetter letterId={letter.id} glyph={letter.upper} size="hero" />
          )}
        </div>

        <div className="learn-object-area">
          <img
            className="learn-object-art"
            src={assetUrl(objectSrc)}
            alt={letter.word}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
