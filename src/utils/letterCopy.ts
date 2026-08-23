import { LetterItem } from "../types";

export function letterIntroLines(letter: Pick<LetterItem, "upper" | "word">): [string, string] {
  const word = letter.word.toLowerCase();
  return [`Это буква ${letter.upper}!`, `${letter.upper} — ${word}!`];
}

export function letterIntroText(letter: Pick<LetterItem, "upper" | "word">): string {
  return letterIntroLines(letter).join("\n");
}

export function letterIntroSpeech(letter: Pick<LetterItem, "upper" | "word">): string {
  return letterIntroLines(letter).join(" ");
}

export function findLetterPrompt(letter: Pick<LetterItem, "upper">): string {
  return `Найди букву ${letter.upper}!`;
}

export function letterGlyphSrc(letter: LetterItem): string | undefined {
  return letter.letterImage;
}

export function letterObjectSrc(
  letter: LetterItem,
  kind: "learn" | "find" | "picture" = "learn"
): string {
  if (kind === "find" && letter.findObjectImage) {
    return letter.findObjectImage;
  }
  if (kind === "picture" && letter.pictureImage) {
    return letter.pictureImage;
  }
  return letter.objectImage ?? letter.imagePath;
}

export function letterChoiceSrc(letter: LetterItem): string | undefined {
  return letter.choiceImage;
}
