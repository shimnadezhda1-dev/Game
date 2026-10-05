import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = resolve(ROOT, ".env.local");
const AUDIO_ROOT = resolve(ROOT, "public/assets/audio/ru");
const ENDPOINT = "https://api.fish.audio/v1/tts";
const MODEL = "s2.1-pro-free";
const EXPECTED_VOICE_ID = "ef7303ce0aaa4ffeb518b86afb6c5c9c";

const ENTRIES = [
  ["zh/learn.mp3", "Это буква Ж. Ж — жираф."],
  ["i/learn.mp3", "Это буква И. И — игла."],
  ["l/learn.mp3", "Это буква Л. Л — лимон."],
  ["o/learn.mp3", "Это буква О. О — облако."]
];

function parseEnv(source) {
  const values = {};
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separator = line.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return values;
}

function safeErrorText(text) {
  return String(text || "")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/sk-[A-Za-z0-9._-]+/g, "[redacted]");
}

const env = parseEnv(await readFile(ENV_PATH, "utf8"));
const apiKey = env.FISH_API_KEY ?? "";
const voiceId = env.FISH_VOICE_ID ?? "";

if (!apiKey || apiKey === "PASTE_KEY_HERE") {
  console.error("FISH_API_KEY is missing.");
  process.exit(1);
}
if (!voiceId) {
  console.error("FISH_VOICE_ID is missing.");
  process.exit(1);
}
if (voiceId !== EXPECTED_VOICE_ID) {
  console.error("FISH_VOICE_ID does not match the approved Anastasia voice.");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const [relativePath, text] of ENTRIES) {
  const target = resolve(AUDIO_ROOT, relativePath);
  await mkdir(dirname(target), { recursive: true });
  process.stdout.write(`${relativePath} ... `);

  let lastError = "";
  let ok = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        model: MODEL
      },
      body: JSON.stringify({
        text,
        reference_id: voiceId,
        format: "mp3"
      })
    });

    if (response.ok) {
      const audio = Buffer.from(await response.arrayBuffer());
      if (audio.length < 1000) {
        lastError = `audio too small: ${audio.length}`;
        await sleep(1000 * attempt * attempt);
        continue;
      }
      await writeFile(target, audio);
      console.log(`OK (${audio.length} bytes)`);
      ok = true;
      break;
    }

    lastError = `HTTP ${response.status}: ${safeErrorText(await response.text()).slice(0, 400)}`;
    if (response.status === 429 || response.status >= 500) {
      await sleep(1000 * attempt * attempt);
      continue;
    }
    break;
  }

  if (!ok) {
    console.log("FAIL");
    console.error(lastError);
    process.exit(1);
  }

  await sleep(800);
}

console.log("LEARN MISMATCH AUDIO: PASS");
console.log("API KEY NOT PRINTED.");
