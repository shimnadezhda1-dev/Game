import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = resolve(ROOT, ".env.local");
const OUT_PATH = resolve(ROOT, "public/assets/audio/ru/_test/anastasia-a-test.mp3");
const ENDPOINT = "https://api.fish.audio/v1/tts";
const MODEL = "s2.1-pro-free";
const TEXT = "Привет! Давай учить буквы вместе. Это буква А. А — арбуз.";
const EXPECTED_VOICE_ID = "ef7303ce0aaa4ffeb518b86afb6c5c9c";

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
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    values[key] = value;
  }
  return values;
}

function safeErrorText(text) {
  return text
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/sk-[A-Za-z0-9._-]+/g, "[redacted]");
}

const env = parseEnv(await readFile(ENV_PATH, "utf8"));
const apiKey = env.FISH_API_KEY ?? "";
const voiceId = env.FISH_VOICE_ID ?? "";

if (!apiKey || apiKey === "PASTE_KEY_HERE") {
  console.error("FISH_API_KEY is missing. Put the key in .env.local and save the file.");
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

const response = await fetch(ENDPOINT, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    model: MODEL
  },
  body: JSON.stringify({
    text: TEXT,
    reference_id: voiceId,
    format: "mp3"
  })
});

if (!response.ok) {
  const raw = safeErrorText(await response.text());
  console.error(`Fish Audio request failed: HTTP ${response.status}`);
  console.error(raw.slice(0, 400) || "No error body");
  process.exit(1);
}

const audio = Buffer.from(await response.arrayBuffer());
if (audio.length === 0) {
  console.error("Fish Audio returned an empty file.");
  process.exit(1);
}

await mkdir(dirname(OUT_PATH), { recursive: true });
await writeFile(OUT_PATH, audio);
console.log("FISH AUDIO TEST: PASS");
console.log(`Voice ID: ${voiceId}`);
console.log(`Model: ${MODEL}`);
console.log(`Bytes: ${audio.length}`);
console.log("Saved: public/assets/audio/ru/_test/anastasia-a-test.mp3");
