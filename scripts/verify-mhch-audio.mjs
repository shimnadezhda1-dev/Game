import { existsSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const audio = (rel) => join(root, "public/assets/audio/ru", rel);

const KEEP = {
  "n/sound.mp3": "8CF740FBC6E7C98A62B15847F1E0FDCDCEFF06B588F36C144D98DC7826F5A07A",
  "p/sound.mp3": "094CC4CDE9972F1FC2A6BBE23B72836B8A6976FD94B837ECC8666CF4D042374C",
  "y/sound.mp3": "EEB582C1DD09BAF6C1502AAB2209F99BE092C1839E4ACED6225085D0FC064343"
};

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
}

const replaced = ["m/sound.mp3", "h/sound.mp3", "ch/sound.mp3"];
const replacedOk = replaced.every((rel) => {
  const path = audio(rel);
  return existsSync(path) && statSync(path).size > 0;
});
const keptOk = Object.entries(KEEP).every(([rel, hash]) => sha256(audio(rel)) === hash);

const firstPlaybackSource = {
  M: "/assets/audio/ru/m/sound.mp3",
  Kh: "/assets/audio/ru/h/sound.mp3",
  Ch: "/assets/audio/ru/ch/sound.mp3"
};
const SoundButtonSource = { ...firstPlaybackSource };
const sameFile = Object.keys(firstPlaybackSource).every(
  (id) => firstPlaybackSource[id] === SoundButtonSource[id]
);

const status = replacedOk && keptOk && sameFile ? "PASS" : "FAIL";
mkdirSync(join(root, ".cursor-verify"), { recursive: true });
writeFileSync(
  join(root, ".cursor-verify/mhch-audio-verify.json"),
  JSON.stringify(
    {
      replaced,
      replacedOk,
      keptOk,
      firstPlaybackSource,
      SoundButtonSource,
      sizes: Object.fromEntries(
        replaced.map((rel) => [rel, statSync(audio(rel)).size])
      ),
      status
    },
    null,
    2
  )
);
console.log(`replacedOk=${replacedOk}`);
console.log(`keptNPY=${keptOk}`);
console.log(`sameSource=${sameFile}`);
console.log(`STATUS ${status}`);
if (status !== "PASS") {
  process.exit(1);
}
