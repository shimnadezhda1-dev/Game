import type { CSSProperties } from "react";
import { LetterItem } from "../types";
import { getToyLetterTheme } from "../data/letterRegistry";
import { assetUrl, ASSETS } from "../utils/assets";
import { letterGlyphSrc, letterIntroLines, letterObjectSrc } from "../utils/letterCopy";

interface LearnSceneProps {
  letter: LetterItem;
}

/** A–D glyphs are tightly cropped portraits and stay on the original baseline. */
const TIGHT_LEARN_GLYPH_IDS = new Set(["A", "B", "V", "G", "D"]);

function LearnLetterGlyph({ letter }: { letter: LetterItem }) {
  const glyphSrc = letterGlyphSrc(letter);
  if (glyphSrc) {
    const tightCrop = TIGHT_LEARN_GLYPH_IDS.has(letter.id);
    return (
      <img
        className={tightCrop ? "learn-letter-art" : "learn-letter-art learn-letter-art--square"}
        src={assetUrl(glyphSrc)}
        alt={letter.upper}
        draggable={false}
      />
    );
  }

  const { palette } = getToyLetterTheme(letter.id);
  const markStyle = {
    "--learn-letter-light": palette.light,
    "--learn-letter-mid": palette.mid,
    "--learn-letter-dark": palette.dark,
    "--learn-letter-shade": palette.shade
  } as CSSProperties;

  return (
    <span className="learn-letter-mark" style={markStyle} data-letter={letter.upper} aria-hidden="true">
      {letter.upper}
    </span>
  );
}

export function LearnScene({ letter }: LearnSceneProps) {
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
          <LearnLetterGlyph letter={letter} />
        </div>

        <div className="learn-object-area">
          {objectSrc ? (
            <img
              className="learn-object-art"
              src={assetUrl(objectSrc)}
              alt={letter.word || letter.upper}
              draggable={false}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
