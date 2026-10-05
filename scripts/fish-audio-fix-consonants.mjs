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

const letters = [
  { folder:"b", letter:"Б", name:"Бэ", words:["барабан","банан","бабочка"] },
  { folder:"v", letter:"В", name:"Вэ", words:["волк","ведро","велосипед"] },
  { folder:"g", letter:"Г", name:"Гэ", words:["гриб","гусь","груша"] },
  { folder:"d", letter:"Д", name:"Дэ", words:["дом","дерево","дельфин"] },
  { folder:"zh", letter:"Ж", name:"Жэ", words:["жук","жираф","желудь"] },
  { folder:"z", letter:"З", name:"Зэ", words:["заяц","зонт","зебра"] },
  { folder:"y-short", letter:"Й", name:"И краткое", words:["йогурт","йог","йод"] },
  { folder:"k", letter:"К", name:"Ка", words:["кот","корабль","кукла"] },
  { folder:"l", letter:"Л", name:"Эль", words:["лев","лимон","ложка"] },
  { folder:"m", letter:"М", name:"Эм", words:["мяч","машина","морковь"] },
  { folder:"n", letter:"Н", name:"Эн", words:["носорог","ножницы","носок"] },
  { folder:"p", letter:"П", name:"Пэ", words:["пингвин","петух","попугай"] },
  { folder:"r", letter:"Р", name:"Эр", words:["рыба","ракета","робот"] },
  { folder:"s", letter:"С", name:"Эс", words:["слон","собака","самолёт"] },
  { folder:"t", letter:"Т", name:"Тэ", words:["тигр","трактор","торт"] },
  { folder:"f", letter:"Ф", name:"Эф", words:["фотоаппарат","фонарь","фламинго"] },
  { folder:"h", letter:"Х", name:"Ха", words:["хомяк","хлеб","холодильник"] },
  { folder:"ts", letter:"Ц", name:"Цэ", words:["цыплёнок","цапля","цветок"] },
  { folder:"ch", letter:"Ч", name:"Че", words:["чайник","часы","черепаха"] },
  { folder:"sh", letter:"Ш", name:"Ша", words:["шар","шапка","шкаф"] },
  { folder:"shch", letter:"Щ", name:"Ща", words:["щука","щётка","щит"] },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

function makeEntries({folder, name, words}) {
  return [
    [`${folder}/learn.mp3`, `Это буква ${name}. ${name} — ${words[0]}.`],
    [`${folder}/find.mp3`, `Найди букву ${name}.`],
    [`${folder}/picture.mp3`, `Что начинается на букву ${name}?`],
    [`${folder}/listen-1.mp3`, `${name} — ${words[0]}. Выбери картинку.`],
    [`${folder}/listen-2.mp3`, `${name} — ${words[1]}. Выбери картинку.`],
    [`${folder}/listen-3.mp3`, `${name} — ${words[2]}. Выбери картинку.`],
    [`${folder}/success.mp3`, `Молодец! Это буква ${name}! Давай найдём следующую!`],
  ];
}

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

const singleArg = process.argv.find(a => a.startsWith("--letter="));
const runAll = process.argv.includes("--all");

if (!singleArg && !runAll) {
  console.log("Use --all or --letter=<folder>, e.g. --letter=l");
  process.exit(0);
}

let selected = letters;
if (singleArg) {
  const folder = singleArg.split("=")[1];
  selected = letters.filter(x => x.folder === folder);
  if (!selected.length) {
    console.error(`Unknown folder: ${folder}`);
    process.exit(1);
  }
}

for (const item of selected) {
  console.log(`\n${item.letter} → ${item.name}`);
  const entries = makeEntries(item);

  for (let i = 0; i < entries.length; i++) {
    const [p, text] = entries[i];
    process.stdout.write(`[${i+1}/7] ${p} ... `);
    try {
      const bytes = await synth(p, text);
      console.log(`OK (${bytes} bytes)`);
    } catch (err) {
      console.log("FAIL");
      console.error(String(err?.message || err));
      process.exitCode = 2;
      break;
    }
    await sleep(300);
  }
}

console.log("\nГотово. API key не выводился.");
