import type {
  LetterAudioClip,
  LetterContent,
  LetterTheme,
  LetterVoiceKind,
  PictureExample,
  PictureExampleEntry,
  ToyLetterPalette,
  ToyLetterTheme
} from "../types";
import { LETTER_CONTENT } from "./letters";

const CONTENT_BY_ID = new Map(LETTER_CONTENT.map((letter) => [letter.id, letter]));
const CONTENT_BY_GLYPH = new Map(LETTER_CONTENT.map((letter) => [letter.upper, letter]));
const PICTURE_CONTENT_BANK: PictureExampleEntry[] = LETTER_CONTENT.flatMap((letter) =>
  (letter.pictureExamples ?? []).map((example) => ({
    ...example,
    letterId: letter.id,
    letterUpper: letter.upper,
    letterContentReady: letter.contentReady
  }))
);

const FALLBACK_TOY_PALETTES: ToyLetterPalette[] = [
  { light: "#ffb3c2", mid: "#ff5d7a", dark: "#e0244e", shade: "#9a1233" },
  { light: "#ffd18a", mid: "#ff9f1c", dark: "#e07a00", shade: "#a35400" },
  { light: "#9af0e4", mid: "#2ec4b6", dark: "#1a9e92", shade: "#0e6e66" },
  { light: "#b6ecff", mid: "#4fc3ff", dark: "#1d9ee0", shade: "#0d6fa6" },
  { light: "#d2c4ff", mid: "#7c4dff", dark: "#5a2fd6", shade: "#3b1a96" },
  { light: "#86efac", mid: "#22c55e", dark: "#15803d", shade: "#166534" }
];

const FALLBACK_CARD_TONES = [
  "tone-pink",
  "tone-orange",
  "tone-teal",
  "tone-cyan",
  "tone-purple"
];

const FALLBACK_LISTEN_TONES = ["pink", "orange", "teal", "purple", "blue"];

function stableIndex(id: string, length: number): number {
  const value = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return value % length;
}

export function getLetterContent(id: string): LetterContent | undefined {
  return CONTENT_BY_ID.get(id);
}

export function getPictureExamples(id: string): readonly PictureExample[] {
  return getLetterContent(id)?.pictureExamples ?? [];
}

export function getPictureContentBank(): readonly PictureExampleEntry[] {
  return PICTURE_CONTENT_BANK;
}

export function getLetterTheme(id: string): LetterTheme | undefined {
  return getLetterContent(id)?.theme;
}

export function getLetterAudio(
  id: string,
  kind: LetterVoiceKind
): LetterAudioClip | undefined {
  return getLetterContent(id)?.audio?.[kind];
}

export function getLetterPronunciation(glyph: string): string | undefined {
  return CONTENT_BY_GLYPH.get(glyph)?.pronunciation;
}

export function getToyLetterTheme(id: string): ToyLetterTheme {
  const configured = getLetterTheme(id)?.toy;
  if (configured) {
    return configured;
  }
  return {
    palette: FALLBACK_TOY_PALETTES[stableIndex(id, FALLBACK_TOY_PALETTES.length)],
    fillRule: "nonzero"
  };
}

export function getCardTone(id: string): string {
  return (
    getLetterTheme(id)?.cardTone ??
    FALLBACK_CARD_TONES[stableIndex(id, FALLBACK_CARD_TONES.length)]
  );
}

export function getFindNativeHue(id: string): number | undefined {
  return getLetterTheme(id)?.findNativeHue;
}

export function getListenTone(id: string): string {
  return (
    getLetterTheme(id)?.listenTone ??
    FALLBACK_LISTEN_TONES[stableIndex(id, FALLBACK_LISTEN_TONES.length)]
  );
}
