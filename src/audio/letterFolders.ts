import type { LetterVoiceKind } from "../types";

export const AUDIO_ROOT = "/assets/audio/ru";

export function ruAssetPath(relative: string): string {
  return `${AUDIO_ROOT}/${relative.replace(/^\//, "")}`;
}

export const LETTER_FOLDERS: Record<string, string> = {
  A: "a",
  B: "b",
  V: "v",
  G: "g",
  D: "d",
  E: "e",
  Yo: "yo",
  Zh: "zh",
  Z: "z",
  I: "i",
  J: "y-short",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  O: "o",
  P: "p",
  R: "r",
  S: "s",
  T: "t",
  U: "u",
  F: "f",
  Kh: "h",
  Ts: "ts",
  Ch: "ch",
  Sh: "sh",
  Shch: "shch",
  Hard: "hard-sign",
  Yery: "y",
  Soft: "soft-sign",
  Eh: "eh",
  Yu: "yu",
  Ya: "ya"
};

export const PICTURE_SKIP_LETTER_IDS = new Set(["Hard", "Yery", "Soft"]);

const LISTEN_CANONICAL_SOUND_IDS = new Set(["A", "M", "N", "P", "Kh", "Ch", "Eh"]);

export function listenYeryPrefixPath(): string {
  return ruAssetPath("common/listen-find-letter-prefix.mp3");
}

export function listenYeryLetterPath(): string {
  return ruAssetPath("y/sound.mp3");
}

export function findYeryPrefixPath(): string {
  return ruAssetPath("common/find-letter-prefix.mp3");
}

export function findYeryExamplePath(): string {
  return ruAssetPath("common/find-yery-example.mp3");
}

export function listenSpecialPromptText(letterId: string): string | undefined {
  if (letterId === "Yery") {
    return "Найди картинку, в которой есть буква Ы.";
  }
  if (letterId === "Soft") {
    return "Найди картинку, в которой есть мягкий знак.";
  }
  if (letterId === "Hard") {
    return "Найди картинку, в которой есть твёрдый знак.";
  }
  return undefined;
}

export function listenSpecialPromptPath(letterId: string): string | undefined {
  if (letterId === "Soft") {
    return ruAssetPath("common/listen-find-soft-sign.mp3");
  }
  if (letterId === "Hard") {
    return ruAssetPath("common/listen-find-hard-sign.mp3");
  }
  return undefined;
}

export function letterAudioFolder(letterId: string): string | undefined {
  return LETTER_FOLDERS[letterId];
}

export function letterVoiceAssetPath(
  kind: LetterVoiceKind,
  letterId: string
): string | undefined {
  const folder = LETTER_FOLDERS[letterId];
  if (!folder) {
    return undefined;
  }
  if (kind === "letter") {
    return letterId === "Yery" ? ruAssetPath("y/sound.mp3") : ruAssetPath(`${folder}/learn.mp3`);
  }
  if (kind === "find") {
    return ruAssetPath(`${folder}/find.mp3`);
  }
  if (kind === "picture") {
    if (PICTURE_SKIP_LETTER_IDS.has(letterId)) {
      return undefined;
    }
    return ruAssetPath(`${folder}/picture.mp3`);
  }
  if (kind === "listen") {
    if (letterId === "Yery") {
      return listenYeryLetterPath();
    }
    if (letterId === "Hard") {
      return ruAssetPath("hard-sign/find.mp3");
    }
    if (letterId === "Soft") {
      return ruAssetPath("soft-sign/find.mp3");
    }
    if (LISTEN_CANONICAL_SOUND_IDS.has(letterId)) {
      return ruAssetPath(`${folder}/sound.mp3`);
    }
    return ruAssetPath(`${folder}/listen-letter.mp3`);
  }
  return ruAssetPath(`${folder}/success.mp3`);
}
