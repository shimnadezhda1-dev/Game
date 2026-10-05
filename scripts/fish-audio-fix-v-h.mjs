import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const API_URL = "https://api.fish.audio/v1/tts";
const MODEL = "s2.1-pro-free";
const ROOT = path.resolve("public/assets/audio/ru");

const API_KEY = process.env.FISH_API_KEY;
const VOICE_ID = process.env.FISH_VOICE_ID;

if (!API_KEY) {
  console.error("FISH_API_KEY is missing.");
  process.exit(1);
}

if (!VOICE_ID) {
  console.error("FISH_VOICE_ID is missing.");
  process.exit(1);
}

const data = {
  v: {
    name: "Вэ",
    folder: "v",
    words: ["волк", "ведро", "велосипед"],
  },

  h: {
    name: "Ха",
    folder: "h",
    words: ["хомяк", "хлеб", "холодильник"],
  },
};

const arg = process.argv.find((x) => x.startsWith("--letter="));

if (!arg) {
  console.error("Укажи --letter=v или --letter=h");
  process.exit(1);
}

const key = arg.split("=")[1];
const item = data[key];

if (!item) {
  console.error("Разрешены только v или h");
  process.exit(1);
}

const { name, folder, words } = item;

const entries = [
  [`${folder}/learn.mp3`,
   `Это буква ${name}. ${name} — ${words[0]}.`],

  [`${folder}/find.mp3`,
   `Найди букву ${name}.`],

  [`${folder}/picture.mp3`,
   `Что начинается на букву ${name}?`],

  [`${folder}/listen-1.mp3`,
   `${name} — ${words[0]}. Выбери картинку.`],

  [`${folder}/listen-2.mp3`,
   `${name} — ${words[1]}. Выбери картинку.`],

  [`${folder}/listen-3.mp3`,
   `${name} — ${words[2]}. Выбери картинку.`],

  [`${folder}/success.mp3`,
   `Молодец! Это буква ${name}! Давай найдём следующую!`],
];

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function generate(relativePath, text) {
  const target = path.join(ROOT, relativePath);

  await mkdir(path.dirname(target), {
    recursive: true,
  });

  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      model: MODEL,
    },

    body: JSON.stringify({
      text,
      reference_id: VOICE_ID,
      format: "mp3",
    }),
  });

  if (!response.ok) {
    const error = await response.text();

    console.error(
      `HTTP ${response.status}:`,
      error.replaceAll(API_KEY, "[REDACTED]")
    );

    process.exit(1);
  }

  const audio = Buffer.from(
    await response.arrayBuffer()
  );

  await writeFile(target, audio);

  console.log(
    `OK: ${relativePath} (${audio.length} bytes)`
  );
}

console.log(`Генерируем букву: ${name}`);

for (const [file, text] of entries) {
  console.log(text);

  await generate(file, text);

  await sleep(300);
}

console.log("");
console.log(`Готово: ${name}`);
console.log("API key не выводился.");