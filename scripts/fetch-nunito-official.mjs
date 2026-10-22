import { mkdir, writeFile, unlink } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const outDir = path.resolve("public/assets/fonts/nunito");
await mkdir(outDir, { recursive: true });

const ttfUrl = "https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/Nunito%5Bwght%5D.ttf";
const res = await fetch(ttfUrl);
if (!res.ok) {
  throw new Error(`variable TTF download failed: ${res.status}`);
}
const ttfPath = path.join(outDir, "Nunito-variable-src.ttf");
const ttfBuf = Buffer.from(await res.arrayBuffer());
await writeFile(ttfPath, ttfBuf);
console.log("downloaded official Nunito[wght].ttf", ttfBuf.length);

const pip = spawnSync("python", ["-m", "pip", "install", "--quiet", "fonttools", "brotli"], {
  encoding: "utf8"
});
if (pip.status !== 0) {
  throw new Error(`pip fonttools failed:\n${pip.stderr}\n${pip.stdout}`);
}

const weights = [700, 800, 900];
const py = `
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
import sys
src = sys.argv[1]
outdir = sys.argv[2]
font = TTFont(src)
for w in (700, 800, 900):
    inst = instantiateVariableFont(font, {"wght": w}, inplace=False)
    inst.flavor = "woff2"
    inst.save(f"{outdir}/Nunito-{w}.woff2")
    print(f"Nunito-{w}.woff2")
`;
const conv = spawnSync("python", ["-c", py, ttfPath, outDir], { encoding: "utf8" });
if (conv.status !== 0) {
  throw new Error(`instantiate failed:\n${conv.stderr}\n${conv.stdout}`);
}
console.log(conv.stdout.trim());
await unlink(ttfPath);

const css = weights
  .map(
    (weight) => `@font-face {
  font-family: "Nunito";
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url("./Nunito-${weight}.woff2") format("woff2");
}
`
  )
  .join("\n");
await writeFile(path.join(outDir, "fonts.css"), css, "utf8");
console.log("wrote fonts.css");

const oflRes = await fetch("https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/OFL.txt");
if (!oflRes.ok) {
  throw new Error(`OFL download failed: ${oflRes.status}`);
}
await mkdir("licenses", { recursive: true });
await writeFile("licenses/Nunito-OFL.txt", await oflRes.text(), "utf8");
console.log("wrote licenses/Nunito-OFL.txt");
