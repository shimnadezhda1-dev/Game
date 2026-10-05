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

const sleep = ms => new Promise(r => setTimeout(r, ms));

const ordinary = [
  ["a", "А"], ["b", "Бэ"], ["v", "Вэ"], ["g", "Гэ"], ["d", "Дэ"],
  ["e", "Е"], ["yo", "Ё"], ["zh", "Жэ"], ["z", "Зэ"], ["i", "И"],
  ["y-short", "И краткое"], ["k", "Ка"], ["l", "Эль"], ["m", "Эм"],
  ["n", "Эн"], ["o", "О"], ["p", "Пэ"], ["r", "Эр"], ["s", "Эс"],
  ["t", "Тэ"], ["u", "У"], ["f", "Эф"], ["h", "Ха"], ["ts", "Цэ"],
  ["ch", "Че"], ["sh", "Ша"], ["shch", "Ща"], ["eh", "Э"],
  ["yu", "Ю"], ["ya", "Я"],
];

const entries = ordinary.map(([folder, spoken]) => {
  const text = spoken === "Я"
    ? "Молодец! Это буква Я! Отличная работа!"
    : `Молодец! Это буква ${spoken}!`;
  return [`${folder}/success.mp3`, text];
});

entries.push(
  ["hard-sign/success.mp3", "Молодец! Это твёрдый знак!"],
  ["y/success.mp3", "Молодец! Всё правильно!"],
  ["soft-sign/success.mp3", "Молодец! Это мягкий знак!"],
);

async function synth(relativePath, text) {
  const target = path.join(ROOT, relativePath);
  await mkdir(path.dirname(target), { recursive: true });

  const res = await fetch(API_URL, {
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

  if (!res.ok) {
    const msg = (await res.text()).replaceAll(API_KEY, "[REDACTED]").slice(0, 500);
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error(`Audio too small: ${buf.length} bytes`);

  await writeFile(target, buf);
  return buf.length;
}

console.log(`Перегенерация только success.mp3: ${entries.length} файлов`);

for (let i = 0; i < entries.length; i++) {
  const [file, text] = entries[i];
  process.stdout.write(`[${String(i + 1).padStart(2)}/${entries.length}] ${file} ... `);

  try {
    const bytes = await synth(file, text);
    console.log(`OK (${bytes} bytes)`);
  } catch (err) {
    console.log("FAIL");
    console.error(String(err?.message || err));
    process.exitCode = 2;
    break;
  }

  await sleep(300);
}

console.log("");
console.log("Готово.");
console.log("Фраза «Давай найдём следующую!» удалена из success-файлов.");
console.log("API key не выводился.");
