import { audioManager } from "./AudioManager";
import {
  findYeryExamplePath,
  findYeryPrefixPath,
  letterVoiceAssetPath,
  listenYeryLetterPath
} from "./letterFolders";

export function findLetterYeryUsesComposite(letterId: string): boolean {
  return letterId === "Yery";
}

export async function playFindLetterPrompt(
  letterId: string,
  stillCurrent: () => boolean,
  pause: (ms: number) => Promise<void>
): Promise<void> {
  if (letterId === "Yery") {
    await audioManager.playVoiceAndWait(findYeryPrefixPath());
    if (!stillCurrent()) {
      return;
    }
    await pause(150);
    if (!stillCurrent()) {
      return;
    }
    await audioManager.playVoiceAndWait(listenYeryLetterPath());
    if (!stillCurrent()) {
      return;
    }
    await pause(200);
    if (!stillCurrent()) {
      return;
    }
    await audioManager.playVoiceAndWait(findYeryExamplePath());
    return;
  }

  const path = letterVoiceAssetPath("find", letterId);
  if (!path) {
    return;
  }
  audioManager.playVoice(path);
}
