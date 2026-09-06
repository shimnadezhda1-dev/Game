import { LetterItem } from "../types";

export function letterIntroLines(
  letter: Pick<LetterItem, "upper" | "word" | "needsContent">
): [string, string] {
  if (letter.needsContent || !letter.word) {
    return [`Это буква ${letter.upper}!`, `Запомни букву ${letter.upper}!`];
  }
  const word = letter.word.toLowerCase();
  return [`Это буква ${letter.upper}!`, `${letter.upper} — ${word}!`];
}

export function letterIntroText(
  letter: Pick<LetterItem, "upper" | "word" | "needsContent">
): string {
  return letterIntroLines(letter).join("\n");
}

export function letterIntroSpeech(
  letter: Pick<LetterItem, "upper" | "word" | "needsContent">
): string {
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
): string | undefined {
  if (kind === "find") {
    return (
      letter.findObjectImage ||
      letter.objectImage ||
      letter.pictureImage ||
      letter.imagePath ||
      undefined
    );
  }
  if (kind === "picture") {
    const targetExample = letter.pictureExamples?.find(
      (example) => example.pictureEligible && example.allowedAsTarget
    );
    return (
      letter.pictureImage ||
      targetExample?.image ||
      letter.objectImage ||
      letter.imagePath ||
      undefined
    );
  }
  return letter.objectImage || letter.imagePath || undefined;
}

export function letterChoiceSrc(letter: LetterItem): string | undefined {
  return letter.choiceImage;
}
