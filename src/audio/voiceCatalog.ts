import { LETTER_CONTENT } from "../data/letters";
import type { LetterVoiceKind } from "../types";

const GLOBAL_VOICE_FILES = {
  welcome: "/audio/voice/welcome.mp3",
  "try-again": "/audio/voice/try-again.mp3",
  "listen-prompt": "/audio/voice/listen-prompt.mp3"
} as const;

const LETTER_VOICE_FILES = Object.fromEntries(
  LETTER_CONTENT.flatMap((letter) =>
    Object.values(letter.audio ?? {}).flatMap((clip) =>
      clip ? [[clip.key, clip.path] as const] : []
    )
  )
);

export const VOICE_FILES: Readonly<Record<string, string>> = {
  ...GLOBAL_VOICE_FILES,
  ...LETTER_VOICE_FILES
};

export type VoiceKey = keyof typeof VOICE_FILES;

export function letterVoiceKey(
  kind: LetterVoiceKind,
  letterId: string
): VoiceKey {
  return `${kind}-${letterId.toLowerCase()}` as VoiceKey;
}
