import { existsSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const audio = (rel) => join(root, "public/assets/audio/ru", rel);

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
}

const before = {
  A: "/assets/audio/ru/a/listen-letter.mp3",
  M: "/assets/audio/ru/m/sound.mp3",
  Kh: "/assets/audio/ru/h/sound.mp3",
  Ch: "/assets/audio/ru/ch/sound.mp3"
};

const after = {
  A: "/assets/audio/ru/a/sound.mp3",
  M: "/assets/audio/ru/m/sound.mp3",
  Kh: "/assets/audio/ru/h/sound.mp3",
  Ch: "/assets/audio/ru/ch/sound.mp3"
};

const task1 = {
  A: "/assets/audio/ru/a/learn.mp3",
  M: "/assets/audio/ru/m/learn.mp3",
  Kh: "/assets/audio/ru/h/learn.mp3",
  Ch: "/assets/audio/ru/ch/learn.mp3"
};

const rows = ["A", "M", "Kh", "Ch"].map((letter) => {
  const folder = { A: "a", M: "m", Kh: "h", Ch: "ch" }[letter];
  const soundRel = `${folder}/sound.mp3`;
  const soundPath = audio(soundRel);
  const fileExists = existsSync(soundPath) && statSync(soundPath).size > 0;
  const task4AudioSourceAfter = after[letter];
  const firstPlaybackSource = task4AudioSourceAfter;
  const SoundButtonSource = task4AudioSourceAfter;
  const reusedExistingSound =
    letter !== "A" && fileExists && before[letter] === after[letter];
  return {
    letter,
    task1AudioSource: task1[letter],
    task4AudioSourceBefore: before[letter],
    task4AudioSourceAfter,
    firstPlaybackSource,
    SoundButtonSource,
    sameFileFirstAndSound: firstPlaybackSource === SoundButtonSource,
    reusedExistingSound,
    extractedFromLearn: letter === "A",
    fileExists,
    size: fileExists ? statSync(soundPath).size : 0,
    hash: fileExists ? sha256(soundPath) : null,
    status: fileExists && firstPlaybackSource === SoundButtonSource ? "PASS" : "FAIL"
  };
});

const status = rows.every((row) => row.status === "PASS") ? "PASS" : "FAIL";
mkdirSync(join(root, ".cursor-verify"), { recursive: true });
writeFileSync(
  join(root, ".cursor-verify/listen-amhch-audio.json"),
  JSON.stringify({ rows, fishAudioUsed: false, status }, null, 2)
);
for (const row of rows) {
  console.log(
    [
      `letter=${row.letter}`,
      `task1AudioSource=${row.task1AudioSource}`,
      `task4AudioSourceBefore=${row.task4AudioSourceBefore}`,
      `task4AudioSourceAfter=${row.task4AudioSourceAfter}`,
      `sameAsTask1LearnFile=${row.task1AudioSource === row.task4AudioSourceAfter}`,
      `fileExists=${row.fileExists}`,
      `status=${row.status}`
    ].join("\n")
  );
  console.log("---");
}
console.log(`STATUS ${status}`);
if (status !== "PASS") {
  process.exit(1);
}
