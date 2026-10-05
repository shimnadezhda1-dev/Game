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

const entries = [
  // Ъ — не передаём символ Ъ в TTS-тексте вообще.
  ["hard-sign/learn.mp3", "Это твёрдый знак. Сам он звука не обозначает."],
  ["hard-sign/find.mp3", "Найди твёрдый знак."],
  ["hard-sign/example-1.mp3", "Подъезд. Здесь спрятался твёрдый знак."],
  ["hard-sign/example-2.mp3", "Подъёмник. Здесь спрятался твёрдый знак."],
  ["hard-sign/example-3.mp3", "Объятие. Здесь спрятался твёрдый знак."],
  ["hard-sign/success.mp3", "Молодец! Это твёрдый знак!"],

  // Ы — Fish Audio читает одиночную Ы как И.
  // Поэтому не просим TTS произносить символ отдельно.
  ["y/learn.mp3", "Это буква Ы, как в слове сыр."],
  ["y/find.mp3", "Найди букву Ы, как в слове сыр."],
  ["y/example-1.mp3", "Сыр. Найди нужную букву."],
  ["y/example-2.mp3", "Рыба. Найди нужную букву."],
  ["y/example-3.mp3", "Тыква. Найди нужную букву."],
  ["y/success.mp3", "Молодец! Правильно!"],

  // Ь — не передаём символ Ь в TTS-тексте вообще.
  ["soft-sign/learn.mp3", "Это мягкий знак. Сам он звука не обозначает."],
  ["soft-sign/find.mp3", "Найди мягкий знак."],
  ["soft-sign/example-1.mp3", "Конь. Здесь спрятался мягкий знак."],
  ["soft-sign/example-2.mp3", "Гусь. Здесь спрятался мягкий знак."],
  ["soft-sign/example-3.mp3", "Лось. Здесь спрятался мягкий знак."],
  ["soft-sign/success.mp3", "Молодец! Это мягкий знак!"],
];

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

console.log("Перегенерация специальных букв: Ъ / Ы / Ь");

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
console.log("API key не выводился.");
console.log("Перегенерированы только Ъ / Ы / Ь.");
