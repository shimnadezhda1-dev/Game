import { existsSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ySound = join(root, "public/assets/audio/ru/y/sound.mp3");
const prefix = join(root, "public/assets/audio/ru/common/find-letter-prefix.mp3");
const example = join(root, "public/assets/audio/ru/common/find-yery-example.mp3");
const oldFind = join(root, "public/assets/audio/ru/y/find.mp3");
const findPromptSrc = readFileSync(join(root, "src/audio/findLetterPrompt.ts"), "utf8");
const findGameSrc = readFileSync(join(root, "src/components/FindLetterGame.tsx"), "utf8");

function size(path) {
  return existsSync(path) ? statSync(path).size : 0;
}

const yHash = createHash("sha256").update(readFileSync(ySound)).digest("hex").toUpperCase();
const expectedYHash = "EEB582C1DD09BAF6C1502AAB2209F99BE092C1839E4ACED6225085D0FC064343";

const usesComposite = findPromptSrc.includes("findYeryPrefixPath") &&
  findPromptSrc.includes("listenYeryLetterPath") &&
  findPromptSrc.includes("findYeryExamplePath") &&
  !findPromptSrc.includes("y/find.mp3");
const sameFlow =
  findGameSrc.includes("playFindLetterPromptForCurrent") &&
  findGameSrc.includes("autoSpeak: false") &&
  findGameSrc.includes("playFindLetterPrompt(");

const report = {
  visibleText: "Найди букву Ы!",
  audioPart1: "/assets/audio/ru/common/find-letter-prefix.mp3",
  audioPart2: "/assets/audio/ru/y/sound.mp3",
  audioPart3: "/assets/audio/ru/common/find-yery-example.mp3",
  firstPlaybackUsesCompositeFlow: usesComposite && sameFlow,
  soundButtonUsesCompositeFlow: sameFlow,
  sameFlow,
  oldIncorrectTtsUsed: findPromptSrc.includes("letterVoiceAssetPath(\"find\", \"Yery\")") || findPromptSrc.includes("y/find.mp3"),
  ySoundUnchanged: yHash === expectedYHash,
  sizes: {
    prefix: size(prefix),
    ySound: size(ySound),
    example: size(example),
    oldFind: size(oldFind)
  },
  status: "FAIL"
};

report.status =
  report.firstPlaybackUsesCompositeFlow &&
  report.soundButtonUsesCompositeFlow &&
  report.sameFlow &&
  !report.oldIncorrectTtsUsed &&
  report.ySoundUnchanged &&
  report.sizes.prefix > 0 &&
  report.sizes.ySound > 0 &&
  report.sizes.example > 0
    ? "PASS"
    : "FAIL";

const outDir = join(root, ".cursor-verify");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "find-yery-verify.json"), JSON.stringify(report, null, 2));

console.log(`visibleText=${report.visibleText}`);
console.log(`audioPart1=${report.audioPart1} size=${report.sizes.prefix}`);
console.log(`audioPart2=${report.audioPart2} size=${report.sizes.ySound} unchanged=${report.ySoundUnchanged}`);
console.log(`audioPart3=${report.audioPart3} size=${report.sizes.example}`);
console.log(`firstPlaybackUsesCompositeFlow=${report.firstPlaybackUsesCompositeFlow}`);
console.log(`soundButtonUsesCompositeFlow=${report.soundButtonUsesCompositeFlow}`);
console.log(`sameFlow=${report.sameFlow}`);
console.log(`oldIncorrectTtsUsed=${report.oldIncorrectTtsUsed}`);
console.log(`STATUS ${report.status}`);
if (report.status !== "PASS") {
  process.exit(1);
}
