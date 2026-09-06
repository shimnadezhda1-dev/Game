import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { LETTER_CONTENT } from "../src/data/letters";
import { validateLetterContent } from "../src/data/validateLetterContent";

const GLOBAL_AUDIO_PATHS = [
  "/audio/voice/welcome.mp3",
  "/audio/voice/try-again.mp3",
  "/audio/voice/listen-prompt.mp3"
];

function pathExistsWithExactCase(publicDir: string, publicPath: string): boolean {
  const segments = publicPath.replace(/^\/+/, "").split("/");
  let current = publicDir;

  try {
    for (const segment of segments) {
      if (!readdirSync(current).includes(segment)) {
        return false;
      }
      current = join(current, segment);
    }
    return statSync(current).isFile();
  } catch {
    return false;
  }
}

export function letterContentValidationPlugin(): Plugin {
  return {
    name: "letter-content-validation",
    enforce: "pre",
    configResolved(config) {
      const pathExists = (path: string) =>
        pathExistsWithExactCase(config.publicDir, path);
      const errors = validateLetterContent(LETTER_CONTENT, { pathExists });

      GLOBAL_AUDIO_PATHS.forEach((path) => {
        if (!pathExists(path)) {
          errors.push(`globalAudio: file does not exist with exact case "${path}"`);
        }
      });

      if (errors.length) {
        throw new Error(
          `Letter content validation failed:\n${errors
            .map((error) => `- ${error}`)
            .join("\n")}`
        );
      }
    }
  };
}
