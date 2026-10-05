import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const expected = [
  "А","Б","В","Г","Д","Е","Ё","Ж","З","И","Й","К","Л","М","Н","О","П","Р","С","Т","У","Ф","Х","Ц","Ч","Ш","Щ","Ъ","Ы","Ь","Э","Ю","Я"
];

const lettersSrc = readFileSync(join(root, "src/data/letters.ts"), "utf8");
const raw = lettersSrc.split("const RAW_LETTER_CONTENT")[1] ?? "";
const uppers = [...raw.matchAll(/\n    upper: "([^"]+)"/g)].map((match) => match[1]);
const ids = [...raw.matchAll(/\n    id: "([^"]+)"/g)].map((match) => match[1]);

const appSrc = readFileSync(join(root, "src/App.tsx"), "utf8");
const pickerUsesCanonical = appSrc.includes(
  "filterLettersByCategory(LETTERS, progress.letterCategory)"
);
const pickableStillFiltersActivity = /const pickableLetters = useMemo\(\s*\(\) =>\s*filterLettersByCategory\(LETTERS, progress\.letterCategory\),\s*\[progress\.letterCategory\]/.test(
  appSrc
) === false;

const gridSrc = readFileSync(join(root, "src/components/LetterPickGrid.tsx"), "utf8");
const paginatesByLength = gridSrc.includes("Math.ceil(letters.length / pageSize)");
const selectsById = gridSrc.includes("onSelect(letter.id)");

const count = uppers.length;
const duplicates = count - new Set(uppers).size;
const missing = expected.filter((letter) => !uppers.includes(letter));
const extra = uppers.filter((letter) => !expected.includes(letter));
const wrongOrder = expected.some((letter, index) => uppers[index] !== letter);
const idx = (letter) => uppers.indexOf(letter);
const signOrder =
  idx("Щ") < idx("Ъ") && idx("Ъ") < idx("Ы") && idx("Ы") < idx("Ь") && idx("Ь") < idx("Э");

const clickMap = {
  "Ъ": ids[idx("Ъ")],
  "Ы": ids[idx("Ы")],
  "Ь": ids[idx("Ь")]
};
const clicksCorrect =
  clickMap["Ъ"] === "Hard" && clickMap["Ы"] === "Yery" && clickMap["Ь"] === "Soft" && selectsById;

const pageCountDesktop = Math.ceil(count / 8);
const pageCountMobile = Math.ceil(count / 6);

const status =
  count === 33 &&
  duplicates === 0 &&
  missing.length === 0 &&
  extra.length === 0 &&
  !wrongOrder &&
  signOrder &&
  !pickableStillFiltersActivity &&
  pickerUsesCanonical &&
  paginatesByLength &&
  clicksCorrect
    ? "PASS"
    : "FAIL";

const report = {
  count,
  duplicates,
  missing,
  extra,
  wrongOrder,
  signOrder,
  clickMap,
  clicksCorrect,
  pickableStillFiltersActivity,
  pickerUsesCanonical,
  pageCountDesktop,
  pageCountMobile,
  status
};

mkdirSync(join(root, ".cursor-verify"), { recursive: true });
writeFileSync(join(root, ".cursor-verify/letter-picker-verify.json"), JSON.stringify(report, null, 2));

console.log(`count=${count} duplicates=${duplicates} missing=${missing.join("|") || 0} wrongOrder=${wrongOrder}`);
console.log(`Щ→Ъ→Ы→Ь→Э: ${signOrder}`);
console.log(`clicks Ъ=${clickMap["Ъ"]} Ы=${clickMap["Ы"]} Ь=${clickMap["Ь"]} correct=${clicksCorrect}`);
console.log(`pages desktop(8)=${pageCountDesktop} mobile(6)=${pageCountMobile}`);
console.log(`activityFilterOnPicker=${pickableStillFiltersActivity}`);
console.log(`STATUS ${status}`);
if (status !== "PASS") {
  process.exit(1);
}
