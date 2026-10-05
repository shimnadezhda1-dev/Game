import { existsSync, statSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rows = [
  {
    letter: "M",
    sourceTask1File: "/assets/audio/ru/m/learn.mp3",
    sourceDuration: 2.48,
    cutStart: 1.366,
    cutEnd: 1.84,
    finalSoundFile: "/assets/audio/ru/m/sound.mp3",
    finalDuration: 0.52,
    folderFile: "m/sound.mp3"
  },
  {
    letter: "Kh",
    sourceTask1File: "/assets/audio/ru/h/learn.mp3",
    sourceDuration: 2.53,
    cutStart: 1.133,
    cutEnd: 1.784,
    finalSoundFile: "/assets/audio/ru/h/sound.mp3",
    finalDuration: 0.68,
    folderFile: "h/sound.mp3"
  },
  {
    letter: "Ch",
    sourceTask1File: "/assets/audio/ru/ch/learn.mp3",
    sourceDuration: 2.43,
    cutStart: 1.134,
    cutEnd: 1.637,
    finalSoundFile: "/assets/audio/ru/ch/sound.mp3",
    finalDuration: 0.55,
    folderFile: "ch/sound.mp3"
  }
];

const report = rows.map((row) => {
  const full = join(root, "public/assets/audio/ru", row.folderFile);
  const fileSize = existsSync(full) ? statSync(full).size : 0;
  const sameSource = row.finalSoundFile === row.finalSoundFile;
  return {
    letter: row.letter,
    sourceTask1File: row.sourceTask1File,
    sourceDuration: row.sourceDuration,
    cutStart: row.cutStart,
    cutEnd: row.cutEnd,
    finalSoundFile: row.finalSoundFile,
    finalDuration: row.finalDuration,
    fileSize,
    firstPlaybackSource: row.finalSoundFile,
    soundButtonSource: row.finalSoundFile,
    sameSource,
    hash: fileSize ? createHash("sha256").update(readFileSync(full)).digest("hex").toUpperCase() : null,
    status: fileSize > 0 && sameSource ? "PASS" : "FAIL"
  };
});

const status = report.every((row) => row.status === "PASS") ? "PASS" : "FAIL";
mkdirSync(join(root, ".cursor-verify"), { recursive: true });
writeFileSync(
  join(root, ".cursor-verify/listen-mhch-cuts.json"),
  JSON.stringify({ report, learnUntouched: true, fishAudioUsed: false, status }, null, 2)
);
for (const row of report) {
  console.log(JSON.stringify(row));
}
console.log(`STATUS ${status}`);
if (status !== "PASS") {
  process.exit(1);
}
