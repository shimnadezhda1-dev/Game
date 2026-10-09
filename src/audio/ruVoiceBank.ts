import { LETTERS } from "../data/letters";
import type { LetterVoiceKind } from "../types";
import { letterVoiceAssetPath, ruAssetPath } from "./letterFolders";

export {
  AUDIO_ROOT,
  LETTER_FOLDERS,
  findYeryExamplePath,
  findYeryPrefixPath,
  letterAudioFolder,
  letterVoiceAssetPath,
  listenSpecialPromptPath,
  listenSpecialPromptText,
  listenYeryLetterPath,
  listenYeryPrefixPath,
  ruAssetPath
} from "./letterFolders";

const COMMON_FILES: Record<string, string> = {
  welcome: "common/hello.mp3",
  hello: "common/hello.mp3",
  "try-again": "common/try-again.mp3",
  almost: "common/almost.mp3",
  hint: "common/hint.mp3",
  replay: "common/replay.mp3",
  correct: "common/correct.mp3",
  next: "common/next.mp3",
  "reward-new-sticker": "common/reward-new-sticker.mp3",
  "reward-continue": "common/reward-continue.mp3",
  "listen-instruction": "common/listen-instruction.mp3",
  "listen-prompt": "common/listen-instruction.mp3",
  "meadow-night-hint": "common/meadow-night-hint.mp3",
  "meadow-night-wow": "common/meadow-night-wow.mp3",
  "meadow-day-hint": "common/meadow-day-hint.mp3",
  "meadow-night-reminder": "common/meadow-night-reminder.mp3"
};

export function letterLearnPath(letterId: string): string | undefined {
  return letterVoiceAssetPath("letter", letterId);
}

export function letterListenLetterPath(letterId: string): string | undefined {
  return letterVoiceAssetPath("listen", letterId);
}

export function letterListenPath(letterId: string, _exampleId?: string): string | undefined {
  return letterListenLetterPath(letterId);
}

export function resolveRuVoicePath(key?: string, path?: string): string | undefined {
  if (path?.trim()) {
    return path.trim();
  }
  if (!key) {
    return undefined;
  }
  const common = COMMON_FILES[key];
  if (common) {
    return ruAssetPath(common);
  }
  const separator = key.indexOf("-");
  if (separator <= 0) {
    return undefined;
  }
  const kind = key.slice(0, separator) as LetterVoiceKind;
  const letterIdRaw = key.slice(separator + 1);
  const letterId = LETTERS.find((item) => item.id.toLowerCase() === letterIdRaw.toLowerCase())?.id;
  if (!letterId) {
    return undefined;
  }
  return letterVoiceAssetPath(kind, letterId);
}
