import { LetterItem } from "../types";
import { assetUrl, ASSETS } from "../utils/assets";
import { letterGlyphSrc, letterIntroLines, letterObjectSrc } from "../utils/letterCopy";
import { ToyLetter } from "./ToyLetter";
import { LetterPlaceholder } from "./LetterPlaceholder";

interface LearnSceneProps {
  letter: LetterItem;
}

export function LearnScene({ letter }: LearnSceneProps) {
  const letterSrc = letterGlyphSrc(letter);
  const objectSrc = letterObjectSrc(letter, "learn");
  const lines = letterIntroLines(letter);

  return (
    <div className="learn-stage">
      <div className="learn-scene-content">
        <div className="learn-fox-area">
          <div className="learn-bubble" aria-live="polite">
            {lines.map((line) => (
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
          {objectSrc ? (
            <img
              className="learn-object-art"
              src={assetUrl(objectSrc)}
              alt={letter.word}
              draggable={false}
            />
          ) : (
            <LetterPlaceholder letter={letter} className="learn-object-art" />
          )}
        </div>
      </div>
    </div>
  );
}
